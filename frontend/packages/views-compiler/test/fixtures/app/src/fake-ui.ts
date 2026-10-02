// A stand-in for the host's `@ui` in the fixture (the real components need the host's CSS and stores).
import { createElement, type ReactNode, type Ref } from 'react'

export function Button(props: { children?: ReactNode; onClick?: (e: unknown) => void; disabled?: boolean; loading?: boolean; variant?: string; ref?: Ref<HTMLButtonElement> }): ReactNode {
  return createElement('button', { ref: props.ref, onClick: props.onClick, disabled: props.disabled, 'data-variant': props.variant, 'aria-busy': props.loading || undefined }, props.children)
}

export function Badge(props: { children?: ReactNode; variant?: string }): ReactNode {
  return createElement('span', { className: 'badge', 'data-variant': props.variant }, props.children)
}
