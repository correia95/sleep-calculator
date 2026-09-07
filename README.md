# sleep-calculator

Enter a wake-up time and get bedtimes that land you at the end of a sleep cycle;
or enter a bedtime (or "now") and get cycle-aligned wake times. Based on the
average 90-minute cycle plus time to fall asleep. Five and six cycles are marked
as recommended. Mode and time live in the URL.

**Live:** https://sleep-calculator.correia95.workers.dev/

## Stack

- React 18 + TypeScript + Vite, no runtime deps beyond React
- Static-assets Cloudflare Worker

## Engine

[`src/sleep.ts`](src/sleep.ts): `bedtimesFor(wakeMinuteOfDay, fallAsleep, now)`
and `wakeTimesFor(bedMinuteOfDay | null, fallAsleep, now)` return 3–6 cycle
options; `parseTime`, `fmtTime`, `fmtDur` helpers. `CYCLE_MIN = 90`.

Verified in Node: wake 7:00 with 15 min to fall asleep -> bed 9:45 PM (6 cycles,
9 hr) / 11:15 PM (5 cycles, 7.5 hr); to bed now at 22:30 -> wake 6:15 AM / 7:45 AM.

## Develop / deploy

```bash
npm install
npm run dev
npm run deploy
```
