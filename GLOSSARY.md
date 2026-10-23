# Freitagsrechner

A single-purpose tool that answers when its user may leave work on Friday, given
the hours already credited earlier in the week and a weekly target.

## Language

**Wochenziel** (weekly target):
The contracted amount of work for one week, expressed in hours. It is the value
the calculation counts down from.
_Avoid_: Sollstunden, weekly hours, target hours

**Tagesdauer** (day duration):
The net credited work time of one Monday–Thursday day, with breaks already
excluded.
_Avoid_: hours worked, daily hours, time

**Arbeitsbeginn** (Friday start):
The wall-clock time at which work begins on Friday.
_Avoid_: start time, beginning, clock-in

**Pause** (Friday break):
Unpaid time on Friday that delays the departure without counting towards the
weekly target.
_Avoid_: lunch, break time, downtime

**Restzeit** (remaining):
Wochenziel minus the sum of the four Tagesdauern. Zero or less means the week is
already fulfilled.
_Avoid_: leftover, deficit, missing hours

**Feierabend** (departure):
The wall-clock time at which Restzeit and Pause are over, i.e. when the user may
go home.
_Avoid_: end time, finish, quitting time

**Überstunden** (overtime):
Credited work beyond the Wochenziel, reported instead of a Feierabend when the
week is already full.
_Avoid_: plus hours, surplus

**Woche zurücksetzen** (reset week):
Clearing the four Tagesdauern and the Arbeitsbeginn while keeping Wochenziel and
Pause.
_Avoid_: clear all, reset app
