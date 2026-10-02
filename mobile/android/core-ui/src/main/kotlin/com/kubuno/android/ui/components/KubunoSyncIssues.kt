package com.kubuno.android.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CloudOff
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kubuno.android.ui.R
import com.kubuno.android.ui.theme.KubunoTheme

/**
 * One local change that has not reached the server, as the sync banner shows
 * it. The app turns its own model (an outbox row) into this: core-ui knows
 * nothing of sync.
 *
 * @param title what the change is, e.g. "Renommage de « Budget.xlsx »".
 * @param detail the last error, when there is one worth showing.
 * @param rejected true when the server refused it (it waits for the user);
 *   false when it is still retried automatically.
 */
data class KubunoSyncIssue(
    val id: Long,
    val title: String,
    val detail: String?,
    val rejected: Boolean,
)

/**
 * "N changes not synced" banner, shown above a screen while some local
 * changes have not reached the server. Nothing is shown when [issues] is
 * empty. "Retry" retries them all; "Details" lists them with a per-item retry
 * and discard (discarding asks for confirmation: the local change is undone).
 */
@Composable
fun KubunoSyncIssuesBanner(
    issues: List<KubunoSyncIssue>,
    onRetryAll: () -> Unit,
    onRetry: (Long) -> Unit,
    onDiscard: (Long) -> Unit,
    modifier: Modifier = Modifier,
) {
    if (issues.isEmpty()) return
    var showDetails by remember { mutableStateOf(false) }

    val scheme = MaterialTheme.colorScheme
    val kb = KubunoTheme.colors
    val anyRejected = issues.any { it.rejected }
    val box = if (anyRejected) scheme.errorContainer else kb.warningContainer
    val tint = if (anyRejected) scheme.error else kb.warning

    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(6.dp),
        color = box,
        border = BorderStroke(1.dp, scheme.outline),
    ) {
        Row(
            Modifier.padding(start = 12.dp, end = 8.dp, top = 8.dp, bottom = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                if (anyRejected) Icons.Outlined.ErrorOutline else Icons.Outlined.CloudOff,
                contentDescription = null,
                tint = tint,
                modifier = Modifier.size(20.dp),
            )
            Column(Modifier.weight(1f).padding(start = 10.dp)) {
                Text(
                    if (issues.size == 1) stringResource(R.string.kubuno_sync_issues_one)
                    else stringResource(R.string.kubuno_sync_issues_many, issues.size),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = scheme.onSurface,
                )
                Text(
                    stringResource(
                        if (anyRejected) R.string.kubuno_sync_issues_rejected_hint
                        else R.string.kubuno_sync_issues_retrying_hint
                    ),
                    style = MaterialTheme.typography.bodySmall,
                    color = scheme.onSurfaceVariant,
                )
            }
            KubunoButton(
                text = stringResource(R.string.kubuno_sync_details),
                onClick = { showDetails = true },
                variant = KubunoButtonVariant.TEXT,
                size = KubunoButtonSize.SM,
            )
            KubunoButton(
                text = stringResource(R.string.kubuno_sync_retry),
                onClick = onRetryAll,
                variant = KubunoButtonVariant.SECONDARY,
                size = KubunoButtonSize.SM,
            )
        }
    }

    if (showDetails) {
        KubunoSyncIssuesDialog(
            issues = issues,
            onRetry = onRetry,
            onDiscard = onDiscard,
            onDismiss = { showDetails = false },
        )
    }
}

/** The list behind the banner's "Details": each change with Retry / Discard. */
@Composable
fun KubunoSyncIssuesDialog(
    issues: List<KubunoSyncIssue>,
    onRetry: (Long) -> Unit,
    onDiscard: (Long) -> Unit,
    onDismiss: () -> Unit,
) {
    var confirmDiscard by remember { mutableStateOf<KubunoSyncIssue?>(null) }
    val scheme = MaterialTheme.colorScheme

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.kubuno_sync_details_title), style = MaterialTheme.typography.titleMedium) },
        text = {
            Column(
                Modifier.heightIn(max = 420.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (issues.isEmpty()) {
                    Text(stringResource(R.string.kubuno_sync_all_done), style = MaterialTheme.typography.bodyMedium)
                }
                issues.forEachIndexed { index, issue ->
                    if (index > 0) KubunoSeparator()
                    Column(Modifier.fillMaxWidth()) {
                        Text(
                            issue.title,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = scheme.onSurface,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Text(
                            stringResource(
                                if (issue.rejected) R.string.kubuno_sync_state_rejected
                                else R.string.kubuno_sync_state_retrying
                            ),
                            style = MaterialTheme.typography.bodySmall,
                            color = if (issue.rejected) scheme.error else scheme.onSurfaceVariant,
                        )
                        issue.detail?.let {
                            Text(
                                it,
                                style = MaterialTheme.typography.bodySmall,
                                color = scheme.onSurfaceVariant,
                                maxLines = 3,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                        Row(
                            Modifier.fillMaxWidth().padding(top = 4.dp),
                            horizontalArrangement = Arrangement.End,
                        ) {
                            KubunoButton(
                                text = stringResource(R.string.kubuno_sync_discard),
                                onClick = { confirmDiscard = issue },
                                variant = KubunoButtonVariant.TEXT_DANGER,
                                size = KubunoButtonSize.SM,
                            )
                            KubunoButton(
                                text = stringResource(R.string.kubuno_sync_retry),
                                onClick = { onRetry(issue.id) },
                                variant = KubunoButtonVariant.SECONDARY,
                                size = KubunoButtonSize.SM,
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            KubunoButton(
                text = stringResource(R.string.kubuno_close),
                onClick = onDismiss,
                variant = KubunoButtonVariant.GHOST,
                size = KubunoButtonSize.SM,
            )
        },
        shape = RoundedCornerShape(8.dp),
    )

    confirmDiscard?.let { issue ->
        KubunoConfirmDialog(
            title = stringResource(R.string.kubuno_sync_discard_title),
            message = stringResource(R.string.kubuno_sync_discard_message, issue.title),
            confirmText = stringResource(R.string.kubuno_sync_discard),
            danger = true,
            onConfirm = {
                onDiscard(issue.id)
                confirmDiscard = null
            },
            onDismiss = { confirmDiscard = null },
        )
    }
}
