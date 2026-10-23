import { describe, expect, it } from 'vitest'
import {
  calculateDeparture,
  formatDuration,
  formatDurationLong,
  formatTime,
  MINUTES_PER_DAY,
  parseBreakMinutes,
  parseDuration,
  parseTimeOfDay,
  parseWeeklyTarget,
} from './time'

const hours = (value: number) => value * 60

describe('parseDuration', () => {
  it('reads hours and minutes', () => {
    expect(parseDuration('8:32')).toBe(hours(8) + 32)
    expect(parseDuration('08:32')).toBe(hours(8) + 32)
    expect(parseDuration('0:45')).toBe(45)
  })

  it('reads plain and decimal hours', () => {
    expect(parseDuration('8')).toBe(hours(8))
    expect(parseDuration('8,5')).toBe(hours(8) + 30)
    expect(parseDuration('8.25')).toBe(hours(8) + 15)
  })

  it('treats an empty field as zero', () => {
    expect(parseDuration('')).toBe(0)
    expect(parseDuration('   ')).toBe(0)
  })

  it('rejects impossible values', () => {
    expect(parseDuration('8:60')).toBeNull()
    expect(parseDuration('24:01')).toBeNull()
    expect(parseDuration('25')).toBeNull()
    expect(parseDuration('abc')).toBeNull()
    expect(parseDuration('-1')).toBeNull()
  })
})

describe('parseWeeklyTarget', () => {
  it('reads decimal hours and hours:minutes', () => {
    expect(parseWeeklyTarget('38.5')).toBe(hours(38) + 30)
    expect(parseWeeklyTarget('38,5')).toBe(hours(38) + 30)
    expect(parseWeeklyTarget('38:30')).toBe(hours(38) + 30)
    expect(parseWeeklyTarget('40')).toBe(hours(40))
  })

  it('requires a positive value', () => {
    expect(parseWeeklyTarget('')).toBeNull()
    expect(parseWeeklyTarget('0')).toBeNull()
    expect(parseWeeklyTarget('0:00')).toBeNull()
    expect(parseWeeklyTarget('nope')).toBeNull()
    expect(parseWeeklyTarget('200')).toBeNull()
  })
})

describe('parseBreakMinutes', () => {
  it('reads whole minutes', () => {
    expect(parseBreakMinutes('')).toBe(0)
    expect(parseBreakMinutes('0')).toBe(0)
    expect(parseBreakMinutes('30')).toBe(30)
  })

  it('rejects anything else', () => {
    expect(parseBreakMinutes('-5')).toBeNull()
    expect(parseBreakMinutes('1:30')).toBeNull()
    expect(parseBreakMinutes('500')).toBeNull()
  })
})

describe('parseTimeOfDay', () => {
  it('reads wall-clock times', () => {
    expect(parseTimeOfDay('08:00')).toBe(hours(8))
    expect(parseTimeOfDay('8:05')).toBe(hours(8) + 5)
    expect(parseTimeOfDay('23:59')).toBe(MINUTES_PER_DAY - 1)
  })

  it('rejects invalid times', () => {
    expect(parseTimeOfDay('')).toBeNull()
    expect(parseTimeOfDay('24:00')).toBeNull()
    expect(parseTimeOfDay('8:60')).toBeNull()
  })
})

describe('formatting', () => {
  it('formats durations', () => {
    expect(formatDuration(hours(8) + 32)).toBe('8:32')
    expect(formatDuration(hours(8))).toBe('8:00')
  })

  it('formats durations for prose', () => {
    expect(formatDurationLong(hours(34) + 8)).toBe('34 Std. 8 Min.')
    expect(formatDurationLong(hours(5))).toBe('5 Std.')
    expect(formatDurationLong(45)).toBe('45 Min.')
    expect(formatDurationLong(0)).toBe('0 Min.')
  })

  it('formats wall-clock times and wraps midnight', () => {
    expect(formatTime(hours(14) + 22)).toBe('14:22')
    expect(formatTime(hours(26) + 0)).toBe('02:00')
    expect(formatTime(-30)).toBe('23:30')
  })
})

describe('calculateDeparture', () => {
  it('adds the remaining week plus the Friday break to the start', () => {
    // 4 x 8:32 = 34:08 worked, target 40:00 -> 5:52 left.
    const result = calculateDeparture({
      weeklyTargetMinutes: hours(40),
      daysMinutes: [hours(8) + 32, hours(8) + 32, hours(8) + 32, hours(8) + 32],
      fridayStartMinutes: hours(8),
      fridayBreakMinutes: 30,
    })

    expect(result).toEqual({
      kind: 'go-home',
      workedMinutes: hours(34) + 8,
      remainingMinutes: hours(5) + 52,
      departureMinutes: hours(14) + 22,
    })
  })

  it('works without a break', () => {
    const result = calculateDeparture({
      weeklyTargetMinutes: hours(38) + 30,
      daysMinutes: [hours(8), hours(8), hours(8), hours(8)],
      fridayStartMinutes: hours(7) + 45,
      fridayBreakMinutes: 0,
    })

    expect(result).toMatchObject({
      kind: 'go-home',
      remainingMinutes: hours(6) + 30,
      departureMinutes: hours(14) + 15,
    })
  })

  it('reports a finished week instead of a time', () => {
    const result = calculateDeparture({
      weeklyTargetMinutes: hours(40),
      daysMinutes: [hours(10), hours(10), hours(10), hours(10)],
      fridayStartMinutes: hours(8),
      fridayBreakMinutes: 30,
    })

    expect(result).toEqual({
      kind: 'week-done',
      workedMinutes: hours(40),
      overtimeMinutes: 0,
    })
  })

  it('reports overtime', () => {
    const result = calculateDeparture({
      weeklyTargetMinutes: hours(38) + 30,
      daysMinutes: [hours(10), hours(10), hours(10), hours(10)],
      fridayStartMinutes: hours(8),
      fridayBreakMinutes: 0,
    })

    expect(result).toEqual({
      kind: 'week-done',
      workedMinutes: hours(40),
      overtimeMinutes: 90,
    })
  })

  it('can push the departure past midnight', () => {
    const result = calculateDeparture({
      weeklyTargetMinutes: hours(40),
      daysMinutes: [hours(8), hours(8), hours(8), hours(8)],
      fridayStartMinutes: hours(20),
      fridayBreakMinutes: 0,
    })

    expect(result).toMatchObject({
      kind: 'go-home',
      departureMinutes: MINUTES_PER_DAY + hours(4),
    })
    expect(formatTime(MINUTES_PER_DAY + hours(4))).toBe('04:00')
  })
})
