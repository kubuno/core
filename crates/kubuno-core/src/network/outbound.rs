//! Outbound requests to a URL a user typed (SSRF guard).
//!
//! A user-supplied URL is fetched from the server's own network position: without
//! a guard it reaches the loopback services (the modules' ports, the database),
//! the LAN and the cloud metadata endpoints. [`resolve_public_http`] accepts an
//! `http(s)` URL only when **every** address its host resolves to is a public
//! unicast address, and returns the address to connect to, so the caller pins it
//! (`reqwest::ClientBuilder::resolve`): a DNS answer that changes between the
//! check and the connection (rebinding) cannot redirect the request inward.

use std::net::{IpAddr, Ipv4Addr, Ipv6Addr, SocketAddr};

/// Why a URL is refused. Deliberately coarse: the caller answers the client with
/// one generic message, so the server's view of its own network is not an oracle.
#[derive(Debug, PartialEq, Eq)]
pub enum OutboundError {
    /// Not an absolute `http`/`https` URL, carries credentials, or has no host.
    InvalidUrl,
    /// The host does not resolve.
    Unresolvable,
    /// The host resolves to (at least) one non-public address.
    NotPublic,
}

/// A checked target: the URL, its host and the public addresses to pin (every
/// answer, so a host whose first address is unreachable from here, e.g. IPv6 on
/// an IPv4-only network, is still reached on the next one).
#[derive(Debug, Clone)]
pub struct PublicTarget {
    pub url:   url::Url,
    pub host:  String,
    pub addrs: Vec<SocketAddr>,
}

/// Parses `raw` and checks that it names a public `http(s)` endpoint.
pub async fn resolve_public_http(raw: &str) -> Result<PublicTarget, OutboundError> {
    let url = parse_http_url(raw)?;
    let host = url.host_str().ok_or(OutboundError::InvalidUrl)?.to_string();
    let port = url.port_or_known_default().ok_or(OutboundError::InvalidUrl)?;

    let addrs: Vec<SocketAddr> = match url.host() {
        Some(url::Host::Ipv4(ip)) => vec![SocketAddr::new(IpAddr::V4(ip), port)],
        Some(url::Host::Ipv6(ip)) => vec![SocketAddr::new(IpAddr::V6(ip), port)],
        Some(url::Host::Domain(d)) => tokio::net::lookup_host((d, port))
            .await
            .map_err(|_| OutboundError::Unresolvable)?
            .collect(),
        None => return Err(OutboundError::InvalidUrl),
    };
    if addrs.is_empty() {
        return Err(OutboundError::Unresolvable);
    }
    // Every answer must be public: a name with one public and one private record
    // could otherwise be connected to on the private one.
    if addrs.iter().any(|a| !is_public_ip(a.ip())) {
        return Err(OutboundError::NotPublic);
    }
    Ok(PublicTarget { url, host, addrs })
}

/// Syntax only: absolute `http`/`https`, a host, no `user:password@`.
pub fn parse_http_url(raw: &str) -> Result<url::Url, OutboundError> {
    let url = url::Url::parse(raw.trim()).map_err(|_| OutboundError::InvalidUrl)?;
    if !matches!(url.scheme(), "http" | "https") {
        return Err(OutboundError::InvalidUrl);
    }
    if !url.username().is_empty() || url.password().is_some() || url.host().is_none() {
        return Err(OutboundError::InvalidUrl);
    }
    Ok(url)
}

/// Whether `ip` is a globally routable unicast address (not loopback, private,
/// link-local, CGNAT, unique-local, multicast, documentation, benchmarking,
/// reserved, or an IPv4 address in disguise that is any of those).
pub fn is_public_ip(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(v4) => is_public_v4(v4),
        IpAddr::V6(v6) => is_public_v6(v6),
    }
}

fn is_public_v4(ip: Ipv4Addr) -> bool {
    let [a, b, c, _] = ip.octets();
    !(ip.is_unspecified()
        || ip.is_loopback()
        || ip.is_private()
        || ip.is_link_local()
        || ip.is_broadcast()
        || ip.is_documentation()
        || ip.is_multicast()
        || a == 0                                  // "this network"
        || (a == 100 && (64..128).contains(&b))     // 100.64.0.0/10 shared address space (CGNAT)
        || (a == 192 && b == 0 && c == 0)           // 192.0.0.0/24 IETF protocol assignments
        || (a == 198 && (b == 18 || b == 19))       // 198.18.0.0/15 benchmarking
        || a >= 240)                                // 240.0.0.0/4 reserved
}

fn is_public_v6(ip: Ipv6Addr) -> bool {
    if let Some(v4) = ip.to_ipv4_mapped() {
        return is_public_v4(v4);
    }
    let seg = ip.segments();
    // NAT64 well-known prefix 64:ff9b::/96 embeds an IPv4 address.
    if seg[0] == 0x64 && seg[1] == 0xff9b && seg[2..6].iter().all(|s| *s == 0) {
        let [a, b] = seg[6].to_be_bytes();
        let [c, d] = seg[7].to_be_bytes();
        return is_public_v4(Ipv4Addr::new(a, b, c, d));
    }
    !(ip.is_unspecified()
        || ip.is_loopback()
        || ip.is_multicast()
        || (seg[0] & 0xfe00) == 0xfc00               // fc00::/7 unique local
        || (seg[0] & 0xffc0) == 0xfe80               // fe80::/10 link local
        || (seg[0] & 0xffc0) == 0xfec0               // fec0::/10 site local (deprecated)
        || (seg[0] == 0x2001 && seg[1] == 0x0db8)    // 2001:db8::/32 documentation
        || (seg[0] == 0x2002)                        // 6to4 embeds an arbitrary IPv4
        || (seg[0] == 0x2001 && seg[1] == 0)         // Teredo embeds an arbitrary IPv4
        || seg[..6].iter().all(|s| *s == 0))         // ::/96 IPv4-compatible (deprecated)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ip(s: &str) -> IpAddr {
        s.parse().expect("test address")
    }

    #[test]
    fn internal_addresses_are_not_public() {
        for s in [
            "127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.220", "169.254.169.254", "0.0.0.0",
            "100.64.0.1", "198.18.0.1", "224.0.0.1", "255.255.255.255", "240.0.0.1",
            "::1", "::", "fe80::1", "fd00::1", "fc00::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1",
            "64:ff9b::7f00:1", "2002:7f00:1::", "2001::1", "2001:db8::1", "::127.0.0.1",
        ] {
            assert!(!is_public_ip(ip(s)), "{s} must not be public");
        }
    }

    #[test]
    fn public_addresses_are_public() {
        for s in ["1.1.1.1", "57.129.12.127", "8.8.8.8", "2606:4700:4700::1111", "::ffff:1.1.1.1"] {
            assert!(is_public_ip(ip(s)), "{s} must be public");
        }
    }

    #[test]
    fn only_plain_http_urls_parse() {
        assert!(parse_http_url("https://cloud.exemple.com").is_ok());
        assert!(parse_http_url("http://cloud.exemple.com:8080/x").is_ok());
        for bad in [
            "ftp://cloud.exemple.com", "file:///etc/passwd", "cloud.exemple.com",
            "https://user:pw@cloud.exemple.com", "https://user@cloud.exemple.com", "", "http://",
        ] {
            assert_eq!(parse_http_url(bad).err(), Some(OutboundError::InvalidUrl), "{bad}");
        }
    }

    #[tokio::test]
    async fn loopback_and_private_targets_are_refused() {
        for raw in [
            "http://127.0.0.1:3114", "http://localhost:8080", "http://[::1]/", "http://192.168.1.220",
            "http://169.254.169.254/latest/meta-data", "http://0x7f000001/", "http://2130706433/",
        ] {
            let got = resolve_public_http(raw).await;
            assert!(
                matches!(got, Err(OutboundError::NotPublic) | Err(OutboundError::Unresolvable)),
                "{raw}: {got:?}"
            );
        }
    }

    #[tokio::test]
    async fn a_public_literal_is_accepted_and_pinned() {
        let t = resolve_public_http("https://1.1.1.1/").await.expect("public");
        assert_eq!(t.addrs, vec!["1.1.1.1:443".parse::<SocketAddr>().expect("addr")]);
    }
}
