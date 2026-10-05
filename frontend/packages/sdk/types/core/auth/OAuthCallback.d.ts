/**
 * Landing page of an SSO sign-in. The server's callback has already opened the
 * session and set the HttpOnly refresh cookie; the app's bootstrap
 * (`initialize()`, a same-origin refresh) turns it into an access token held in
 * memory. Nothing is read from a cookie here: the access token never travels in
 * a script-readable cookie.
 */
export default function OAuthCallback(): import("react").JSX.Element;
