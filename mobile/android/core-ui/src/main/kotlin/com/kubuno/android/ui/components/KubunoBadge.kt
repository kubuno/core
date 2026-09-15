package com.kubuno.android.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kubuno.android.ui.theme.KubunoTheme

/**
 * The Kubuno badge, from the web design system (Badge.tsx): a pill with a tinted
 * container and matching text, an optional leading dot. font-medium, radius full.
 */
enum class KubunoBadgeVariant { DEFAULT, PRIMARY, SUCCESS, WARNING, DANGER, NEUTRAL }

@Composable
fun KubunoBadge(
    text: String,
    modifier: Modifier = Modifier,
    variant: KubunoBadgeVariant = KubunoBadgeVariant.DEFAULT,
    dot: Boolean = false,
) {
    val scheme = MaterialTheme.colorScheme
    val kb = KubunoTheme.colors
    val (container, content, dotColor) = when (variant) {
        KubunoBadgeVariant.DEFAULT -> Triple(scheme.surfaceVariant, scheme.onSurfaceVariant, kb.textTertiary)
        KubunoBadgeVariant.PRIMARY -> Triple(scheme.primaryContainer, scheme.primary, scheme.primary)
        KubunoBadgeVariant.SUCCESS -> Triple(kb.successContainer, kb.success, kb.success)
        KubunoBadgeVariant.WARNING -> Triple(kb.warningContainer, kb.warning, kb.warning)
        KubunoBadgeVariant.DANGER -> Triple(scheme.errorContainer, scheme.error, scheme.error)
        KubunoBadgeVariant.NEUTRAL -> Triple(scheme.surfaceContainerHigh, scheme.onSurface, scheme.onSurfaceVariant)
    }
    Surface(modifier = modifier, shape = CircleShape, color = container) {
        Row(
            Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            if (dot) {
                Surface(Modifier.size(6.dp).clip(CircleShape), shape = CircleShape, color = dotColor) {}
            }
            Text(
                text,
                color = content,
                fontSize = 12.sp,
                lineHeight = 16.sp,
                fontWeight = FontWeight.Medium,
            )
        }
    }
}
