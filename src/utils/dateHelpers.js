// src/utils/dateHelpers.js
import { format, isValid, parseISO, startOfDay, endOfDay } from 'date-fns'

export const fmt           = (date, pattern = 'dd MMM yyyy') =>
  isValid(new Date(date)) ? format(new Date(date), pattern) : '—'

export const fmtTime       = (date) => fmt(date, 'dd MMM yyyy, hh:mm a')
export const toInputDate   = (date) => fmt(date, 'yyyy-MM-dd')
export const todayStr      = ()     => toInputDate(new Date())

export const dayStart      = (dateStr) => startOfDay(parseISO(dateStr)).toISOString()
export const dayEnd        = (dateStr) => endOfDay(parseISO(dateStr)).toISOString()

export const formatDate = fmt;

// Returns array of all dates between start and end inclusive
export function dateRange(start, end) {
  const dates = []
  const cur = new Date(start)
  const last = new Date(end)
  while (cur <= last) {
    dates.push(toInputDate(new Date(cur)))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}
