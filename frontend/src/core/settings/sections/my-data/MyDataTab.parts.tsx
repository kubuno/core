/**
 * The parts of `MyDataTab.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { ShieldOff } from "lucide-react"
import { Callout, Stepper } from "@ui"
import ServicePicker from "./ServicePicker"
import ArchiveOptions from "./ArchiveOptions"
import RequestStatus from "./RequestStatus"
import { errorMessage } from "./api"
import type { MyDataTab } from './MyDataTab'

export function Part1({ error, t }: { error: MyDataTab['error']; t: NonNullable<MyDataTab['tr']> }) {
  return (
    <Callout variant="info" icon={<ShieldOff size={18} />}>
            {errorMessage(
              error,
              t('settings.mde_off', {
                defaultValue:
                  'L’export de vos données n’est pas disponible sur cette instance.',
              }),
            )}
          </Callout>
  )
}

export function Part2({ stepper, goTo, hasSomething, data, selected, setSelected, maxFileMb, setMaxFileMb, i18n, startOver }: { stepper: NonNullable<MyDataTab['stepper']>; goTo: NonNullable<MyDataTab['goTo']>; hasSomething: NonNullable<MyDataTab['hasSomething']>; data: NonNullable<MyDataTab['data']>; selected: NonNullable<MyDataTab['selected']>; setSelected: NonNullable<MyDataTab['setSelected']>; maxFileMb: MyDataTab['maxFileMb']; setMaxFileMb: NonNullable<MyDataTab['setMaxFileMb']>; i18n: NonNullable<MyDataTab['i18n']>; startOver: MyDataTab['startOver'] }) {
  return (
    <Stepper
            steps={stepper.resolved}
            current={stepper.id}
            onStepChange={(id) => goTo(id)}
            allowForward={hasSomething}
          >
            {stepper.id === 'services' && (
              <ServicePicker
                services={data.services}
                selected={selected}
                onChange={setSelected}
              />
            )}
    
            {stepper.id === 'options' && (
              <ArchiveOptions
                policy={data.policy}
                format={data.format}
                maxFileMb={maxFileMb ?? data.policy.max_file_mb}
                onMaxFileMb={setMaxFileMb}
              />
            )}
    
            {stepper.id === 'download' && (
              <RequestStatus data={data} locale={i18n.language} onRestart={startOver} />
            )}
          </Stepper>
  )
}
