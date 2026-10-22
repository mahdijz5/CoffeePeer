// Persian formatting: digits, Jalali dates, currency. Dates use the local timezone.
const num = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 })
const pct = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 })
const JALALI = 'fa-IR-u-ca-persian'

export const fmtNum = (n) => num.format(Math.round(n) || 0) // `|| 0` turns -0 into 0
export const fmtMoney = (n) => `${fmtNum(n)} تومان`
export const fmtPct = (n) => `${pct.format(n)}٪`

const dateFmt = new Intl.DateTimeFormat(JALALI, { year: 'numeric', month: 'long', day: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat(JALALI, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
const timeFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' })

export const fmtDate = (ts) => dateFmt.format(ts)
export const fmtDateTime = (ts) => dateTimeFmt.format(ts)
export const fmtTime = (ts) => timeFmt.format(ts)

/** Key for matching/deduping names: Arabic ي/ك -> Persian ی/ک, ZWNJ and runs of spaces -> one space, lowercase. */
export const normName = (s) =>
  String(s).replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[\u200c\s]+/g, ' ').trim().toLowerCase()

/** Parse a typed number; accepts Persian/Arabic digits and separators. Empty/invalid -> 0. */
export function toNum(s) {
  const ascii = String(s)
    .replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 1776)
    .replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 1632)
    .replace(/[٬,،\s]/g, '')
    .replace(/٫/g, '.')
  const n = parseFloat(ascii)
  return Number.isFinite(n) ? n : 0
}
