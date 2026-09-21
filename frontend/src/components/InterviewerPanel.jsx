import React from 'react';
import { STATE_LABELS } from '../utils/labels';

export default function InterviewerPanel({ agentState, companyName, duration, questionCount }) {
  const live = agentState !== 'idle' && agentState !== 'connecting';

  return (
    <div className="px-5 py-4 flex items-center justify-between gap-4 border-b border-line">
      <div className="flex items-center gap-4 min-w-0">
        <div className="state-ring" data-state={agentState} aria-hidden="true">
          <span className="core"></span>
        </div>
        <div className="min-w-0">
          <div className="font-medium leading-tight">Chad</div>
          <div className="text-[13px] text-ink-muted truncate">
            Engineering Director{companyName ? ` · ${companyName}` : ''}
          </div>
          <div className="text-[12px] mt-1 font-mono" aria-live="polite">
            <span className={agentState === 'speaking' ? 'text-accent' : agentState === 'listening' ? 'text-good' : 'text-ink-muted'}>
              {STATE_LABELS[agentState] || agentState}
              {agentState === 'connecting' ? '…' : ''}
            </span>
          </div>
        </div>
      </div>

      <dl className="flex items-center gap-6 m-0 text-right">
        <div>
          <dt className="text-[11px] text-ink-faint">Elapsed</dt>
          <dd className="m-0 font-mono text-[18px] tabular-nums leading-tight">{live ? duration : '00:00'}</dd>
        </div>
        <div className="hidden sm:block">
          <dt className="text-[11px] text-ink-faint">Turns</dt>
          <dd className="m-0 font-mono text-[18px] tabular-nums leading-tight">{questionCount}</dd>
        </div>
      </dl>
    </div>
  );
}
