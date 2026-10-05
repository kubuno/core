/**
 * Code-behind of the `Resources` gallery page: registers its `.kbres` set as the `gallery` namespace and resolves
 * `{Res}` through i18next as the shell does (core/viewsHost.ts), then lists a few counts.
 */
import i18n from 'i18next'
import { interpolationOptions, setResourceResolver } from '@kubuno/views'

import { registerModuleTranslations } from '../../core/i18n'
import strings from './Resources.kbres'
import { ViewBase } from './Resources.kbview'

registerModuleTranslations('gallery', strings)
setResourceResolver((key, set, args) => {
  const k = set ? `${set}:${key}` : key
  return args ? i18n.t(k, interpolationOptions(args)) : i18n.t(k)
})

const COUNTS = [0, 1, 2, 3, 11, 100, 1_000_000].map((n) => ({ n }))

export class Resources extends ViewBase {
  readonly who = 'Camille'
  readonly counts = COUNTS
}

export default Resources.component()
