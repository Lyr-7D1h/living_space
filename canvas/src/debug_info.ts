import { CONSTANTS } from './constants'

export class DebugInfo {
  html: HTMLElement
  values: Record<string, any>

  constructor() {
    this.html = document.getElementById('debug')!
    this.values = {}
  }

  set(name: string, value: any) {
    this.values[name] = value
    this.render()
  }

  render() {
    if (CONSTANTS.DEBUG_INFO) {
      this.html.innerHTML = Object.entries(this.values)
        .map(([k, v]) => `${k}: ${v}`)
        .join('<br />')
    }
  }
}

export const debugInfo = new DebugInfo()
