import type { MentionProvider } from './types'

// `@ui` is the lowest shared layer and must never import the host registry
// (`@kubuno/sdk`). Yet the primitives want default, DYNAMIC discovery of the
// providers a module registered at `'mentions.provider'`. The bridge below
// inverts the dependency: the host installs a resolver once at bootstrap, and
// the primitives read through it. Until a source is installed (or when none is
// ever installed, e.g. a module used in isolation), it resolves to `[]` and the
// feature degrades silently.

let source: (() => MentionProvider[]) | null = null

/** Host bootstrap hook: point the default resolver at `getMentionProviders`. */
export function setMentionProviderSource(fn: () => MentionProvider[]): void {
  source = fn
}

/** Providers to use when a mention-aware field is given no explicit `providers`. */
export function defaultMentionProviders(): MentionProvider[] {
  return source ? source() : []
}
