import React, { useState } from 'react';

export default function SessionBar({ status, agentState, isConnected, interactionMode, onSendText, onEnd }) {
  const [text, setText] = useState('');
  const [ending, setEnding] = useState(false);
  const isError = status.startsWith('ERROR');

  const send = () => {
    const value = text.trim();
    if (!value || !isConnected) return;
    onSendText(value);
    setText('');
  };

  const handleEnd = async () => {
    setEnding(true);
    try {
      await onEnd();
    } finally {
      setEnding(false);
    }
  };

  const micLive = interactionMode === 'speech' && isConnected && agentState !== 'connecting';

  return (
    <footer className="border-t border-line px-5 py-3 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-[13px] min-w-[140px]">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            isError ? 'bg-warn' : isConnected ? (micLive ? 'bg-good' : 'bg-accent') : 'bg-ink-faint'
          }`}
          aria-hidden="true"
        ></span>
        <span className={isError ? 'text-warn' : 'text-ink-muted'}>
          {isError
            ? status.replace(/^ERROR:\s*/, '')
            : !isConnected
              ? 'Disconnected'
              : micLive
                ? 'Mic live'
                : interactionMode === 'text'
                  ? 'Text mode'
                  : 'Connected'}
        </span>
      </div>

      {interactionMode === 'text' ? (
        <form
          className="flex-1 min-w-[240px] flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            id="answer"
            className="field"
            type="text"
            placeholder={isConnected ? 'Type your answer and press Enter' : 'Waiting for connection…'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!isConnected}
            autoComplete="off"
          />
          <button type="submit" className="btn btn-ghost" disabled={!isConnected || !text.trim()}>
            Send
          </button>
        </form>
      ) : (
        <div className="flex-1 min-w-[120px] text-[13px] text-ink-faint">
          {isConnected ? 'Speak naturally. Chad will interrupt if you run long.' : ''}
        </div>
      )}

      <button type="button" className="btn btn-danger" onClick={handleEnd} disabled={ending}>
        {ending ? 'Ending…' : 'End interview'}
      </button>
    </footer>
  );
}
