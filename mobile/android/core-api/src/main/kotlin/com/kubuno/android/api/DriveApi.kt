package com.kubuno.android.api

import com.kubuno.android.api.model.DriveDeltaResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Query

/** Drive module surface (proxied by the core under /api/v1/drive). */
interface DriveApi {
    /**
     * Cursor-based incremental sync. `cursor=0` yields the full snapshot;
     * page until `has_more` is false, persisting the cursor with each page.
     */
    @GET("api/v1/drive/sync/delta")
    suspend fun delta(
        @Query("cursor") cursor: Long,
        @Query("limit") limit: Int = 2000,
        @Query("full") full: Boolean = true,
    ): Response<DriveDeltaResponse>
}
