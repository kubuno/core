package com.kubuno.android.api.auth

/**
 * The persisted session. [lastRefreshAtMs] is the wall-clock time of the last
 * successful rotation; a pair rotated less than [TokenManager.FRESH_TTL_MS] ago
 * is adopted as-is instead of being rotated again.
 */
data class StoredTokens(
    val accessToken: String,
    val refreshToken: String,
    val lastRefreshAtMs: Long,
)

/**
 * Durable, atomic storage for the session tokens.
 *
 * The contract matters more than the mechanism: [save] MUST be atomic and MUST
 * complete before the new refresh token is used for any request. Replaying a
 * rotated-away refresh token revokes the whole session family (reuse_detected);
 * the server's 24h rotation grace only saves us while the successor has never
 * been used.
 */
interface TokenStore {
    fun load(): StoredTokens?
    fun save(tokens: StoredTokens)
    fun clear()
}
