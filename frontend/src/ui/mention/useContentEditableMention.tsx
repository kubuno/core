import { useCallback, useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { MentionsConfig } from './types'
import { useMentionAutocomplete } from './useMentionAutocomplete'
import { MentionList } from './MentionList'
import { ensureMentionStyles, replaceMentionQueryWithChip, bindMentionChipRemoval } from './mentionChip'

// Compute a viewport rect for the current (collapsed) caret. A collapsed range's
// `getBoundingClientRect` gives a zero-width rect AT the caret in every engine we
// target, which is all `MentionList` needs to anchor itself.
function caretRect(): DOMRect | null {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return null
  const rects = sel.getRangeAt(0).getClientRects()
  if (rects.length) return rects[rects.length - 1] as DOMRect
  return sel.getRangeAt(0).getBoundingClientRect()
}

/**
 * Attach the @mention behaviour to an existing contenteditable element (used by
 * both `RichText` and the mention variant of `Textarea`). Returns the event
 * handlers to spread on the editable plus the overlay node to render.
 *
 * When `config.enabled` is falsy every handler is a no-op and `overlay` is null,
 * so a host can wire these unconditionally without changing its behaviour.
 */
export function useContentEditableMention(
  ref: RefObject<HTMLElement | null>,
  config: MentionsConfig | undefined,
  onAfterChange?: () => void,
) {
  const enabled = !!config?.enabled

  const auto = useMentionAutocomplete({
    providers: config?.providers,
    trigger: config?.trigger,
    onSelect: (item, match) => {
      // Focus is still inside the editable (the list picks on pointerdown +
      // preventDefault), so the current selection is the caret we detected.
      replaceMentionQueryWithChip(match, item)
      onAfterChange?.()
    },
  })
  // Keep the latest close() reachable from effects without re-subscribing.
  const closeRef = useRef(auto.close)
  closeRef.current = auto.close

  useEffect(() => {
    if (!enabled) return
    ensureMentionStyles()
    const root = ref.current
    if (!root) return
    const unbind = bindMentionChipRemoval(root, onAfterChange)
    return unbind
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  const recompute = useCallback(() => {
    if (!enabled) return
    const root = ref.current
    const sel = window.getSelection()
    if (!root || !sel || !sel.rangeCount) { closeRef.current(); return }
    const range = sel.getRangeAt(0)
    if (!root.contains(range.startContainer)) { closeRef.current(); return }
    const node = range.startContainer
    const before = node.nodeType === Node.TEXT_NODE
      ? (node.textContent ?? '').slice(0, range.startOffset)
      : ''
    auto.handleCaret({ textBeforeCaret: before, anchorRect: caretRect() })
  }, [enabled, ref, auto])

  const onInput = useCallback(() => { recompute() }, [recompute])
  const onKeyUp = useCallback(() => { recompute() }, [recompute])
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enabled) return
    if (auto.handleKeyDown(e)) e.preventDefault()
  }, [enabled, auto])

  const overlay = enabled ? (
    <MentionList
      items={auto.items}
      activeIndex={auto.activeIndex}
      query={auto.query}
      anchorRect={auto.anchorRect}
      loading={auto.loading}
      onHover={auto.setActiveIndex}
      onPick={auto.selectItem}
    />
  ) : null

  return { overlay, onInput, onKeyUp, onKeyDown, enabled }
}
