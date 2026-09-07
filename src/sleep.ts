// Sleep-cycle maths. A cycle is ~90 min; most people feel best waking at the
// end of a cycle after 5–6 of them. Add time to fall asleep first.
// This is a rule of thumb, not a clinical measure.

export const CYCLE_MIN = 90;
export const DEFAULT_FALL_ASLEEP_MIN = 15;

export interface Option {
  cycles: number;
  totalSleepMin: number; // time actually asleep
  clock: Date; // the bedtime or wake time
  ideal: boolean; // 5 or 6 cycles
}

// minutes since local midnight -> Date today/tomorrow relative to `base`
function atMinutes(base: Date, minutes: number): Date {
  const d = new Date(base);
  d.setSeconds(0, 0);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutes);
  return d;
}

export function parseTime(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function fmtTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h < 12 ? 'AM' : 'PM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ap}`;
}

export function fmtDur(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

// Given a wake time, list bedtimes (6 down to 3 cycles).
export function bedtimesFor(wakeMinuteOfDay: number, fallAsleep: number, now: Date): Option[] {
  const wake = atMinutes(now, wakeMinuteOfDay);
  // wake is "next occurrence" — if it's already passed today, it's tomorrow
  if (wake.getTime() <= now.getTime()) wake.setDate(wake.getDate() + 1);
  const opts: Option[] = [];
  for (let c = 6; c >= 3; c--) {
    const sleepMin = c * CYCLE_MIN;
    const bed = new Date(wake.getTime() - (sleepMin + fallAsleep) * 60000);
    opts.push({ cycles: c, totalSleepMin: sleepMin, clock: bed, ideal: c === 5 || c === 6 });
  }
  return opts;
}

// Given a bedtime (or "now"), list wake times (3 up to 6 cycles).
// Only clock times are shown, so the calendar date of `bed` doesn't matter.
export function wakeTimesFor(bedMinuteOfDay: number | null, fallAsleep: number, now: Date): Option[] {
  const bed = bedMinuteOfDay == null ? new Date(now) : atMinutes(now, bedMinuteOfDay);
  const start = bed.getTime() + fallAsleep * 60000;
  const opts: Option[] = [];
  for (let c = 3; c <= 6; c++) {
    const sleepMin = c * CYCLE_MIN;
    const wake = new Date(start + sleepMin * 60000);
    opts.push({ cycles: c, totalSleepMin: sleepMin, clock: wake, ideal: c === 5 || c === 6 });
  }
  return opts;
}
