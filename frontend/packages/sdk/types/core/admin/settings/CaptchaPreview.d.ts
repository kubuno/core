/**
 * A live example of the sign-in CAPTCHA, shown right under the type selector.
 *
 * ## Why it is here
 *
 * An administrator picks a test type and tunes its difficulty (code length,
 * distortion, noise, slider tolerance, arithmetic range) blind: the numbers say
 * "distortion 80" but nobody can tell from the number whether the result is
 * still legible. Reaching the real thing means failing a sign-in five times.
 * This draws the actual challenge, from the same public endpoint the login form
 * uses (`GET /auth/captcha`, which always issues one of the CONFIGURED type), so
 * the operator sees what a person will face.
 *
 * ## What it does NOT do
 *
 * It shows the challenge; it does not grade it. The answer lives on the server
 * and is spent by a real sign-in, so there is nothing to verify against here —
 * the value is seeing the challenge, not solving it. « Régénérer » asks for a
 * fresh one, which is also how a just-SAVED tuning change is seen (the numbers
 * are buffered in the form until saved, so the preview reflects the saved
 * configuration, not an unsaved edit).
 */
export default function CaptchaPreview(): import("react").JSX.Element;
