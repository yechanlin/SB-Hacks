import React, { useEffect, useState } from 'react';
import MonacoCodeEditor from './MonacoCodeEditor';

const LANGUAGES = [
  ['javascript', 'JavaScript'],
  ['typescript', 'TypeScript'],
  ['python', 'Python'],
  ['java', 'Java'],
  ['cpp', 'C++'],
  ['csharp', 'C#'],
  ['go', 'Go'],
  ['rust', 'Rust'],
  ['ruby', 'Ruby'],
  ['php', 'PHP']
];

function ProblemBody({ description }) {
  const parts = description.split(/\n(?=Example \d+:|Constraints:)/);
  return (
    <div className="flex flex-col gap-3 text-[13px] leading-relaxed">
      {parts.map((part, i) => {
        const trimmed = part.trim();
        const isExample = /^Example \d+:/.test(trimmed);
        const isConstraints = trimmed.startsWith('Constraints:');
        if (isExample || isConstraints) {
          const [title, ...rest] = trimmed.split('\n');
          return (
            <div key={i}>
              <div className="text-ink-muted mb-1">{title}</div>
              <pre className="m-0 font-mono text-[12px] whitespace-pre-wrap bg-ground border border-line rounded-[4px] px-3 py-2">{rest.join('\n')}</pre>
            </div>
          );
        }
        return <p key={i} className="m-0 whitespace-pre-wrap">{trimmed}</p>;
      })}
    </div>
  );
}

export default function CodeEditor({ isConnected, onSendText, messages }) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [problem, setProblem] = useState(null);
  const [showProblem, setShowProblem] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/problem')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setProblem(data))
      .catch(() => {});
  }, []);

  // Reveal the problem when the interviewer introduces it.
  useEffect(() => {
    if (showProblem) return;
    const last = [...messages].reverse().find((m) => m.role === 'interviewer');
    if (last?.showProblem) setShowProblem(true);
  }, [messages, showProblem]);

  const submit = () => {
    if (!code.trim() || !isConnected) return;
    onSendText(`Here is my solution:\n\n\`\`\`${language}\n${code.trim()}\n\`\`\``);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="px-4 py-2.5 flex items-center justify-between gap-3 border-b border-line">
        <button
          type="button"
          className="btn btn-quiet text-[13px]"
          onClick={() => setShowProblem((v) => !v)}
          disabled={!problem}
          aria-expanded={showProblem}
        >
          {problem ? (showProblem ? 'Hide problem' : `Problem: ${problem.title}`) : 'Problem'}
        </button>
        <label className="flex items-center gap-2 text-[13px] text-ink-muted">
          <span className="sr-only">Language</span>
          <select
            id="language"
            className="field w-auto! py-1.5! text-[13px]"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      {problem && showProblem && (
        <div className="scroll max-h-[38%] px-4 py-4 border-b border-line">
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <h2 className="m-0 text-[15px] font-medium">{problem.title}</h2>
            {problem.difficulty && <span className="text-[12px] font-mono text-ink-muted">{problem.difficulty}</span>}
          </div>
          <ProblemBody description={problem.description} />
        </div>
      )}

      <div className="flex-1 min-h-[220px]">
        <MonacoCodeEditor code={code} setCode={setCode} language={language} />
      </div>

      <div className="px-4 py-2.5 flex items-center justify-between gap-3 border-t border-line">
        <span className="font-mono text-[12px] text-ink-faint tabular-nums">
          {code.split('\n').length} lines
        </span>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-quiet text-[13px]" onClick={() => setCode('')} disabled={!code}>
            Clear
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={submit}
            disabled={!code.trim() || !isConnected}
            title={!isConnected ? 'Connect first' : undefined}
          >
            {submitted ? 'Sent to Chad' : 'Submit code'}
          </button>
        </div>
      </div>
    </div>
  );
}
