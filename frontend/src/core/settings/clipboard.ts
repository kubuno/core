/**
 * Clipboard fallback used by the settings sections when `navigator.clipboard`
 * is unavailable (insecure context, older browsers).
 */
export function fallbackCopy(text: string, onSuccess: () => void) {
  const el = document.createElement('textarea')
  el.value = text
  el.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
  document.body.appendChild(el)
  el.focus()
  el.select()
  try { document.execCommand('copy'); onSuccess() } catch { /* ignored */ }
  document.body.removeChild(el)
}
