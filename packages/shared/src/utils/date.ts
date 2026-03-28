export function isExpired(date: Date): boolean {
  return date < new Date();
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function isWithinHours(date: Date, hours: number): boolean {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return diff > 0 && diff <= hours * 60 * 60 * 1000;
}
