import { ViewBase } from './Thing.kbview'
import Badge from '../Badge'

export const helper = 1

export class Thing extends ViewBase {
  readonly badge = Badge
}

export default Thing.component()
