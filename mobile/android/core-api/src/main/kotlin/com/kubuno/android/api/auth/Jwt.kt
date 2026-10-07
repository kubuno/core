package com.kubuno.android.api.auth

import java.util.Base64
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull

/** Minimal, verification-free JWT payload reader (we only need `exp` client-side). */
object Jwt {
    private val json = Json { ignoreUnknownKeys = true }

    /** Returns the `exp` claim in epoch seconds, or null if the token is not parseable. */
    fun expiresAtSeconds(token: String): Long? = runCatching {
        val payload = token.split('.').getOrNull(1) ?: return null
        val decoded = Base64.getUrlDecoder().decode(payload).decodeToString()
        json.parseToJsonElement(decoded).jsonObject["exp"]?.jsonPrimitive?.longOrNull
    }.getOrNull()
}
