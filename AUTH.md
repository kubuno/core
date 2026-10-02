# Authenticating browser-initiated requests: signed tickets

This document describes how Kubuno authenticates the requests a browser makes
**by itself**, without the web client's `Authorization` header. These are an
`<img src>`, a `<video>`/`<audio>` and its Range requests, an `<iframe>`
preview, a download performed as a navigation, an `EventSource` and a
`WebSocket` handshake. It also records why the previous mechanism was removed.

## 1. What changed and why

Until this release the web client wrote the access token (a 15-minute JWT valid
for the whole API) into an `access_token` cookie **from JavaScript**. Every
script running in the page could read that cookie, so one XSS anywhere, in the
core or in any module, was enough to steal a credential for every module.

That cookie is gone. The client never writes the access token to a cookie
again, and on start-up it erases the one older versions left behind. The
requests that relied on the cookie now carry a **signed ticket** in their URL:

```
GET /api/v1/drive/0b6f…/thumbnail?v=3&kt=kt1.eyJ1aWQiOi….Q2x…
```

## 2. The ticket

### 2.1 Format

```
kt1.<base64url(JSON claims)>.<base64url(HMAC-SHA-256(key, "kt1." + payload))>
key = HMAC-SHA-256(auth.jwt_secret, "kubuno/ticket/v1")
```

The key is derived from the instance secret under its own label. A ticket can
therefore never be mistaken for a JWT signed by the same secret, and a JWT can
never pass for a ticket. The signature is checked in constant time before the
payload is trusted.

| claim  | meaning |
|--------|---------|
| `uid`  | The account the ticket acts for. |
| `sid`  | The session it was minted from (the refresh-token family). |
| `aud`  | The audience: `core`, or a module id such as `drive`. |
| `path` | The exact request path, for example `/api/v1/drive/<id>/download`. The query string is not bound. |
| `mth`  | The HTTP method (`GET`, which also admits `HEAD`). |
| `pur`  | The purpose: `view`, `download`, `stream` or `socket`. It decides the lifetime. |
| `exp`  | The expiry, in Unix seconds. |
| `once` | Optional nonce. When present, the ticket is spent by its first successful use. |

### 2.2 Lifetimes

| purpose    | default lifetime | setting | used for |
|------------|------------------|---------|----------|
| `view`     | 150–300 s | `auth.ticket_ttl_secs` (30..900) | Images, thumbnails, previews. |
| `download` | 150–300 s, or exactly 300 s when one-time | `auth.ticket_ttl_secs` | Files the browser saves. |
| `stream`   | 2–4 h | `auth.ticket_stream_ttl_secs` (60..86400) | `<video>`/`<audio>`, PDF viewers, `EventSource`. |
| `socket`   | 30–60 s | fixed | A WebSocket handshake. It is checked only at connect. |

A reusable ticket expires on a **time-bucket boundary** (half its TTL). Asking
twice for the same resource within a bucket therefore yields **the same URL**,
which keeps the browser's HTTP cache working for thumbnails. Without the bucket,
every fresh ticket would be a new URL and a new download.

A stream ticket lives for hours because a media element keeps issuing Range
requests for as long as it plays, and changing its `src` would restart
playback. Its lifetime does **not** extend past the session: see §5.

### 2.3 Binding: what a ticket cannot be used for

A ticket is refused (and logged with the reason, never with the ticket) when:

* the signature does not verify (forged, tampered with, or another instance's) → **401**;
* it is expired or malformed → **401**;
* its `aud` is not the module serving the request. A ticket minted for drive and
  presented on `/api/v1/photos/…` is refused → **403**;
* its `path` is not the request path, byte for byte (no prefix, no trailing slash,
  no dot segments) → **403**;
* its method does not match (a `GET` ticket cannot `DELETE`) → **403**;
* it is one-time and was already used → **403**;
* the session it names has ended (sign-out, revocation, expiry) → **401**;
* the account is deactivated → **401**.

When a request carries an `Authorization` header, the header wins and the ticket
is ignored. A ticket can never be combined with another identity.

## 3. Obtaining a ticket

```
POST /api/v1/auth/tickets
Authorization: Bearer <session access token>
{ "urls": ["/api/v1/drive/<id>/thumbnail?v=3", …],   // 1..200, same order in the reply
  "purpose": "view" | "download" | "stream" | "socket", // default "view"
  "method": "GET",                                      // only GET is issued
  "once": false }                                       // downloads only

200 { "tickets": [ { "url": "/api/v1/drive/<id>/thumbnail?v=3&kt=kt1.…", "expires_at": 1790000000 }, … ] }
```

* Tickets are minted **only from a session bearer in the header**. A cookie
  cannot mint one, so the endpoint is not a CSRF target. A ticket cannot mint
  one either, so a stolen URL does not grow into new capabilities. A personal
  API token gets `403`: a script already holds a header, and its narrowed scopes
  must not turn into a session-shaped capability.
* The URL must be a same-origin absolute path under `/api/v1/`, or one of the
  core sockets (`/ws`, `/collab/<room>/sync`). URLs with a scheme or an
  authority, dot segments, encoded slashes or backslashes, fragments or control
  characters are refused (`422`).
* The audience is resolved on the server. It is the module id when
  `/api/v1/<id>/…` names an active module, and `core` otherwise.
* The route sits outside the sign-in rate limiter, because a page of thumbnails
  is one call of up to 200 URLs. It stays under the global limits.

### 3.1 In a frontend: `@kubuno/sdk`

```ts
import { useSignedUrl, signedUrl, downloadSignedUrl, openSignedUrl, signedSocketUrl } from '@kubuno/sdk'

const src = useSignedUrl(`/api/v1/drive/${id}/thumbnail`)            // undefined while loading
<video src={useSignedUrl(url, { purpose: 'stream' })} />
img.src = await signedUrl(storedUrl)                                    // canvas, new Image()
await downloadSignedUrl(`/api/v1/drive/${id}/download`)                 // one-time ticket
await openSignedUrl(url)                                                // new tab, popup-safe
const ws = new WebSocket(await signedSocketUrl('/api/v1/chat/ws'))      // fresh on each reconnect
const es = new EventSource(await signedUrl(url, { purpose: 'stream' }))
```

The helpers batch every request made in the same tick into one POST, and cache
answers until shortly before they expire. They return a URL unchanged when it
needs no ticket: another origin, `blob:`/`data:`, or a known public core route
(avatars, themes, `config`). They forget every cached ticket on sign-in,
sign-out and account switch, so a URL minted for one account is never handed to
another. `useSignedUrl` re-issues before expiry while it stays mounted, except
for `stream`.

Native clients (desktop, Android) are unaffected. They send the `Authorization`
header, and on their WebSockets they keep sending `?token=<access token>`, which
the core still accepts.

## 4. Validation: core proxy, not modules

Tickets are validated in exactly two places:

1. **The module proxy** (`crates/kubuno-core/src/modules/proxy.rs`), for every
   `/api/v1/<module>/…` request, HTTP and WebSocket. A valid ticket resolves the
   account, and the proxy forwards the same signed identity (`X-Kubuno-Auth`,
   kubuno-modauth, audience-bound to the module) as for a bearer, with
   `X-Kubuno-Auth-Origin: ticket`. **Modules need no code and no crate update.**
   The `kt` parameter is removed from the URL before forwarding, so a module
   never sees, logs or re-emits a ticket.
2. **The `AuthUser` extractor** (`crates/kubuno-core/src/auth/middleware.rs`), for
   the core's own routes (exports, for instance), with audience `core`. The
   core's `/ws` and `/collab/<room>/sync` sockets accept `?kt=` (a socket ticket)
   in addition to `?token=`.

Module isolation follows from the audience. Even with an identical secret, a
ticket names one module, and the proxy compares it with the module it is about
to call. A module cannot mint tickets: only the core holds the key, and modules
never see the instance secret.

## 5. Sign-out and revocation

Access tokens now carry the session id (`sid`, the refresh-token family, or the
session row id). A ticket copies it. On every use, the core checks that the
session still has a live, unrevoked refresh token. A positive answer is cached
for 5 s, so a sign-out takes effect within 5 s, even for a 4-hour stream
ticket. Revoking a session from the device list, a password change that revokes
sessions, and the "sign out everywhere" action all have the same effect.
Deactivating the account stops tickets at once.

Tokens issued before this release have no `sid`. Tickets minted from them are
bounded only by their expiry until the next token refresh (at most 15 minutes).

## 6. Range requests, caching and logs

* A `stream` ticket is reusable. Each Range request of a media element presents
  it again and is validated again. `Range`/`If-Range` and the `206`/`Content-Range`
  responses flow through the proxy unchanged.
* A response to a ticketed request is never stored by a shared cache. The proxy
  rewrites `Cache-Control`: it drops `public` and `s-maxage`, adds `private`,
  and keeps the browser-side directives (`max-age`, `immutable`), so thumbnails
  stay cached in the tab. When the module sends no `Cache-Control`, the proxy
  sets `private, no-cache`. A CDN in front of Kubuno must not cache `/api/v1`.
  With these headers, a compliant one will not.
* The proxy also adds `Referrer-Policy: no-referrer`, so a ticket does not leave
  as a `Referer` header (for example from a PDF or an HTML file opened in a
  tab).
* The access log replaces the values of `kt`, `token` and `access_token` with
  `REDACTED`, in both the request line and the `Referer`.

## 7. Public resources

The following need no ticket and must stay public, because they are fetched
before sign-in or by third parties:

* user avatars (`/api/v1/users/<id>/avatar[/original]`);
* theme assets and module bundles;
* `/api/v1/config`;
* public share links (drive `share/<token>`, photos `share/<token>`, office
  `public/<token>`, maps `sketches/public/<token>`);
* public calendar feeds and RSVP pages, CalDAV/CardDAV/WebDAV (their own
  credentials), and public forms.

The SDK helpers pass these through unchanged. A ticket on a public route is
harmless.

## 8. Compatibility and deprecation: `auth.legacy_access_cookie`

For **one release**, `auth.legacy_access_cookie` (default `true`) keeps module
frontends built before signed tickets working:

* the core sets the `access_token` cookie **itself**, on sign-in, refresh,
  account switch and SSO sign-in, with `HttpOnly; SameSite=Strict;
  Path=/api/v1`. Scripts cannot read it (`document.cookie` no longer shows an
  access token, whatever the flag), which removes the XSS exposure;
* the proxy and `AuthUser` still accept that cookie on a request without a header
  or a ticket. Each use logs a deprecation warning (at most once an hour per
  module) naming the module, so an operator can tell which module to update;
* sign-out clears the cookie, both the server-set variant and the
  script-written one.

Set it to `false` once every installed module is up to date. The flag and the
cookie path will be removed in the next release.

## 9. Known limits

* **Stored URLs.** Some documents store an authenticated URL, such as a drive
  image inserted in an office document or a font imported from drive. Such a
  URL is re-signed at render time (`signedUrl()`) and never stored with a
  ticket.
* **Native HLS on Safari.** hls.js requests carry the bearer header. Safari's
  native HLS player (no MSE) fetches the segment URIs rewritten by the media
  module without a ticket. On such browsers, live TV still depends on the
  compatibility cookie.
* **Multiple core processes.** The one-time nonce store is per process. With
  several core processes behind a load balancer, a one-time ticket could be
  replayed once on each process within its 5-minute life.
