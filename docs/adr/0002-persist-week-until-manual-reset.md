# Persist the week indefinitely, reset only on request

The Mon–Thu durations and the Friday start are week-specific, so storing them
forever risks a confidently wrong answer from last week's numbers. The
alternatives were an automatic reset driven by an ISO-week stamp, or not
persisting the week at all.

We chose indefinite persistence plus an explicit "Woche zurücksetzen" button that
keeps the Wochenziel and the Pause. Reopening the page on Friday afternoon is
the main use case, and a reload must never lose the numbers typed minutes
earlier. An automatic week stamp would also silently wipe data when the tool is
opened on a Saturday to check something.

Consequence: the app has no date logic at all. Stale data is the user's to clear,
which the visible reset button and the "Bisher geschafft" readout make obvious.
