import { useEffect, useState, type ReactNode } from 'react'
import {
  calculateDeparture,
  formatDurationLong,
  formatTime,
  MINUTES_PER_DAY,
  parseBreakMinutes,
  parseDuration,
  parseTimeOfDay,
  parseWeeklyTarget,
  type Departure,
} from './lib/time'
import {
  loadWeekState,
  resetWeek,
  saveWeekState,
  type WeekState,
} from './lib/storage'

const DAY_LABELS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag'] as const

const cardClass =
  'rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur sm:p-4 dark:border-slate-800 dark:bg-slate-900/80'

const inputBase =
  'h-8 rounded-lg border bg-white px-2 text-sm tabular-nums text-slate-900 shadow-inner outline-none transition focus:ring-2 dark:bg-slate-950 dark:text-slate-50 [color-scheme:light] dark:[color-scheme:dark]'

function borderClass(valid: boolean): string {
  return valid
    ? 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/25 dark:border-slate-700'
    : 'border-red-400 focus:border-red-500 focus:ring-red-500/25 dark:border-red-500'
}

function parseAllDays(days: readonly string[]): number[] | null {
  const parsed: number[] = []
  for (const day of days) {
    const minutes = parseDuration(day)
    if (minutes === null) return null
    parsed.push(minutes)
  }
  return parsed
}

function replaceDay(days: WeekState['days'], index: number, value: string): WeekState['days'] {
  const next: WeekState['days'] = [...days]
  next[index] = value
  return next
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
      {children}
    </h2>
  )
}

type ResultView =
  | { kind: 'incomplete'; message: string }
  | {
      kind: 'ready'
      targetMinutes: number
      fridayStartMinutes: number
      fridayBreakMinutes: number
      departure: Departure
    }

function ResultCard({ view }: { view: ResultView }) {
  if (view.kind === 'incomplete') {
    return (
      <section className={`${cardClass} lg:sticky lg:top-10`} aria-live="polite">
        <SectionTitle>Ergebnis</SectionTitle>
        <p className="mt-4 text-lg font-medium text-slate-800 dark:text-slate-100">{view.message}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Es rechnet automatisch, sobald alle Angaben passen.
        </p>
      </section>
    )
  }

  const { departure } = view

  return (
    <section className={`${cardClass} lg:sticky lg:top-10`} aria-live="polite">
      <SectionTitle>Ergebnis</SectionTitle>

      {departure.kind === 'week-done' ? (
        <>
          <p className="mt-4 text-5xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
            Feierabend 🎉
          </p>
          <div className="mt-4 space-y-1 text-sm text-slate-700 dark:text-slate-200">
            <p>
              Gearbeitet von MO-DO: {formatTime(departure.workedMinutes)}
            </p>
            <p>
              {departure.overtimeMinutes > 0
                ? `Überstunden: ${formatTime(departure.overtimeMinutes)}`
                : 'Wochenziel erfüllt.'}
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            Du kannst gehen um
          </p>
          <p className="text-6xl font-semibold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatTime(departure.departureMinutes)}
          </p>
          {departure.departureMinutes >= MINUTES_PER_DAY && (
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
              Das ist erst am Samstag – vielleicht lieber früher anfangen.
            </p>
          )}
          <div className="mt-4 space-y-1 text-sm text-slate-700 dark:text-slate-200">
            <p>
              Gearbeitet von MO-DO: {formatTime(departure.workedMinutes)}
            </p>
            <p>Es fehlen noch: {formatTime(departure.remainingMinutes)}</p>
          </div>
        </>
      )}
    </section>
  )
}

export default function App() {
  const [week, setWeek] = useState<WeekState>(loadWeekState)

  useEffect(() => {
    saveWeekState(week)
  }, [week])

  const targetMinutes = parseWeeklyTarget(week.weeklyTarget)
  const dayMinutes = parseAllDays(week.days)
  const fridayStartMinutes = parseTimeOfDay(week.fridayStart)
  const fridayBreakMinutes = parseBreakMinutes(week.fridayBreak)

  const ready =
    targetMinutes !== null &&
    dayMinutes !== null &&
    fridayStartMinutes !== null &&
    fridayBreakMinutes !== null
      ? { targetMinutes, dayMinutes, fridayStartMinutes, fridayBreakMinutes }
      : null

  const departure = ready
    ? calculateDeparture({
        weeklyTargetMinutes: ready.targetMinutes,
        daysMinutes: ready.dayMinutes,
        fridayStartMinutes: ready.fridayStartMinutes,
        fridayBreakMinutes: ready.fridayBreakMinutes,
      })
    : null

  const message =
    targetMinutes === null
      ? 'Trag dein Wochenziel ein.'
      : dayMinutes === null
        ? 'Prüfe die Zeiten von Montag bis Donnerstag.'
        : fridayStartMinutes === null
          ? 'Trag ein, wann du heute angefangen hast.'
          : fridayBreakMinutes === null
            ? 'Trag die Pause in Minuten ein (oder 0).'
            : ''

  const view: ResultView =
    ready && departure
      ? {
          kind: 'ready',
          targetMinutes: ready.targetMinutes,
          fridayStartMinutes: ready.fridayStartMinutes,
          fridayBreakMinutes: ready.fridayBreakMinutes,
          departure,
        }
      : { kind: 'incomplete', message }

  function updateDay(index: number, value: string) {
    setWeek((current) => ({ ...current, days: replaceDay(current.days, index, value) }))
  }

  function handleReset() {
    const confirmed = window.confirm(
      'Alle Zeiten dieser Woche zurücksetzen? Wochenziel und Pause bleiben erhalten.',
    )
    if (confirmed) {
      setWeek((current) => resetWeek(current))
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-emerald-100/80 to-transparent dark:from-emerald-950/50"
      />

      <div className="mx-auto w-full max-w-3xl px-2 py-4 sm:px-3 lg:py-6">
        <header className="mb-3 lg:mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            Freitagsrechner
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            Wann kannst du ins Wochenende?
          </h1>
          <p className="mt-0.5 max-w-xl text-xs text-slate-600 dark:text-slate-400">
            Trag deine Zeiten von Montag bis Donnerstag ein und wann du heute angefangen hast.
          </p>
        </header>

        <div className="grid items-start gap-2 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-3">
          <div className="space-y-2">
            <section className={cardClass}>
              <div className="mb-4">
                <SectionTitle>Montag bis Donnerstag</SectionTitle>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Gearbeitete Zeit, Pausen nicht mitgerechnet.
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {DAY_LABELS.map((label, index) => {
                  const valid = parseDuration(week.days[index]) !== null
                  return (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                    >
                      <label htmlFor={`day-${index}`} className="text-base">
                        {label}
                      </label>
                      <input
                        id={`day-${index}`}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="8:00"
                        value={week.days[index]}
                        onChange={(event) => updateDay(index, event.target.value)}
                        aria-invalid={!valid}
                        aria-label={`Arbeitszeit ${label}`}
                        className={`${inputBase} w-24 text-right ${borderClass(valid)}`}
                      />
                    </div>
                  )
                })}
              </div>
            </section>

            <section className={cardClass}>
              <div className="mb-4">
                <SectionTitle>Heute (Freitag)</SectionTitle>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Arbeitsbeginn im 24-Stunden-Format, Pause in Minuten.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="friday-start" className="text-base">
                    Arbeitsbeginn
                  </label>
                  <input
                    id="friday-start"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="08:00"
                    value={week.fridayStart}
                    onChange={(event) =>
                      setWeek((current) => ({ ...current, fridayStart: event.target.value }))
                    }
                    onBlur={() => {
                      const minutes = parseTimeOfDay(week.fridayStart)
                      if (minutes !== null) {
                        setWeek((current) => ({ ...current, fridayStart: formatTime(minutes) }))
                      }
                    }}
                    aria-invalid={fridayStartMinutes === null}
                    aria-label="Arbeitsbeginn am Freitag"
                    className={`${inputBase} w-28 text-right ${borderClass(fridayStartMinutes !== null)}`}
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="friday-break" className="text-base">
                    Pause
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="friday-break"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="0"
                      value={week.fridayBreak}
                      onChange={(event) =>
                        setWeek((current) => ({ ...current, fridayBreak: event.target.value }))
                      }
                      aria-invalid={fridayBreakMinutes === null}
                      className={`${inputBase} w-20 text-right ${borderClass(fridayBreakMinutes !== null)}`}
                    />
                    <span className="w-8 text-sm text-slate-500 dark:text-slate-400">Min.</span>
                  </div>
                </div>
              </div>
            </section>

            <section className={cardClass}>
              <div className="mb-4">
                <SectionTitle>Wochenziel</SectionTitle>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Deine vertraglichen Stunden pro Woche, z. B. 38.5 oder 38:30.
                </p>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label htmlFor="weekly-target" className="text-base">
                  Stunden pro Woche
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="weekly-target"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="38.5"
                    value={week.weeklyTarget}
                    onChange={(event) =>
                      setWeek((current) => ({ ...current, weeklyTarget: event.target.value }))
                    }
                    aria-invalid={targetMinutes === null}
                    className={`${inputBase} w-24 text-right ${borderClass(targetMinutes !== null)}`}
                  />
                  <span className="w-8 text-sm text-slate-500 dark:text-slate-400">Std.</span>
                </div>
              </div>
            </section>
          </div>

          <ResultCard view={view} />
        </div>

        <footer className="mt-4 flex flex-col gap-1.5 border-t border-slate-200 pt-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:text-slate-400">
          <p>Alles bleibt in deinem Browser gespeichert – kein Konto, kein Server.</p>
          <button
            type="button"
            onClick={handleReset}
            className="self-start rounded-lg px-3 py-1.5 font-medium underline-offset-4 transition hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Woche zurücksetzen
          </button>
        </footer>
      </div>
    </div>
  )
}
