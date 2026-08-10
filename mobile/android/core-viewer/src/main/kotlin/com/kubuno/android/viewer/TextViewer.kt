package com.kubuno.android.viewer

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

/**
 * Plain monospace text, like the web (which showed no syntax highlighting).
 * Lines are laid out lazily so a large file scrolls smoothly; the file is
 * capped at ~2M characters as the web does. [wrap] toggles soft-wrapping.
 */
@Composable
fun TextViewer(file: File, wrap: Boolean, modifier: Modifier = Modifier) {
    val lines = produceState<List<String>?>(initialValue = null, file) {
        value = withContext(Dispatchers.IO) {
            runCatching {
                val text = file.readText().let {
                    if (it.length > MAX_CHARS) it.take(MAX_CHARS) else it
                }
                text.split('\n')
            }.getOrDefault(emptyList())
        }
    }.value

    when (val ls = lines) {
        null -> CircularProgressIndicator(modifier.padding(24.dp))
        else -> {
            val hScroll = rememberScrollState()
            LazyColumn(
                modifier = modifier
                    .fillMaxSize()
                    .then(if (wrap) Modifier else Modifier.horizontalScroll(hScroll))
                    .padding(12.dp),
            ) {
                items(ls) { line ->
                    Text(
                        text = line.ifEmpty { " " },
                        fontFamily = FontFamily.Monospace,
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurface,
                        softWrap = wrap,
                        maxLines = if (wrap) Int.MAX_VALUE else 1,
                    )
                }
            }
        }
    }
}

private const val MAX_CHARS = 2_000_000
