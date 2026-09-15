package com.kubuno.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

/**
 * A selectable chip in the pill style of the web tabs (Tabs.tsx "pills"):
 * 6dp radius, active = primary-light fill with primary text, inactive = a
 * hairline-bordered surface. Squared, not the round Material chip.
 */
@Composable
fun KubunoChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    leadingIcon: @Composable (() -> Unit)? = null,
) {
    val scheme = MaterialTheme.colorScheme
    val shape = RoundedCornerShape(6.dp)
    val base = modifier
        .clip(shape)
        .background(if (selected) scheme.primaryContainer else scheme.surface)
        .border(1.dp, if (selected) Color.Transparent else scheme.outline, shape)
        .clickable(onClick = onClick)
        .padding(horizontal = 12.dp, vertical = 8.dp)
    Row(base, verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        leadingIcon?.invoke()
        Text(
            label,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            color = if (selected) scheme.primary else scheme.onSurfaceVariant,
        )
    }
}
