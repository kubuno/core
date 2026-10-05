// Ambient types for what the kbview Vite plugin serves besides views: reference it from the project's
// `vite-env.d.ts` (`/// <reference types="@kubuno/views-compiler/client" />`).

/** A `.kbres` string set: its i18next bundles by language (`{ en: {…}, fr: {…} }`). */
declare module '*.kbres' {
  const bundles: Record<string, Record<string, unknown>>
  export default bundles
}
