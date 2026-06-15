import { enUS, fr, es, pt, it, de, el, ru, ar, he, hi, zhCN, ja, type Locale } from 'date-fns/locale'
import i18n from './index'

const MAP: Record<string, Locale> = {
  en: enUS, fr, es, pt, it, de, el, ru, ar, he, hi, zh: zhCN, ja,
}

/** Locale date-fns correspondant à la langue i18n active. */
export function getDateLocale(lng?: string): Locale {
  const key = (lng ?? i18n.language ?? 'en').split('-')[0]
  return MAP[key] ?? enUS
}
