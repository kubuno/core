import { useTranslation } from 'react-i18next'
import { Checkbox, Radio, Toggle } from '@ui'
import ProvenanceLine from '../../settings/ProvenanceLine'
import { settingDescription, settingLabel } from '../../settings/SettingControl'
import type { ResolvedSetting } from '../../settings/scopeTypes'
import type { DirectoryPolicy } from './useDirectoryPolicy'
import { AUDIENCE_OPTIONS, type AudienceValue } from './keys'

/**
 * One governed key: its control, then the sentence that says where the value
 * comes from.
 *
 * The provenance line is not optional decoration on this page. A directory
 * policy is the kind of thing an operator sets on one branch and then finds
 * inexplicably applied everywhere; `ProvenanceLine` is what states "inherited
 * from X" / "overridden here" / "locked by X", and it carries the revert, the
 * lock and the inheritance-chain window. Reusing the component rather than
 * restating it here is what keeps this page's affordances identical to every
 * other settings screen.
 */

/** Every control writes on the click — none of these values is free text. */
interface RowProps {
  setting:  ResolvedSetting | undefined
  policy:   DirectoryPolicy
  readOnly: boolean
  onShowChain: (key: string) => void
}

/** Shared plumbing: a control is dead when a level above has locked the key. */
function useRow(setting: ResolvedSetting | undefined, readOnly: boolean) {
  const { t } = useTranslation()
  if (!setting) return null
  return {
    t,
    label: settingLabel(t, setting),
    desc:  settingDescription(t, setting),
    disabled: readOnly || setting.locked_above,
  }
}

/** A boolean shown as a switch — "is this capability on for this scope". */
export function ToggleRow({ setting, policy, readOnly, onShowChain }: RowProps) {
  const row = useRow(setting, readOnly)
  if (!setting || !row) return null

  return (
    <div className="py-3">
      <Toggle
        checked={Boolean(setting.value)}
        disabled={row.disabled}
        // `label`/`description` are the primitive's own props: a hand-written
        // <label> here would lose the generated id that binds it to the input.
        label={row.label}
        description={row.desc}
        onChange={e => policy.write(setting.key, e.target.checked)}
      />
      <ProvenanceLine
        setting={setting}
        onRevert={() => policy.revert(setting.key)}
        onLock={locked => policy.lock(setting.key, locked)}
        onShowChain={() => onShowChain(setting.key)}
      />
    </div>
  )
}

/**
 * A boolean shown as a checkbox — "may a person change this about themselves".
 *
 * A checkbox rather than a switch because these read as a *list of permissions*
 * granted together, which is how the card is scanned: several boxes under one
 * question, not several independent capabilities.
 */
export function CheckboxRow({ setting, policy, readOnly, onShowChain, personal }: RowProps & {
  /** Marks a field carrying personal data (`gender`, `birthday`). */
  personal?: boolean
}) {
  const row = useRow(setting, readOnly)
  if (!setting || !row) return null

  return (
    <div className="py-3">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={Boolean(setting.value)}
          disabled={row.disabled}
          // `label`/`description` are the primitive's own props — a hand-written
          // <label> here would lose the generated id that binds it to the input.
          label={row.label}
          description={row.desc}
          onChange={v => policy.write(setting.key, v)}
        />
        {personal && (
          // Says what the datum IS, not that the switch is dangerous: it behaves
          // exactly like the six others. Solid token colours, never an opacity
          // modifier on one — Tailwind would bake a light hex the dark theme
          // cannot remap.
          <span className="ml-auto mt-0.5 shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-text-secondary"
                style={{ fontSize: 'var(--kb-text-micro)' }}>
            {row.t('admin.dirset_field_personal')}
          </span>
        )}
      </div>
      <ProvenanceLine
        setting={setting}
        onRevert={() => policy.revert(setting.key)}
        onLock={locked => policy.lock(setting.key, locked)}
        onShowChain={() => onShowChain(setting.key)}
      />
    </div>
  )
}

/**
 * A profile field the comparable console governs and this instance does not
 * store yet.
 *
 * Rendered as a disabled checkbox rather than omitted, so the page can be read
 * side by side with the console it is modelled on and the answer to "and the
 * other eight?" is on the screen. It carries no provenance line and writes
 * nothing: there is no setting behind it, and there must not be one until a
 * column and a reader exist — a switch over a column that does not exist is the
 * exact defect the rest of this page was built to avoid.
 */
export function UnstoredFieldRow({ field }: { field: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3 py-3">
      <Checkbox checked={false} disabled onChange={() => {}}
                label={t(`admin.dirset_field_${field}`)} />
      <span className="ml-auto shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-text-tertiary"
            style={{ fontSize: 'var(--kb-text-micro)' }}>
        {t('admin.dirset_field_not_stored')}
      </span>
    </div>
  )
}

/**
 * The closed value set of `directory.audience`, as mutually exclusive options.
 *
 * Radio buttons, not a dropdown: there are two of them, they are the substance
 * of the card, and the consequence of each needs a sentence next to it. The
 * card's own title is the group's label — which is why no `<label>` is written
 * by hand for the set.
 */
export function AudienceRow({ setting, policy, readOnly, onShowChain }: RowProps) {
  const { t } = useTranslation()
  if (!setting) return null

  const current = typeof setting.value === 'string' ? setting.value : AUDIENCE_OPTIONS[0]
  const disabled = readOnly || setting.locked_above

  return (
    <div className="py-1">
      <div className="space-y-3">
        {AUDIENCE_OPTIONS.map((option: AudienceValue) => (
          <Radio
            key={option}
            checked={current === option}
            disabled={disabled}
            label={t(`admin.dirset_audience_${option}`)}
            description={t(`admin.dirset_audience_${option}_desc`)}
            onChange={() => policy.write(setting.key, option)}
          />
        ))}
      </div>
      <ProvenanceLine
        setting={setting}
        onRevert={() => policy.revert(setting.key)}
        onLock={locked => policy.lock(setting.key, locked)}
        onShowChain={() => onShowChain(setting.key)}
      />
    </div>
  )
}
