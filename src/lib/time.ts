export const MINUTES_PER_DAY = 24 * 60
const MAX_WEEKLY_TARGET_MINUTES = 7 * MINUTES_PER_DAY
const MAX_BREAK_MINUTES = 8 * 60

const HOURS_AND_MINUTES = /^(\d{1,2}):([0-5]\d)$/
const DECIMAL_HOURS = /^\d{1,3}(?:[.,]\d{1,2})?$/

/**
 * Parses a day duration as shown in the inputs, e.g. "8:32", "8", "8,5".
 * An empty field means 0. Returns null for anything unparseable.
 */
export function parseDuration(raw: string): number | null {
  const value = raw.trim()
  if (value === '') return 0

  const hoursAndMinutes = HOURS_AND_MINUTES.exec(value)
  if (hoursAndMinutes) {
    const minutes = Number(hoursAndMinutes[1]) * 60 + Number(hoursAndMinutes[2])
    return minutes <= MINUTES_PER_DAY ? minutes : null
  }

  if (DECIMAL_HOURS.test(value)) {
    const minutes = Math.round(Number(value.replace(',', '.')) * 60)
    return minutes <= MINUTES_PER_DAY ? minutes : null
  }

  return null
}

/**
 * Parses the weekly target, e.g. "38.5", "38,5" or "38:30". Empty is invalid:
 * without a target there is nothing to count down to.
 */
export function parseWeeklyTarget(raw: string): number | null {
  const value = raw.trim()
  if (value === '') return null

  const hoursAndMinutes = /^(\d{1,3}):([0-5]\d)$/.exec(value)
  const minutes = hoursAndMinutes
    ? Number(hoursAndMinutes[1]) * 60 + Number(hoursAndMinutes[2])
    : DECIMAL_HOURS.test(value)
      ? Math.round(Number(value.replace(',', '.')) * 60)
      : null

  if (minutes === null || minutes <= 0 || minutes > MAX_WEEKLY_TARGET_MINUTES) {
    return null
  }
  return minutes
}

/** Parses the Friday break in whole minutes. Empty means no break. */
export function parseBreakMinutes(raw: string): number | null {
  const value = raw.trim()
  if (value === '') return 0
  if (!/^\d{1,3}$/.test(value)) return null

  const minutes = Number(value)
  return minutes <= MAX_BREAK_MINUTES ? minutes : null
}

/** Parses a wall-clock time, e.g. "08:05". */
export function parseTimeOfDay(raw: string): number | null {
  const match = HOURS_AND_MINUTES.exec(raw.trim())
  if (!match) return null

  const hours = Number(match[1])
  if (hours > 23) return null
  return hours * 60 + Number(match[2])
}

/** Formats minutes as a duration input value, e.g. 512 -> "8:32". */
export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes))
  const hours = Math.floor(safe / 60)
  const rest = safe % 60
  return `${hours}:${String(rest).padStart(2, '0')}`
}

/** Formats minutes for prose, e.g. 2048 -> "34 Std. 8 Min.". */
export function formatDurationLong(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes))
  const hours = Math.floor(safe / 60)
  const rest = safe % 60

  if (hours === 0) return `${rest} Min.`
  if (rest === 0) return `${hours} Std.`
  return `${hours} Std. ${rest} Min.`
}

/** Formats a wall-clock time, e.g. 862 -> "14:22". Wraps midnight. */
export function formatTime(minutes: number): string {
  const normalized =
    ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  const hours = Math.floor(normalized / 60)
  const rest = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

export interface DepartureInput {
  weeklyTargetMinutes: number
  /** Worked minutes for Monday through Thursday, breaks already excluded. */
  daysMinutes: readonly number[]
  fridayStartMinutes: number
  fridayBreakMinutes: number
}

export type Departure =
  | {
      kind: 'week-done'
      workedMinutes: number
      overtimeMinutes: number
    }
  | {
      kind: 'go-home'
      workedMinutes: number
      remainingMinutes: number
      /** Minutes since midnight; may exceed one day. */
      departureMinutes: number
    }

export function calculateDeparture(input: DepartureInput): Departure {
  const workedMinutes = input.daysMinutes.reduce((sum, minutes) => sum + minutes, 0)
  const remainingMinutes = Math.max(0, input.weeklyTargetMinutes - workedMinutes)

  if (remainingMinutes === 0) {
    return {
      kind: 'week-done',
      workedMinutes,
      overtimeMinutes: workedMinutes - input.weeklyTargetMinutes,
    }
  }

  return {
    kind: 'go-home',
    workedMinutes,
    remainingMinutes,
    departureMinutes:
      input.fridayStartMinutes + remainingMinutes + input.fridayBreakMinutes,
  }
}
