package com.kubuno.android.api

import com.kubuno.android.api.model.DeclareDeviceRequest
import com.kubuno.android.api.model.LoginRequest
import com.kubuno.android.api.model.MeResponse
import com.kubuno.android.api.model.RefreshRequest
import com.kubuno.android.api.model.SessionResponse
import com.kubuno.android.api.model.TotpRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

/**
 * Core auth + account surface. Endpoints return raw [Response] so the caller
 * (TokenManager) can classify HTTP statuses precisely (401 vs 429 vs 5xx).
 */
interface AuthApi {
    @POST("api/v1/auth/login")
    suspend fun login(@Body body: LoginRequest): Response<SessionResponse>

    @POST("api/v1/auth/totp")
    suspend fun verifyTotp(@Body body: TotpRequest): Response<SessionResponse>

    @POST("api/v1/auth/refresh")
    suspend fun refresh(@Body body: RefreshRequest): Response<SessionResponse>

    @POST("api/v1/auth/logout")
    suspend fun logout(@Body body: RefreshRequest): Response<Unit>

    /** Cheap reachability probe (also used by the desktop client). */
    @GET("healthz")
    suspend fun health(): Response<Unit>

    @GET("api/v1/me")
    suspend fun me(): Response<MeResponse>

    @POST("api/v1/me/devices/declare")
    suspend fun declareDevice(@Body body: DeclareDeviceRequest): Response<Unit>
}
