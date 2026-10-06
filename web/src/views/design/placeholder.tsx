/**
 * The stand-in of a project control the surface cannot load (bundled mode, or its module failed to import): a
 * dashed box with the element's name, so the view still renders and the element stays selectable. Its children
 * and slot contents (a property element such as `<AppTileGrid.Header>`) are rendered inside it.
 */
import { createElement, forwardRef, isValidElement, type ComponentType, type CSSProperties, type ReactNode } from 'react'

const BOX: CSSProperties = {
  boxSizing: 'border-box',
  minHeight: 36,
  minWidth: 48,
  padding: 8,
  border: '1px dashed var(--color-border-strong, #9aa0a6)',
  borderRadius: 6,
  background: 'repeating-linear-gradient(135deg, transparent 0 6px, rgba(128,128,128,0.08) 6px 12px)',
  color: 'var(--color-text-secondary, #5f6368)',
  font: '500 12px/1.4 var(--font-family-sans, sans-serif)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

/** A placeholder component labelled `name` (`reason` in its tooltip). */
export function makePlaceholder(name: string, reason: string): ComponentType<Record<string, unknown>> {
  const Placeholder = forwardRef<HTMLDivElement, Record<string, unknown>>(function Placeholder(props, ref) {
    const inner: ReactNode[] = []
    for (const [key, value] of Object.entries(props)) {
      if (key === 'children') continue
      if (isValidElement(value) || (Array.isArray(value) && value.some(isValidElement))) {
        inner.push(createElement('div', { key }, value as ReactNode))
      }
    }
    if (props.children !== undefined) inner.push(createElement('div', { key: '__children' }, props.children as ReactNode))
    return createElement(
      'div',
      { ref, style: BOX, title: reason, 'data-kb-placeholder': name },
      createElement('span', { key: '__label', style: { opacity: 0.85 } }, `<${name}>`),
      ...inner,
    )
  })
  Placeholder.displayName = `Placeholder(${name})`
  return Placeholder as unknown as ComponentType<Record<string, unknown>>
}
