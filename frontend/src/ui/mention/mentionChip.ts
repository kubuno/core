import type { MentionItem, MentionMatch } from './types'

const STYLE_ID = 'kb-mention-styles'

// The chip is injected as raw HTML into a contenteditable that may live in ANY
// module bundle, so its look must not depend on a stylesheet shipped elsewhere.
// We inject a single <style> once (idempotent). Colours read the module accent
// tokens (`--color-primary*`, resolved per `[data-module]`), with plain hex
// fallbacks so a chip is always legible even outside a themed subtree.
export function ensureMentionStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
.kb-mention{display:inline-flex;align-items:center;gap:.125em;padding:0 .15em 0 .5em;border-radius:9999px;
  background:var(--color-primary-light,#d3e3fd);color:var(--color-primary,#1a73e8);font-weight:600;
  line-height:1.4;white-space:nowrap;vertical-align:baseline;text-decoration:none;}
.kb-mention__label{padding:.05em 0;}
.kb-mention__remove{display:inline-flex;align-items:center;justify-content:center;width:1.15em;height:1.15em;
  border:0;padding:0;margin:0;background:transparent;border-radius:9999px;font:inherit;font-size:1em;line-height:1;
  color:inherit;opacity:.55;cursor:pointer;user-select:none;}
.kb-mention__remove:hover{opacity:1;background:rgba(0,0,0,.10);}
`
  document.head.appendChild(style)
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** The chip's marker so a delegated click handler can spot the × button. */
export const MENTION_REMOVE_ATTR = 'data-kb-mention-remove'

/** Build the chip HTML (contenteditable=false island + clickable ×). */
export function buildMentionChipHtml(item: MentionItem): string {
  const attrs = [
    `data-mention-id="${esc(item.id)}"`,
    item.email ? `data-email="${esc(item.email)}"` : '',
    item.kubunoUserId ? `data-user-id="${esc(item.kubunoUserId)}"` : '',
  ].filter(Boolean).join(' ')
  return (
    `<span class="kb-mention" contenteditable="false" ${attrs}>` +
      `<span class="kb-mention__label">${esc(item.label)}</span>` +
      `<button type="button" class="kb-mention__remove" tabindex="-1" aria-label="Retirer" ${MENTION_REMOVE_ATTR}="1">×</button>` +
    `</span>`
  )
}

/**
 * Replace the typed `@query` before the caret with a mention chip, inside the
 * current selection's contenteditable. Uses `execCommand('insertHTML', …)` on a
 * range that spans `@query`, which keeps the NATIVE undo stack intact (a manual
 * DOM splice would sever it — the lesson from the chat editor). Returns whether
 * the replacement succeeded.
 */
export function replaceMentionQueryWithChip(match: MentionMatch, item: MentionItem): boolean {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return false
  const range = sel.getRangeAt(0)
  const node = range.startContainer
  const caret = range.startOffset
  const span = match.query.length + match.trigger.length
  if (node.nodeType !== Node.TEXT_NODE || caret < span) return false

  // Select the `@query` slice ending at the caret, then overwrite it.
  const sub = document.createRange()
  sub.setStart(node, caret - span)
  sub.setEnd(node, caret)
  sel.removeAllRanges()
  sel.addRange(sub)

  const html = buildMentionChipHtml(item) + ' '
  const ok = document.execCommand('insertHTML', false, html)
  return ok
}

/**
 * Wire a delegated listener that removes a chip when its × is clicked. Returns a
 * cleanup function. Removal goes through `execCommand('delete')` on a range that
 * covers the chip so it too stays on the undo stack.
 */
export function bindMentionChipRemoval(root: HTMLElement, onAfterRemove?: () => void): () => void {
  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null
    const btn = target?.closest?.(`[${MENTION_REMOVE_ATTR}]`)
    if (!btn) return
    const chip = btn.closest('.kb-mention')
    if (!chip || !root.contains(chip)) return
    e.preventDefault()
    e.stopPropagation()
    const range = document.createRange()
    range.selectNode(chip)
    // Extend over a trailing NBSP/space so the chip and its pad vanish together.
    const next = chip.nextSibling
    if (next && next.nodeType === Node.TEXT_NODE) {
      const txt = next.textContent ?? ''
      if (/^[ \s]/.test(txt)) range.setEnd(next, 1)
    }
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    if (!document.execCommand('delete')) {
      // Fallback if execCommand is unavailable.
      range.deleteContents()
    }
    onAfterRemove?.()
  }
  root.addEventListener('click', onClick)
  return () => root.removeEventListener('click', onClick)
}

/**
 * Post-process mention HTML for storage/transport.
 *  - `'mailto'` (default): each `.kb-mention[data-email]` becomes
 *    `<a href="mailto:…">label</a>` (used by mail); chips without an email
 *    collapse to their plain label.
 *  - `'plain'`: every chip collapses to its plain label text.
 * Other modes are intentionally left for later (id-based refs, etc.).
 */
export function serializeMentions(html: string, mode: 'mailto' | 'plain' = 'mailto'): string {
  if (typeof document === 'undefined') return html
  const holder = document.createElement('div')
  holder.innerHTML = html
  holder.querySelectorAll('.kb-mention').forEach((el) => {
    const label = el.querySelector('.kb-mention__label')?.textContent ?? el.textContent ?? ''
    const email = el.getAttribute('data-email')
    if (mode === 'mailto' && email) {
      const a = document.createElement('a')
      a.setAttribute('href', `mailto:${email}`)
      a.textContent = label
      el.replaceWith(a)
    } else {
      el.replaceWith(document.createTextNode(label))
    }
  })
  return holder.innerHTML
}
