/**
 * Where the rest went.
 *
 * The instance profile used to carry every setting of the instance, in one
 * scroll. It now carries what identifies the instance, and each subsystem's
 * knobs live on the page that shows their consequences. An operator who knew
 * the old page would otherwise conclude the settings were removed, so the page
 * names their destinations instead of leaving them to the menu.
 *
 * Only destinations this caller may actually open are listed: naming a page
 * somebody is refused is a worse answer than not naming it.
 */
export default function SettingsMovedNotice(): import("react").JSX.Element | null;
