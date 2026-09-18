# Changelog — @kubuno/sdk

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Entries are
added under `[Unreleased]` **as the change is made**; on npm publish, the section is stamped
under the published version number.

## [Unreleased]

## [0.1.10] - 2026-09-07

### Fixed

- **`getDateLocale()` is back, as a deprecated bridge.** Its removal broke every
  module bundle built against an earlier SDK at import time. It now returns a
  date-fns compatible `Locale` derived from `Intl` (typed `DateFnsLocale`), so
  older bundles load; new code should use `formatDate` and friends instead.



### Added

- **The date helpers now cover years and minutes.** `startOfYear`, `endOfYear`,
  `addYears`, `subYears`, `addMinutes`, and `isTomorrow` (the mirror of the
  existing `isToday` / `isYesterday`). They complete the arithmetic surface so a
  module doing calendar maths never has to reach back to a date library.

- **Four more date intents, and the ISO week number.** `weekdayNarrow` (the
  single-letter column heads of a calendar grid), `weekdayShort`, `weekdayTime`
  and `hour` (a day's time axis), plus `isoWeek` / `isoWeekYear`. Week 1 is the
  one holding the year's first Thursday, not the first block of seven days — a
  rule that only shows up once a year, in the days around New Year, on the
  screens nobody re-checks. Verified against the 2024→2027 boundaries.

### Added

- **Dates and times, formatted by the platform.** A small module built on `Intl`
  replaces `date-fns`, which seventeen repositories depended on and which needed
  thirteen locale bundles loaded just to write month names in the reader's
  language. Callers now say what a date is FOR — `formatDate(d, 'date')` — and
  the platform decides how to write it, which is what a product shipped in
  thirteen languages needs: a hard-coded `dd/MM/yyyy` prints 03/09/2026 to a
  reader expecting 2026年9月3日. Machine formats (`toISODate`, `toISOMonth`,
  `toISODateTimeLocal`) are kept separate and built from local calendar fields,
  since `toISOString()` shifts the day near midnight.
## [0.1.8] - undated

- Published to npm before this changelog was introduced.
