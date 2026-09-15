package com.kubuno.android.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

/**
 * The Kubuno card, transcribed from the web design system (core/frontend/src/
 * ui/Card.tsx): a white surface with an 8dp radius and a hairline border, an
 * optional header band separated by a hairline, and token-driven padding.
 */
@Composable
fun KubunoCard(
    modifier: Modifier = Modifier,
    title: String? = null,
    subtitle: String? = null,
    icon: @Composable (() -> Unit)? = null,
    actions: @Composable (() -> Unit)? = null,
    footer: @Composable (() -> Unit)? = null,
    dense: Boolean = false,
    flush: Boolean = false,
    content: @Composable () -> Unit,
) {
    val scheme = MaterialTheme.colorScheme
    val headerPad = if (dense) PaddingValues(horizontal = 12.dp, vertical = 10.dp)
    else PaddingValues(horizontal = 16.dp, vertical = 12.dp)
    val bodyPad = when {
        flush -> PaddingValues(0.dp)
        dense -> PaddingValues(12.dp)
        else -> PaddingValues(16.dp)
    }
    val hasHeader = title != null || icon != null || actions != null

    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(8.dp),
        color = scheme.surface,
        border = BorderStroke(1.dp, scheme.outline),
    ) {
        Column(Modifier.fillMaxWidth()) {
            if (hasHeader) {
                Row(
                    Modifier.fillMaxWidth().padding(headerPad),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    icon?.invoke()
                    Column(Modifier.weight(1f)) {
                        title?.let {
                            Text(it, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                        }
                        subtitle?.let {
                            Text(it, style = MaterialTheme.typography.bodySmall, color = scheme.onSurfaceVariant)
                        }
                    }
                    actions?.invoke()
                }
                HorizontalDivider(color = scheme.outline)
            }
            Column(Modifier.fillMaxWidth().padding(bodyPad)) { content() }
            footer?.let {
                HorizontalDivider(color = scheme.outline)
                Column(Modifier.fillMaxWidth().padding(headerPad)) { it() }
            }
        }
    }
}
