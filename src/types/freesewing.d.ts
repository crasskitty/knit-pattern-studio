declare module '@freesewing/core' {
  export function stretchToScale(stretch: number | string): number
}

declare module '@freesewing/bibi' {
  export const Bibi: BibiConstructor
  export const i18n: { en: { p?: Record<string, string>; s?: Record<string, string> } }
}

declare module '@freesewing/shelly' {
  export const Shelly: BibiConstructor
  export const i18n: { en: { p?: Record<string, string>; s?: Record<string, string> } }
}

declare module '@freesewing/lily' {
  export const Lily: BibiConstructor
  export const i18n: { en: { p?: Record<string, string>; s?: Record<string, string> } }
}

declare module '@freesewing/plugin-theme' {
  export const themePlugin: unknown
}

declare module '@freesewing/plugin-i18n' {
  export const i18nPlugin: unknown
}

declare module '@freesewing/plugin-annotations' {
  export const i18n: { en: Record<string, string> }
}

declare module '@freesewing/models' {
  export const cisFemaleAdult38: Record<string, number>
}

type BibiSettings = {
  sa?: number
  complete?: boolean
  paperless?: boolean
  units?: string
  measurements?: Record<string, number>
  options?: Record<string, number | boolean | string>
  metadata?: { setName?: string }
}

type BibiConstructor = {
  new (settings?: BibiSettings): BibiPattern
  patternConfig?: BibiConfig
}

type BibiConfig = {
  measurements: string[]
  optionalMeasurements: string[]
  options: Record<string, unknown>
}

type BibiPattern = {
  use(plugin: unknown, data?: unknown): BibiPattern
  draft(): BibiPattern
  render(): string
  width: number
  height: number
  settings: Array<{
    options: Record<string, number | boolean | string>
    absoluteOptions: Record<string, number>
  }>
  setStores: Array<{ get(key: string): number | undefined }>
  getLogs(): {
    sets?: Array<{ warn?: string[]; error?: string[] }>
    pattern?: { warn?: string[]; error?: string[] }
  }
  getConfig(): BibiConfig
}
