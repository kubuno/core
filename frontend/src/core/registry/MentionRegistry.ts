/**
 * @mention provider registry.
 *
 * A module (contacts, mail…) contributes a source of mention candidates by
 * registering a `MentionProvider` at the `'mentions.provider'` extension point.
 * Any mention-aware field (`Input`/`Textarea`/`RichText` with `mentions`) then
 * discovers those providers DYNAMICALLY — with no provider registered, mentions
 * are simply inert (silent degradation), per the polyrepo « never assume a
 * module is installed » rule.
 *
 * The contract types (`MentionItem`, `MentionProvider`) live in `@ui` so the
 * primitives can use them without importing the host; they are re-exported here
 * so a module sees the SAME types from `@kubuno/sdk`.
 */
import { ExtensionRegistry } from './ExtensionRegistry'
import { setMentionProviderSource } from '@ui'
import type { MentionProvider } from '@ui'

export type { MentionItem, MentionProvider } from '@ui'

/** The extension point string modules register their provider at. */
export const MENTIONS_PROVIDER_POINT = 'mentions.provider'

/** Register (or replace) a module's mention provider. */
export function registerMentionProvider(moduleId: string, provider: MentionProvider): void {
  ExtensionRegistry.register(MENTIONS_PROVIDER_POINT, moduleId, provider)
}

/** Remove a module's mention provider. */
export function unregisterMentionProvider(moduleId: string): void {
  ExtensionRegistry.unregister(MENTIONS_PROVIDER_POINT, moduleId)
}

/** Every registered mention provider (insertion order). */
export function getMentionProviders(): MentionProvider[] {
  return ExtensionRegistry.getAll<MentionProvider>(MENTIONS_PROVIDER_POINT)
}

/**
 * Bridge the `@ui` default-provider resolver to this registry. Called once at
 * host bootstrap (main.tsx) so that a mention-aware field given no explicit
 * `providers` discovers whatever modules registered here.
 */
export function installDefaultMentionSource(): void {
  setMentionProviderSource(getMentionProviders)
}
