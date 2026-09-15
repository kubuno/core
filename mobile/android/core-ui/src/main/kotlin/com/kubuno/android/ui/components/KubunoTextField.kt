package com.kubuno.android.ui.components

import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.kubuno.android.ui.theme.KubunoTheme

/**
 * The Kubuno text field, transcribed from the web design system (core/frontend/
 * src/ui/Input.tsx): the label sits ABOVE the field (never a Material notch),
 * the frame is a 6dp-radius hairline that turns primary on focus, and error /
 * hint lines read underneath. Deliberately not Compose's OutlinedTextField,
 * whose floating-label chrome does not match the web.
 */
@Composable
fun KubunoTextField(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    placeholder: String? = null,
    error: String? = null,
    hint: String? = null,
    enabled: Boolean = true,
    singleLine: Boolean = true,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    leadingIcon: @Composable (() -> Unit)? = null,
    trailingIcon: @Composable (() -> Unit)? = null,
) {
    val scheme = MaterialTheme.colorScheme
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()

    val borderColor = when {
        error != null -> scheme.error
        focused -> scheme.primary
        else -> scheme.outline
    }
    val borderWidth = if (focused || error != null) 2.dp else 1.dp

    Column(modifier, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        label?.let {
            Text(
                it,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = scheme.onSurface,
            )
        }
        Box(
            Modifier
                .fillMaxWidth()
                .heightIn(min = 36.dp)
                .border(borderWidth, borderColor, RoundedCornerShape(6.dp)),
            contentAlignment = Alignment.CenterStart,
        ) {
            Row(
                Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                leadingIcon?.invoke()
                Box(Modifier.weight(1f)) {
                    if (value.isEmpty() && placeholder != null) {
                        Text(
                            placeholder,
                            style = MaterialTheme.typography.bodyMedium,
                            color = KubunoTheme.colors.textTertiary,
                        )
                    }
                    BasicTextField(
                        value = value,
                        onValueChange = onValueChange,
                        enabled = enabled,
                        singleLine = singleLine,
                        interactionSource = interaction,
                        visualTransformation = visualTransformation,
                        keyboardOptions = keyboardOptions,
                        textStyle = LocalTextStyle.current.merge(
                            MaterialTheme.typography.bodyMedium.copy(color = scheme.onSurface),
                        ),
                        cursorBrush = SolidColor(scheme.primary),
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
                trailingIcon?.invoke()
            }
        }
        (error ?: hint)?.let {
            Text(
                it,
                style = MaterialTheme.typography.bodySmall,
                color = if (error != null) scheme.error else scheme.onSurfaceVariant,
            )
        }
    }
}
