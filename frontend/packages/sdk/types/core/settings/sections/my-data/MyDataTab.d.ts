/**
 * "Download my data" — the account settings section.
 *
 * ## Three steps, and the third one is where a returning visitor lands
 *
 *   1. **Choose** what to include. Everything the instance can produce is
 *      pre-selected; unticking is the gesture, not ticking.
 *   2. **Customise** the archive.
 *   3. **Follow and download.** A request lives for days: somebody who asked
 *      yesterday comes back for step 3 and must not walk through the first two
 *      to reach it — so the section opens there whenever there is something to
 *      show.
 *
 * ## This component is only ever mounted where the feature exists
 *
 * `data_export.self_service` is resolved per account by the server and gates the
 * nav entry (`settings/navigation.tsx`) as well as all three routes, which
 * answer 404 where it is off. The guard below is the belt to that braces: a
 * hand-typed `?tab=my-data` must not paint a page whose every request will be
 * refused.
 */
export declare function MyDataTab(): import("react").JSX.Element;
export default MyDataTab;
