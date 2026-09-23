import React from 'react';
import Wordmark from '../components/Wordmark';
import InterviewerPanel from '../components/InterviewerPanel';
import Transcript from '../components/Transcript';
import SessionBar from '../components/SessionBar';
import CodeEditor from '../components/CodeEditor';
import { roleLabel } from '../utils/labels';

export default function SessionPage({
  config,
  agentState,
  status,
  isConnected,
  messages,
  interviewStats,
  onSendText,
  onEnd,
  onAbort
}) {
  const isTechnical = config.interviewType === 'technical' || config.interviewType === 'mixed';
  const subtitle = [roleLabel(config), config.companyName].filter(Boolean).join(' · ');

  return (
    <div className="h-full grid grid-rows-[auto_minmax(0,1fr)_auto]">
      <header className="px-5 py-3 flex items-center justify-between gap-4 border-b border-line">
        <div className="flex items-center gap-4 min-w-0">
          <Wordmark muted />
          <span className="text-ink-faint" aria-hidden="true">/</span>
          <span className="truncate text-[13px] text-ink-muted">{subtitle}</span>
        </div>
        <button type="button" className="btn btn-quiet text-[13px]" onClick={onAbort}>
          Leave without a report
        </button>
      </header>

      <div className={`grid min-h-0 ${isTechnical ? 'grid-cols-1 lg:grid-cols-[3fr_2fr]' : 'grid-cols-1'}`}>
        <section className={`flex flex-col min-h-0 ${isTechnical ? '' : 'mx-auto w-full max-w-[860px]'}`}>
          <InterviewerPanel
            agentState={agentState}
            companyName={config.companyName}
            duration={interviewStats.duration}
            questionCount={interviewStats.questionsCount}
          />
          <Transcript messages={messages} agentState={agentState} interactionMode={config.interactionMode} />
        </section>

        {isTechnical && (
          <aside className="border-t lg:border-t-0 lg:border-l border-line min-h-[360px] lg:min-h-0 flex flex-col">
            <CodeEditor isConnected={isConnected} onSendText={onSendText} messages={messages} />
          </aside>
        )}
      </div>

      <SessionBar
        status={status}
        agentState={agentState}
        isConnected={isConnected}
        interactionMode={config.interactionMode}
        onSendText={onSendText}
        onEnd={onEnd}
      />
    </div>
  );
}
