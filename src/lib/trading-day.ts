/**
 * Returns true if the given UTC date falls within EDT (UTC-4).
 * EDT: second Sunday of March → first Sunday of November.
 * EST: rest of the year (UTC-5).
 */
function isEDT(utcDate: Date): boolean {
  const year = utcDate.getUTCFullYear();

  // Second Sunday of March
  const marchStart = new Date(Date.UTC(year, 2, 1)); // March 1
  const marchDay = marchStart.getUTCDay(); // 0=Sun
  const dstStart = new Date(Date.UTC(year, 2, (14 - marchDay) % 7 + 1)); // 2nd Sunday
  dstStart.setUTCHours(7, 0, 0, 0); // 2:00 AM ET = 7:00 UTC (EST+5)

  // First Sunday of November
  const novStart = new Date(Date.UTC(year, 10, 1)); // Nov 1
  const novDay = novStart.getUTCDay();
  const dstEnd = new Date(Date.UTC(year, 10, (7 - novDay) % 7 + 1)); // 1st Sunday
  dstEnd.setUTCHours(6, 0, 0, 0); // 2:00 AM ET = 6:00 UTC (EDT+4)

  return utcDate >= dstStart && utcDate < dstEnd;
}

/**
 * US market holidays (fixed-date rules + floating).
 * Returns a Set of YYYY-MM-DD strings for the given year.
 */
function usHolidays(year: number): Set<string> {
  const holidays: string[] = [];

  function fmt(y: number, m: number, d: number) {
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // Observed rule: if holiday falls on Saturday → Friday; Sunday → Monday
  function observed(y: number, m: number, d: number): string {
    const day = new Date(y, m - 1, d).getDay();
    if (day === 6) return fmt(y, m, d - 1); // Saturday → Friday
    if (day === 0) return fmt(y, m, d + 1); // Sunday → Monday
    return fmt(y, m, d);
  }

  // Nth weekday of a month
  function nthWeekday(y: number, m: number, weekday: number, n: number): string {
    let count = 0;
    for (let d = 1; d <= 31; d++) {
      const date = new Date(y, m - 1, d);
      if (date.getMonth() !== m - 1) break;
      if (date.getDay() === weekday) {
        count++;
        if (count === n) return fmt(y, m, d);
      }
    }
    return "";
  }

  // Last weekday of a month
  function lastWeekday(y: number, m: number, weekday: number): string {
    for (let d = 31; d >= 1; d--) {
      const date = new Date(y, m - 1, d);
      if (date.getMonth() !== m - 1) continue;
      if (date.getDay() === weekday) return fmt(y, m, d);
    }
    return "";
  }

  // Good Friday: 2 days before Easter
  function goodFriday(y: number): string {
    // Anonymous Gregorian Easter algorithm
    const a = y % 19;
    const b = Math.floor(y / 100);
    const c = y % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m2 = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m2 + 114) / 31);
    const day = ((h + l - 7 * m2 + 114) % 31) + 1;
    const easter = new Date(y, month - 1, day);
    easter.setDate(easter.getDate() - 2);
    return fmt(y, easter.getMonth() + 1, easter.getDate());
  }

  holidays.push(
    observed(year, 1, 1),   // New Year's Day
    nthWeekday(year, 1, 1, 3),  // MLK Day: 3rd Monday of January
    nthWeekday(year, 2, 1, 3),  // Presidents Day: 3rd Monday of February
    goodFriday(year),           // Good Friday
    lastWeekday(year, 5, 1),    // Memorial Day: last Monday of May
    observed(year, 6, 19),      // Juneteenth
    observed(year, 7, 4),       // Independence Day
    nthWeekday(year, 9, 1, 1),  // Labor Day: 1st Monday of September
    nthWeekday(year, 11, 4, 4), // Thanksgiving: 4th Thursday of November
    observed(year, 12, 25),     // Christmas
  );

  return new Set(holidays.filter(Boolean));
}

/**
 * Returns the most recent completed trading day in ET.
 *
 * Rules:
 * - If ET time is ≥ 16:30, today counts as completed
 * - If ET time is < 16:30, go back one day
 * - Skip weekends and US market holidays
 */
export function getLastTradingDay(): { date: string; label: string } {
  const now = new Date();
  const etOffset = isEDT(now) ? -4 : -5;
  const etNow = new Date(now.getTime() + (now.getTimezoneOffset() + etOffset * 60) * 60000);

  let candidate = new Date(etNow);

  // If before 16:30 ET, market hasn't closed yet — use previous day
  if (etNow.getHours() < 16 || (etNow.getHours() === 16 && etNow.getMinutes() < 30)) {
    candidate.setDate(candidate.getDate() - 1);
  }

  // Roll back past weekends and holidays
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  let holidays = usHolidays(candidate.getFullYear());

  for (let i = 0; i < 10; i++) {
    const dow = candidate.getDay();
    const dateStr = fmt(candidate);

    // Refresh holidays set if year rolled over
    if (candidate.getFullYear() !== parseInt(dateStr.slice(0, 4))) {
      holidays = usHolidays(candidate.getFullYear());
    }

    if (dow !== 0 && dow !== 6 && !holidays.has(dateStr)) {
      const label = `${candidate.getMonth() + 1}月${candidate.getDate()}日`;
      return { date: dateStr, label };
    }

    candidate.setDate(candidate.getDate() - 1);
  }

  // Fallback (should never reach here)
  const fallback = fmt(candidate);
  return { date: fallback, label: `${candidate.getMonth() + 1}月${candidate.getDate()}日` };
}
