package com.kubuno.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.kubuno.android.ui.theme.KubunoTheme
import kotlin.math.roundToInt

/** A hairline separator (Separator.tsx): `bg-border`, 1px. */
@Composable
fun KubunoSeparator(modifier: Modifier = Modifier, vertical: Boolean = false) {
    val color = MaterialTheme.colorScheme.outline
    if (vertical) {
        Box(modifier.width(1.dp).fillMaxHeight().background(color))
    } else {
        Box(modifier.height(1.dp).fillMaxWidth().background(color))
    }
}

enum class KubunoSpinnerSize(val dp: Int, val stroke: Int) { XS(12, 1), SM(16, 2), MD(24, 2), LG(32, 3) }

/** A spinner (Spinner.tsx): a track ring with a primary arc, spinning. */
@Composable
fun KubunoSpinner(modifier: Modifier = Modifier, size: KubunoSpinnerSize = KubunoSpinnerSize.MD) {
    CircularProgressIndicator(
        modifier = modifier.size(size.dp.dp),
        color = MaterialTheme.colorScheme.primary,
        trackColor = MaterialTheme.colorScheme.outline,
        strokeWidth = size.stroke.dp,
    )
}

enum class KubunoProgressVariant { PRIMARY, SUCCESS, WARNING, DANGER }

/**
 * A progress bar (ProgressBar.tsx): an optional label/value row over a rounded
 * track. Pass [progress] 0..1, or null for an indeterminate bar.
 */
@Composable
fun KubunoProgressBar(
    progress: Float?,
    modifier: Modifier = Modifier,
    label: String? = null,
    showValue: Boolean = true,
    variant: KubunoProgressVariant = KubunoProgressVariant.PRIMARY,
    thick: Boolean = false,
) {
    val scheme = MaterialTheme.colorScheme
    val kb = KubunoTheme.colors
    val fill = when (variant) {
        KubunoProgressVariant.PRIMARY -> scheme.primary
        KubunoProgressVariant.SUCCESS -> kb.success
        KubunoProgressVariant.WARNING -> kb.warning
        KubunoProgressVariant.DANGER -> scheme.error
    }
    Column(modifier) {
        if (label != null || (showValue && progress != null)) {
            Row(
                Modifier.fillMaxWidth().padding(bottom = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                label?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = scheme.onSurfaceVariant) }
                if (showValue && progress != null) {
                    Text("${(progress.coerceIn(0f, 1f) * 100).roundToInt()} %", style = MaterialTheme.typography.bodySmall, color = scheme.onSurfaceVariant)
                }
            }
        }
        val trackShape = RoundedCornerShape(50)
        val h = if (thick) 8.dp else 6.dp
        val barModifier = Modifier.fillMaxWidth().height(h).clip(trackShape)
        if (progress == null) {
            LinearProgressIndicator(
                modifier = barModifier,
                color = fill,
                trackColor = scheme.surfaceVariant,
            )
        } else {
            LinearProgressIndicator(
                progress = { progress.coerceIn(0f, 1f) },
                modifier = barModifier,
                color = fill,
                trackColor = scheme.surfaceVariant,
                gapSize = 0.dp,
                drawStopIndicator = {},
            )
        }
    }
}
