import React from 'react';

export default function Wordmark({ muted = false }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-[-0.01em] ${muted ? 'text-ink-muted' : 'text-ink'}`}>
      <span className="inline-block w-2 h-2 rounded-full bg-accent" aria-hidden="true"></span>
      Rehearse
    </span>
  );
}
