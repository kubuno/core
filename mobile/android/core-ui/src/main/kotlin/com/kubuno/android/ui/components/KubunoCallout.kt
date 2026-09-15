package com.kubuno.android.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.kubuno.android.ui.theme.KubunoTheme

/**
 * The Kubuno callout, from the web design system (Callout.tsx): a tinted box with
 * a hairline border, a leading status glyph, an optional bold title and body.
 */
enum class KubunoCalloutVariant { INFO, SUCCESS, WARNING, DANGER }

@Composable
fun KubunoCallout(
    text: String,
    modifier: Modifier = Modifier,
    variant: KubunoCalloutVariant = KubunoCalloutVariant.INFO,
    title: String? = null,
) {
    val scheme = MaterialTheme.colorScheme
    val kb = KubunoTheme.colors
    val (box, tint, glyph) = when (variant) {
        KubunoCalloutVariant.INFO -> Triple(scheme.primaryContainer, scheme.primary, Icons.Filled.Info as ImageVector)
        KubunoCalloutVariant.SUCCESS -> Triple(kb.successContainer, kb.success, Icons.Filled.CheckCircle)
        KubunoCalloutVariant.WARNING -> Triple(kb.warningContainer, kb.warning, Icons.Filled.Warning)
        KubunoCalloutVariant.DANGER -> Triple(scheme.errorContainer, scheme.error, Icons.Outlined.ErrorOutline)
    }
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(6.dp),
        color = box,
        border = BorderStroke(1.dp, scheme.outline),
    ) {
        Row(Modifier.padding(horizontal = 12.dp, vertical = 10.dp)) {
            Icon(glyph, contentDescription = null, tint = tint, modifier = Modifier.size(20.dp))
            Column(Modifier.padding(start = 10.dp)) {
                title?.let {
                    Text(it, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = scheme.onSurface)
                }
                Text(
                    text,
                    style = MaterialTheme.typography.bodyMedium,
                    color = scheme.onSurface,
                    modifier = if (title != null) Modifier.padding(top = 2.dp) else Modifier,
                )
            }
        }
    }
}
