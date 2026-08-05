package com.kubuno.android.api.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Response of GET /api/v1/drive/sync/delta. */
@Serializable
data class DriveDeltaResponse(
    val changes: List<DriveChange> = emptyList(),
    val cursor: Long,
    @SerialName("has_more") val hasMore: Boolean = false,
)

/**
 * One change from the delta feed, ordered by the monotonic [changeSeq].
 * [kind] discriminates: "file" | "folder" | "deleted". With `full=true` the
 * complete model rides along in [file] / [folder].
 */
@Serializable
data class DriveChange(
    val kind: String,
    val id: String,
    @SerialName("change_seq") val changeSeq: Long,

    // kind = file | folder
    val name: String? = null,
    val trashed: Boolean = false,

    // kind = file
    @SerialName("folder_id") val folderId: String? = null,
    val etag: String? = null,
    val size: Long? = null,
    @SerialName("mime_type") val mimeType: String? = null,

    // kind = folder
    @SerialName("parent_id") val parentId: String? = null,
    val path: String? = null,

    // kind = deleted
    val target: String? = null,
    @SerialName("deleted_at") val deletedAt: String? = null,

    // full=true payloads
    val file: DriveFileDto? = null,
    val folder: DriveFolderDto? = null,
)

/** Full file model (subset we consume — byte-compatible with GET /api/v1/drive). */
@Serializable
data class DriveFileDto(
    val id: String,
    @SerialName("folder_id") val folderId: String? = null,
    val name: String,
    @SerialName("mime_type") val mimeType: String? = null,
    @SerialName("size_bytes") val sizeBytes: Long = 0,
    @SerialName("content_hash") val contentHash: String? = null,
    @SerialName("is_starred") val isStarred: Boolean = false,
    @SerialName("is_trashed") val isTrashed: Boolean = false,
    @SerialName("has_thumbnail") val hasThumbnail: Boolean = false,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null,
)

/** Full folder model (subset we consume). */
@Serializable
data class DriveFolderDto(
    val id: String,
    @SerialName("parent_id") val parentId: String? = null,
    val name: String,
    val path: String,
    @SerialName("is_starred") val isStarred: Boolean = false,
    @SerialName("is_trashed") val isTrashed: Boolean = false,
    val color: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null,
)
