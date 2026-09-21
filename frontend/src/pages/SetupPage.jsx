import React from 'react';
import Wordmark from '../components/Wordmark';
import SetupForm from '../components/SetupForm';

export default function SetupPage({ config, setConfig, onStart }) {
  return (
    <div className="min-h-full flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between border-b border-line">
        <Wordmark />
        <span className="hidden sm:inline text-ink-muted text-[13px]">Voice mock interviews with a demanding interviewer</span>
      </header>

      <main className="flex-1 px-4 py-10">
        <div className="mx-auto w-full max-w-[560px] flex flex-col gap-8">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.01em] m-0">Set up your interview</h1>
            <p className="text-ink-muted mt-2 max-w-[48ch]">
              Chad, the interviewer, will run a 20-minute session, push back on vague answers, and score you afterward.
            </p>
          </div>

          <SetupForm config={config} setConfig={setConfig} onStart={onStart} />

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px] border-t border-line pt-6 m-0">
            <div>
              <dt className="text-ink-muted">Voice mode</dt>
              <dd className="m-0 mt-1">Uses your microphone. Find somewhere quiet.</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Resume</dt>
              <dd className="m-0 mt-1">Questions reference your listed projects when you attach one.</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Technical</dt>
              <dd className="m-0 mt-1">Includes a coding problem in an editor you submit from.</dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
