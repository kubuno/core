import type { MentionProvider } from './types';
/** Host bootstrap hook: point the default resolver at `getMentionProviders`. */
export declare function setMentionProviderSource(fn: () => MentionProvider[]): void;
/** Providers to use when a mention-aware field is given no explicit `providers`. */
export declare function defaultMentionProviders(): MentionProvider[];
