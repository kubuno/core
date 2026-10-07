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
    /** Whether a second factor is enrolled. Enrolment itself is web-only. */
    @SerialName("totp_enabled") val totpEnabled: Boolean = false,
)

/** Response of GET /api/v1/me. The `privileges` object it also carries is unused here. */
@Serializable
data class MeResponse(val user: UserDto)

/**
 * One live session of the account.
 *
 * Fits both wire shapes on purpose: `GET /api/v1/me/sessions` serialises a
 * refresh-token row (no [deviceId], no [country]) while `GET /api/v1/me/devices`
 * serialises a session joined to the device inventory. Everything that is
 * exclusive to one of the two is optional.
 */
@Serializable
data class SessionDto(
    val id: String,
    @SerialName("device_id") val deviceId: String? = null,
    @SerialName("device_name") val deviceName: String? = null,
    @SerialName("device_label") val deviceLabel: String? = null,
    @SerialName("device_type") val deviceType: String? = null,
    @SerialName("client_type") val clientType: String? = null,
    @SerialName("ip_address") val ipAddress: String? = null,
    val country: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("last_used_at") val lastUsedAt: String? = null,
    @SerialName("expires_at") val expiresAt: String? = null,
)

/** Response of GET /api/v1/me/sessions. */
@Serializable
data class SessionsResponse(val sessions: List<SessionDto> = emptyList())

/**
 * Response of GET /api/v1/me/devices, reduced to what this client shows.
 *
 * [currentDeviceId] is the only "here and now" marker the API exposes: no
 * session carries a `current` flag, and a native client cannot recognise its
 * own refresh-token row (the raw token is stored hashed and its id is never
 * returned). The server resolves it from the X-Kubuno-Device-Key header this
 * client already sends on every request.
 */
@Serializable
data class MyDevicesResponse(
    val sessions: List<SessionDto> = emptyList(),
    @SerialName("current_device_id") val currentDeviceId: String? = null,
)

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
