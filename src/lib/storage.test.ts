import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultWeekState, loadWeekState, resetWeek, saveWeekState } from './storage'

const values = new Map<string, string>()

function stubLocalStorage() {
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  })
}

const STORAGE_KEY = 'freitagsrechner.week.v1'
const NOW = new Date(2026, 9, 23, 14, 23)

beforeEach(() => {
  values.clear()
  stubLocalStorage()
})

describe('createDefaultWeekState', () => {
  it('prefills a normal week and rounds the Friday start down', () => {
    expect(createDefaultWeekState(NOW)).toEqual({
      weeklyTarget: '38.5',
      days: ['8:00', '8:00', '8:00', '8:00'],
      fridayStart: '14:20',
      fridayBreak: '0',
    })
  })
})

describe('loadWeekState', () => {
  it('falls back to defaults without stored data', () => {
    expect(loadWeekState(NOW)).toEqual(createDefaultWeekState(NOW))
  })

  it('round-trips a saved week', () => {
    const week = {
      weeklyTarget: '40',
      days: ['8:30', '7:45', '0:00', '9:15'] as [string, string, string, string],
      fridayStart: '07:30',
      fridayBreak: '45',
    }

    saveWeekState(week)
    expect(loadWeekState(NOW)).toEqual(week)
  })

  it('survives corrupt JSON', () => {
    values.set(STORAGE_KEY, '{not json')
    expect(loadWeekState(NOW)).toEqual(createDefaultWeekState(NOW))
  })

  it('falls back entirely for a structurally broken entry', () => {
    values.set(
      STORAGE_KEY,
      JSON.stringify({ weeklyTarget: '35', days: ['8:00'], fridayStart: '06:00' }),
    )

    expect(loadWeekState(NOW)).toEqual(createDefaultWeekState(NOW))
  })

  it('keeps readable fields when only some are missing', () => {
    values.set(
      STORAGE_KEY,
      JSON.stringify({ weeklyTarget: '35', days: ['8:00', '8:00', '8:00', '8:00'] }),
    )

    expect(loadWeekState(NOW)).toEqual({
      weeklyTarget: '35',
      days: ['8:00', '8:00', '8:00', '8:00'],
      fridayStart: '14:20',
      fridayBreak: '0',
    })
  })
})

describe('resetWeek', () => {
  it('clears the week but keeps target and break', () => {
    const previous = {
      weeklyTarget: '35',
      days: ['9:00', '9:00', '9:00', '9:00'] as [string, string, string, string],
      fridayStart: '06:00',
      fridayBreak: '30',
    }

    expect(resetWeek(previous, NOW)).toEqual({
      weeklyTarget: '35',
      days: ['8:00', '8:00', '8:00', '8:00'],
      fridayStart: '14:20',
      fridayBreak: '30',
    })
  })
})
