import { bind } from '@kubuno/views'
import { ViewBase } from './Form.kbview'

/** The code-behind of the conformance view (shared by the compiled and the interpreted renderings). */
export class Form extends ViewBase {
  @bind accessor count = 0
  @bind accessor busy = false
  @bind accessor name = 'Ada'
  @bind accessor agree = false
  @bind accessor tab = 0
  @bind accessor warning = 'Le nom est court'
  @bind accessor items = [
    { id: 'a', title: 'Alpha' },
    { id: 'b', title: 'Beta' },
  ]
  loads = 0
  changes = 0
  log: string[] = []

  get label(): string {
    return `Compter (${this.count})`
  }

  get upper(): string {
    return this.name.toUpperCase()
  }

  get canAgree(): boolean {
    return this.name.length > 0
  }

  get hasWarning(): boolean {
    return this.name.length < 5
  }

  loaded(): void {
    this.loads++
  }

  inc_click(): void {
    this.count = this.count + 1
    this.items = [...this.items, { id: `n${this.count}`, title: `Item ${this.count}` }]
    this.log.push(`click ${this.inc.text}`)
  }

  name_changed(): void {
    this.changes++
  }

  fix_click(): void {
    this.name = 'Ada Lovelace'
  }

  reset_click(): void {
    this.count = 0
    this.name = ''
    this.reset.text = 'Fait'
  }
}

export default Form.component()
