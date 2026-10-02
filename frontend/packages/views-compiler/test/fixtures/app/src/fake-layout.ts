// The fixture's own layout control (declared in controls.json, a project registry).
import { createElement, type ReactNode, type Ref } from 'react'

export function Stack(props: { children?: ReactNode; direction?: string; gap?: number; ref?: Ref<HTMLDivElement> }): ReactNode {
  return createElement('div', { ref: props.ref, style: { display: 'flex', flexDirection: props.direction ?? 'column', gap: props.gap } }, props.children)
}
