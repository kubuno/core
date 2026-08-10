package com.kubuno.android.api.auth

/**
 * A source of `Authorization: Bearer` tokens for the HTTP interceptors.
 *
 * Two implementations exist: [TokenManager], for an account this app owns
 * (it holds the refresh token and rotates it), and a brokered source, for an
 * account owned by a sibling Kubuno app (it borrows short-lived access tokens
 * through the system AccountManager and never sees the refresh token). The
 * interceptors depend only on this interface, so a client is authenticated the
 * same way whichever kind of account it serves.
 */
interface BearerSource {
    /** A valid access token, refreshed if the current one is expiring; null if
     *  there is no session. May throw [AuthException] on a genuine failure. */
    suspend fun validAccessToken(): String?

    /** The last known access token without any network activity; may be stale. */
    fun peekAccessToken(): String?

    /** Called after a 401 carrying [failedAccessToken]: obtain a fresh token. */
    suspend fun refreshAfter401(failedAccessToken: String?): String?
}
