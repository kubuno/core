package com.kubuno.android.api.net

import com.kubuno.android.api.auth.AuthException
import com.kubuno.android.api.auth.BearerSource
import java.io.IOException
import kotlinx.coroutines.runBlocking
import okhttp3.HttpUrl
import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.Response
import okhttp3.Authenticator
import okhttp3.Route

/** Stable per-install identifier used by the server's device inventory. */
fun interface DeviceKeyProvider {
    fun deviceKey(): String
}

private val AUTH_PATHS = listOf("/api/v1/auth/")

private fun isAuthEndpoint(url: HttpUrl): Boolean =
    AUTH_PATHS.any { url.encodedPath.startsWith(it) } || url.encodedPath == "/healthz"

/**
 * Adds `Authorization: Bearer` (refreshing proactively when needed) and the
 * `X-Kubuno-Device-Key` correlation header. Auth endpoints are left alone.
 */
class AuthHeaderInterceptor(
    private val bearerProvider: () -> BearerSource,
    private val deviceKeyProvider: DeviceKeyProvider,
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val builder = request.newBuilder()
            .header("X-Kubuno-Device-Key", deviceKeyProvider.deviceKey())

        if (!isAuthEndpoint(request.url)) {
            val bearer = bearerProvider()
            val token = try {
                runBlocking { bearer.validAccessToken() }
            } catch (e: AuthException) {
                // Transient: fall through with the stale token (the request may
                // still succeed or come back 401 for the Authenticator).
                bearer.peekAccessToken()
            }
            token?.let { builder.header("Authorization", "Bearer $it") }
        }
        return chain.proceed(builder.build())
    }
}

/**
 * Single retry on 401: refresh (single-flight, inside TokenManager) and replay
 * the request once with the new access token. Gives up when the request was
 * already retried or when the session is genuinely dead.
 */
class TokenAuthenticator(private val bearerProvider: () -> BearerSource) : Authenticator {
    override fun authenticate(route: Route?, response: Response): Request? {
        if (isAuthEndpoint(response.request.url)) return null
        // Only one retry: if the failed request already carried a token issued
        // by a refresh triggered here, give up.
        if (response.priorResponse != null) return null

        val failedToken = response.request.header("Authorization")?.removePrefix("Bearer ")
        val newToken = try {
            runBlocking { bearerProvider().refreshAfter401(failedToken) }
        } catch (e: AuthException) {
            return null
        }
        if (newToken == null || newToken == failedToken) return null
        return response.request.newBuilder()
            .header("Authorization", "Bearer $newToken")
            .build()
    }
}
