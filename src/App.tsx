import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_FALL_ASLEEP_MIN,
  Option,
  bedtimesFor,
  fmtDur,
  fmtTime,
  parseTime,
  wakeTimesFor,
} from './sleep';

type Mode = 'wake' | 'sleep';

function read() {
  try {
    const p = new URLSearchParams(window.location.search);
    return {
      mode: (p.get('m') === 'sleep' ? 'sleep' : 'wake') as Mode,
      time: p.get('t') || '07:00',
      fall: p.has('d') ? Number(p.get('d')) : DEFAULT_FALL_ASLEEP_MIN,
    };
  } catch {
    return { mode: 'wake' as Mode, time: '07:00', fall: DEFAULT_FALL_ASLEEP_MIN };
  }
}

export default function App() {
  const init = read();
  const [mode, setMode] = useState<Mode>(init.mode);
  const [time, setTime] = useState(init.time);
  const [useNow, setUseNow] = useState(false);
  const [fall, setFall] = useState(
    Number.isFinite(init.fall) && init.fall >= 0 && init.fall <= 90 ? init.fall : DEFAULT_FALL_ASLEEP_MIN,
  );
  const [showAdv, setShowAdv] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  // keep "now" fresh while the tab is open
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const mins = parseTime(time);

  const options: Option[] | null = useMemo(() => {
    const now = new Date(nowTick);
    if (mode === 'wake') {
      if (mins == null) return null;
      return bedtimesFor(mins, fall, now);
    }
    if (useNow) return wakeTimesFor(null, fall, now);
    if (mins == null) return null;
    return wakeTimesFor(mins, fall, now);
  }, [mode, mins, fall, useNow, nowTick]);

  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      u.searchParams.set('m', mode);
      if (!(mode === 'sleep' && useNow)) u.searchParams.set('t', time);
      else u.searchParams.delete('t');
      u.searchParams.set('d', String(fall));
      window.history.replaceState(null, '', u.toString());
    } catch {
      /* ignore */
    }
  }, [mode, time, fall, useNow]);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const resultVerb = mode === 'wake' ? 'Go to bed at' : 'Wake up at';
  const sorted = options ? [...options].sort((a, b) => b.cycles - a.cycles) : null;

  return (
    <div className="app">
      <header>
        <h1>Sleep Calculator</h1>
        <p className="tag">
          Work out when to go to bed — or when to wake up — so you rise at the end of a sleep cycle
          rather than the middle of one. Cycles run about 90 minutes; five or six of them is the
          sweet spot.
        </p>
      </header>

      <div className="seg">
        <button className={mode === 'wake' ? 'on' : ''} onClick={() => setMode('wake')}>
          I want to wake up at…
        </button>
        <button className={mode === 'sleep' ? 'on' : ''} onClick={() => setMode('sleep')}>
          I'm going to bed at…
        </button>
      </div>

      <div className="entry">
        {mode === 'sleep' && (
          <label className="chk now">
            <input type="checkbox" checked={useNow} onChange={(e) => setUseNow(e.target.checked)} />
            Going to bed right now
          </label>
        )}
        {!(mode === 'sleep' && useNow) && (
          <label className="timefield">
            <span>{mode === 'wake' ? 'Wake-up time' : 'Bedtime'}</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
        )}
      </div>

      {sorted ? (
        <>
          <p className="lead">{resultVerb} one of these:</p>
          <ul className="opts">
            {sorted.map((o) => (
              <li key={o.cycles} className={o.ideal ? 'opt ideal' : 'opt'}>
                <strong>{fmtTime(o.clock)}</strong>
                <span>
                  {o.cycles} cycles · {fmtDur(o.totalSleepMin)} of sleep
                  {o.ideal && <em> · recommended</em>}
                </span>
              </li>
            ))}
          </ul>
          <p className="fine">
            Times assume it takes about {fall} minutes to fall asleep. A completed cycle matters more
            than raw hours — waking mid-cycle is what leaves you groggy.
          </p>
          <div className="actions">
            <button className="link" onClick={() => setShowAdv((v) => !v)}>
              {showAdv ? 'Hide' : 'Adjust fall-asleep time'}
            </button>
            <button className="share" onClick={share}>{copied ? 'Link copied' : 'Copy link'}</button>
          </div>
          {showAdv && (
            <label className="adv">
              <span>Minutes to fall asleep</span>
              <input
                type="number"
                min={0}
                max={90}
                value={fall}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setFall(Number.isFinite(n) && n >= 0 && n <= 90 ? Math.round(n) : DEFAULT_FALL_ASLEEP_MIN);
                }}
              />
            </label>
          )}
        </>
      ) : (
        <p className="hint">Enter a time.</p>
      )}

      <section className="explainer">
        <h2>How sleep cycles work</h2>
        <p>
          Through the night you move through repeating cycles of light sleep, deep sleep and REM
          sleep. Each full cycle lasts roughly 90 minutes, though it varies from person to person and
          from cycle to cycle — earlier cycles have more deep sleep, later ones more REM.
        </p>
        <p>
          You wake most easily from light sleep, at the end of a cycle. An alarm that goes off in the
          middle of deep sleep is what produces "sleep inertia" — that heavy, disoriented feeling
          that can linger for half an hour. Timing your night in whole cycles aims your wake-up at a
          light-sleep window.
        </p>
        <h3>How many cycles?</h3>
        <p>
          Most adults do well on five or six cycles a night — about 7.5 to 9 hours in bed once you
          add the time it takes to drift off. Four cycles (6 hours) is a workable short night; three
          (4.5 hours) is a last resort. Consistently getting fewer than that builds a sleep debt that
          catches up with you.
        </p>
        <h3>What this can't do</h3>
        <p>
          The 90-minute figure is an average, not a measurement of your night. This calculator is a
          simple rule of thumb — it can't see your actual sleep stages, and it doesn't replace advice
          from a doctor if you regularly sleep badly, snore heavily, or feel exhausted despite enough
          hours. Keeping the same schedule every day, including weekends, does more for how you feel
          than nailing the exact minute.
        </p>
        <h3>Is anything sent to a server?</h3>
        <p>No. The times are worked out in your browser and stored only in the page link.</p>
        <footer>Sleep Calculator · a rule of thumb, not medical advice · no sign-up</footer>
      </section>
    </div>
  );
}
