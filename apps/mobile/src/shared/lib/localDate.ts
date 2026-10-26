const pad = (value: number, length: number) => String(value).padStart(length, '0');

// The device's calendar date as YYYY-MM-DD: the streak's "day" for the BFF. Built from the
// local components on purpose: toISOString() gives the UTC date, which in Brazil is
// already tomorrow from 21:00.
export function getLocalDate(date: Date = new Date()): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
}
