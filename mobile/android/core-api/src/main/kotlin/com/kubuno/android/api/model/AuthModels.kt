package com.kubuno.android.api.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Body of POST /api/v1/auth/login. `client_type: "native"` selects the body-token flow (no cookie). */
@Serializable
data class LoginRequest(
    val login: String,
    val password: String,
    @SerialName("client_type") val clientType: String = "native",
    @SerialName("device_name") val deviceName: String? = null,
    @SerialName("device_type") val deviceType: String? = "mobile",
)

/** Body of POST /api/v1/auth/totp (second step when login answered `requires_totp`). */
@Serializable
data class TotpRequest(
    val code: String? = null,
    @SerialName("backup_code") val backupCode: String? = null,
    @SerialName("totp_session") val totpSession: String,
    @SerialName("client_type") val clientType: String = "native",
)

/** Body of POST /api/v1/auth/refresh and /logout (native clients send the token in the body). */
@Serializable
data class RefreshRequest(
    @SerialName("refresh_token") val refreshToken: String,
)

/**
 * Union of the possible login/totp/refresh responses.
 *
 * - Native success: `access_token`, `refresh_token`, `refresh_expires_at`, `user`.
 * - 2FA challenge: `requires_totp: true` + `totp_session` (not modelled in the OpenAPI spec).
 */
@Serializable
data class SessionResponse(
    @SerialName("access_token") val accessToken: String? = null,
    @SerialName("refresh_token") val refreshToken: String? = null,
    @SerialName("refresh_expires_at") val refreshExpiresAt: String? = null,
    val user: UserDto? = null,
    @SerialName("requires_totp") val requiresTotp: Boolean = false,
    @SerialName("totp_session") val totpSession: String? = null,
)

@Serializable
data class UserDto(
    val id: String,
    val email: String? = null,
    val username: String? = null,
    @SerialName("display_name") val displayName: String? = null,
    val role: String? = null,
    @SerialName("avatar_url") val avatarUrl: String? = null,
)

/** Response of GET /api/v1/me. */
@Serializable
data class MeResponse(val user: UserDto)

/**
 * Body of POST /api/v1/me/devices/declare (requires the X-Kubuno-Device-Key header).
 * All fields are optional server-side; omitted fields keep their previous value.
 */
@Serializable
data class DeclareDeviceRequest(
    val platform: String? = null,
    @SerialName("platform_version") val platformVersion: String? = null,
    @SerialName("app_version") val appVersion: String? = null,
    @SerialName("disk_encrypted") val diskEncrypted: Boolean? = null,
    @SerialName("screen_lock") val screenLock: Boolean? = null,
)
