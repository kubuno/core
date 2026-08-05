package com.kubuno.android.api

import com.kubuno.android.api.auth.TokenManager
import com.kubuno.android.api.auth.TokenStore
import com.kubuno.android.api.net.AuthHeaderInterceptor
import com.kubuno.android.api.net.BaseUrlInterceptor
import com.kubuno.android.api.net.DeviceKeyProvider
import com.kubuno.android.api.net.TokenAuthenticator
import java.util.concurrent.TimeUnit
import kotlinx.serialization.json.Json
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

/**
 * Wires the OkHttp client, Retrofit and the [TokenManager] together.
 *
 * Construction order matters: the interceptors capture the [tokenManager]
 * property through a provider lambda, which breaks the circular dependency
 * (interceptor -> TokenManager -> AuthApi -> OkHttp -> interceptor). Nothing
 * performs a request during construction, so the late read is safe.
 */
class KubunoClient(
    tokenStore: TokenStore,
    deviceKeyProvider: DeviceKeyProvider,
    initialBaseUrl: String?,
) {
    private val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        // Without this, defaulted fields like LoginRequest.clientType="native"
        // are omitted and the server falls back to the web cookie flow.
        encodeDefaults = true
    }

    private val baseUrlInterceptor = BaseUrlInterceptor().apply {
        initialBaseUrl?.let { baseUrl = normalize(it).toHttpUrl() }
    }

    val okHttpClient: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .addInterceptor(baseUrlInterceptor)
        .addInterceptor(AuthHeaderInterceptor({ tokenManager }, deviceKeyProvider))
        .authenticator(TokenAuthenticator { tokenManager })
        .build()

    private val retrofit: Retrofit = Retrofit.Builder()
        // Placeholder — every request is rewritten by [BaseUrlInterceptor].
        .baseUrl("http://localhost/")
        .client(okHttpClient)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()

    val authApi: AuthApi = retrofit.create(AuthApi::class.java)

    val tokenManager: TokenManager = TokenManager(authApi, tokenStore)

    /** Points the client at another server (onboarding / server switch). */
    fun setServer(url: String) {
        baseUrlInterceptor.baseUrl = normalize(url).toHttpUrl()
    }

    fun hasServer(): Boolean = baseUrlInterceptor.baseUrl != null

    companion object {
        /** Accepts what users type: adds https://, strips trailing slashes. */
        fun normalize(input: String): String {
            var url = input.trim().trimEnd('/')
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                url = "https://$url"
            }
            return url
        }
    }
}
