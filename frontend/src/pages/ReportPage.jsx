import React, { useEffect, useState } from 'react';
import Wordmark from '../components/Wordmark';
import { generateFeedback } from '../utils/api';
import { roleLabel, TYPE_LABELS, LEVEL_LABELS } from '../utils/labels';

const SCORE_ROWS = [
  ['overall', 'Overall'],
  ['communication', 'Communication'],
  ['technical', 'Technical depth'],
  ['behavior', 'Behavioral']
];

// Hiring verdict levels, worst to best. Keys match Report.js; tone picks the
// App.css token family: warn (red) for no-hire, accent (amber) for borderline,
// good (green) for hire.
const VERDICTS = [
  { key: 'strong_no_hire', label: 'Strong no hire', tone: 'warn' },
  { key: 'no_hire', label: 'No hire', tone: 'warn' },
  { key: 'borderline', label: 'Borderline', tone: 'accent' },
  { key: 'hire', label: 'Hire', tone: 'good' },
  { key: 'strong_hire', label: 'Strong hire', tone: 'good' }
];

// Class strings are written out in full so Tailwind can see them.
const TONE_ON = {
  warn: 'bg-warn-soft border-warn text-warn',
  accent: 'bg-accent-soft border-accent text-accent',
  good: 'bg-good-soft border-good text-good'
};
const TONE_TEXT = { warn: 'text-warn', accent: 'text-accent', good: 'text-good' };

function VerdictStrip({ verdict, reason }) {
  const current = VERDICTS.find((v) => v.key === verdict);
  if (!current) return null;
  return (
    <section className="flex flex-col gap-3" aria-label="Hiring verdict">
      <h2 className="m-0 text-[13px] font-medium text-ink-muted">Verdict</h2>
      <ol className="m-0 p-0 list-none grid grid-cols-5 gap-1" role="list">
        {VERDICTS.map((v) => {
          const on = v.key === verdict;
          return (
            <li
              key={v.key}
              aria-current={on ? 'true' : undefined}
              className={`rounded-sm border px-1.5 py-2 text-center text-[11px] sm:text-[12px] font-medium leading-tight ${
                on ? TONE_ON[v.tone] : 'border-line text-ink-faint'
              }`}
            >
              {v.label}
            </li>
          );
        })}
      </ol>
      {reason && (
        <p className="m-0 text-[15px] leading-relaxed max-w-[65ch]">
          <span className={`font-medium ${TONE_TEXT[current.tone]}`}>{current.label}.</span> {reason}
        </p>
      )}
    </section>
  );
}

function ScoreRow({ label, value }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="grid grid-cols-[140px_1fr_48px] items-center gap-4">
      <span className="text-[13px] text-ink-muted">{label}</span>
      <div className="bar"><span style={{ width: `${v}%` }}></span></div>
      <span className="font-mono text-[13px] tabular-nums text-right">{v}</span>
    </div>
  );
}

function List({ title, items, tone }) {
  if (!items?.length) return null;
  return (
    <section>
      <h2 className={`m-0 mb-3 text-[13px] font-medium ${tone}`}>{title}</h2>
      <ul className="m-0 pl-4 flex flex-col gap-2 text-[14px] leading-relaxed">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </section>
  );
}

export default function ReportPage({ config, sessionId, interviewStats, messages, onRestart }) {
  const [phase, setPhase] = useState('loading'); // loading | ready | error
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const userTurns = messages.filter((m) => m.role === 'user').length;

  const run = async () => {
    if (!sessionId) {
      setError('This interview was not saved, so there is nothing to score.');
      setPhase('error');
      return;
    }
    if (userTurns === 0) {
      setError('You did not answer anything, so there is nothing to score.');
      setPhase('error');
      return;
    }
    setPhase('loading');
    setError('');
    try {
      const result = await generateFeedback(sessionId);
      setReport(result.report?.content || result.report);
      setPhase('ready');
    } catch (err) {
      setError(err.message || 'Could not generate the report.');
      setPhase('error');
    }
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const meta = [
    roleLabel(config),
    config.companyName,
    TYPE_LABELS[config.interviewType],
    LEVEL_LABELS[config.difficulty],
    interviewStats.duration !== '00:00' ? `${interviewStats.duration} elapsed` : null
  ].filter(Boolean);

  return (
    <div className="min-h-full flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between border-b border-line">
        <Wordmark />
        <button type="button" className="btn btn-ghost text-[13px]" onClick={onRestart}>
          New interview
        </button>
      </header>

      <main className="flex-1 px-4 py-10">
        <div className="mx-auto w-full max-w-[720px] flex flex-col gap-10">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.01em] m-0">Interview report</h1>
            <p className="m-0 mt-2 text-[13px] font-mono text-ink-muted">{meta.join(' · ')}</p>
          </div>

          {phase === 'loading' && (
            <div className="flex items-center gap-4 text-ink-muted">
              <div className="state-ring" data-state="thinking" aria-hidden="true"><span className="core"></span></div>
              <div>
                <div className="text-ink">Scoring your interview</div>
                <div className="text-[13px]">Reading {messages.length} turns of transcript. This takes a few seconds.</div>
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div className="border border-line rounded-md p-5 flex flex-col gap-4">
              <div>
                <div className="text-warn font-medium">Report unavailable</div>
                <p className="m-0 mt-1 text-[13px] text-ink-muted">{error}</p>
              </div>
              <div className="flex gap-2">
                {sessionId && userTurns > 0 && (
                  <button type="button" className="btn btn-ghost" onClick={run}>Try again</button>
                )}
                <button type="button" className="btn btn-primary" onClick={onRestart}>Start another interview</button>
              </div>
            </div>
          )}

          {phase === 'ready' && report && (
            <>
              <VerdictStrip verdict={report.verdict} reason={report.verdictReason} />

              <section className="flex flex-col gap-3">
                {SCORE_ROWS.map(([key, label]) => (
                  <ScoreRow key={key} label={label} value={report.scores?.[key]} />
                ))}
                <p className="m-0 mt-1 text-[12px] font-mono text-ink-faint">scores out of 100</p>
              </section>

              {report.summary && (
                <section>
                  <h2 className="m-0 mb-2 text-[13px] font-medium text-ink-muted">Summary</h2>
                  <p className="m-0 text-[15px] leading-relaxed max-w-[65ch]">{report.summary}</p>
                </section>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <List title="What worked" items={report.strengths} tone="text-good" />
                <List title="What held you back" items={report.weaknesses} tone="text-warn" />
              </div>

              <List title="Do this next time" items={report.recommendations} tone="text-accent" />

              <div className="border-t border-line pt-6 flex flex-wrap gap-2">
                <button type="button" className="btn btn-primary" onClick={onRestart}>Start another interview</button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
