/**
 * The parts of `CategoryComposition.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { Trash2 } from "lucide-react"
import { Callout } from "@ui"
import { formatBytes } from "../sections/format"
import type { CategoryComposition } from './CategoryComposition'

export function Part1({ t, reading_trash }: { t: NonNullable<CategoryComposition['tr']>; reading_trash: NonNullable<NonNullable<CategoryComposition['props']['reading']>['trash']> }) {
  return (
    <Callout
              variant="info"
              className="mt-4"
              icon={<Trash2 size={16} />}
              title={t('admin.sto_trash_title', { bytes: formatBytes(reading_trash.used_bytes) })}
              t={t}
            >
              {t('admin.sto_trash_desc')}
            </Callout>
  )
}
