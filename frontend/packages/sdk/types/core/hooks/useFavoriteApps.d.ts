import { type WaffleApp } from '../registry/WaffleAppRegistry';
/**
 * The user's favourite apps (from the waffle launcher), resolved to live
 * WaffleApp entries and ordered as saved. Empty until module bundles register
 * their apps — recomputed when `loadedVersion` bumps.
 */
export declare function useFavoriteApps(): WaffleApp[];
