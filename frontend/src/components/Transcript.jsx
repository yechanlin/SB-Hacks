import React, { useEffect, useRef } from 'react';

function emptyText(agentState, interactionMode) {
  switch (agentState) {
    case 'connecting':
      return 'Connecting to the interviewer…';
    case 'listening':
    case 'thinking':
    case 'speaking':
      return interactionMode === 'speech'
        ? 'Chad will open the interview. Your words appear here as they are heard.'
        : 'Chad will open the interview. Type your answers in the bar below.';
    default:
      return 'Not connected.';
  }
}

export default function Transcript({ messages, agentState, interactionMode }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  return (
    <div className="scroll flex-1 min-h-0 px-5 py-5">
      {messages.length === 0 ? (
        <p className="m-0 text-ink-faint text-[13px]">{emptyText(agentState, interactionMode)}</p>
      ) : (
        <ol className="list-none m-0 p-0 flex flex-col gap-5 max-w-[68ch]">
          {messages.map((msg, i) => {
            const mine = msg.role === 'user';
            return (
              <li key={i} className={`flex flex-col gap-1 ${mine ? 'items-end self-end' : 'items-start'} max-w-[90%]`}>
                <div className="flex items-baseline gap-2 text-[11px] font-mono text-ink-faint">
                  <span>{mine ? 'You' : 'Chad'}</span>
                  {msg.timestamp && <span>{msg.timestamp}</span>}
                </div>
                <div
                  className={`text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
                    mine ? 'bg-panel-raised border border-line rounded-md px-3.5 py-2.5' : 'text-ink'
                  }`}
                >
                  {msg.content}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <div ref={endRef} />
    </div>
  );
}
