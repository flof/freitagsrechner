import { formatTime } from './time'

const STORAGE_KEY = 'freitagsrechner.week.v1'

export interface WeekState {
  /** Raw input value, e.g. "38.5". Kept as text so typing never gets mangled. */
  weeklyTarget: string
  /** Raw input values for Monday through Thursday. */
  days: [string, string, string, string]
  /** Raw input for today's start in 24-hour form, e.g. "08:00". */
  fridayStart: string
  /** Raw input value for the Friday break, in minutes. */
  fridayBreak: string
}

function nowRoundedDownToFiveMinutes(now: Date): string {
  const minutes = now.getHours() * 60 + now.getMinutes()
  return formatTime(minutes - (minutes % 5))
}

export function createDefaultWeekState(now: Date = new Date()): WeekState {
  return {
    weeklyTarget: '38.5',
    days: ['8:00', '8:00', '8:00', '8:00'],
    fridayStart: nowRoundedDownToFiveMinutes(now),
    fridayBreak: '0',
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Reads the saved week. Within a readable entry every field falls back to its
 * default independently; a structurally broken entry falls back entirely.
 */
export function loadWeekState(now: Date = new Date()): WeekState {
  const fallback = createDefaultWeekState(now)

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return fallback

    const stored = parsed as Record<string, unknown>
    const days = stored.days
    if (!Array.isArray(days) || days.length !== 4) return fallback

    const dayValues = days.filter(isString)
    if (dayValues.length !== 4) return fallback

    return {
      weeklyTarget: isString(stored.weeklyTarget) ? stored.weeklyTarget : fallback.weeklyTarget,
      days: [dayValues[0], dayValues[1], dayValues[2], dayValues[3]],
      fridayStart: isString(stored.fridayStart) ? stored.fridayStart : fallback.fridayStart,
      fridayBreak: isString(stored.fridayBreak) ? stored.fridayBreak : fallback.fridayBreak,
    }
  } catch {
    return fallback
  }
}

export function saveWeekState(state: WeekState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Private mode or a full quota: the calculator still works for this visit.
  }
}

/** Resets this week's times, keeping the weekly target and the Friday break. */
export function resetWeek(previous: WeekState, now: Date = new Date()): WeekState {
  const defaults = createDefaultWeekState(now)
  return {
    ...defaults,
    weeklyTarget: previous.weeklyTarget,
    fridayBreak: previous.fridayBreak,
  }
}
