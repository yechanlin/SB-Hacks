import React, { useState } from 'react';

export default function InterviewControls({ isConnected, status, onStart, onEnd, onReset }) {
  const [injectMessage, setInjectMessage] = useState('');

  const handleSendInject = () => {
    if (injectMessage.trim()) {
      // This would need to be implemented in the voice agent hook
      console.log('Inject message:', injectMessage);
      setInjectMessage('');
    }
  };

  const getStatusClass = () => {
    if (status.includes('ERROR')) return 'error';
    if (status.includes('CONNECTING')) return 'connecting';
    if (status.includes('CONNECTED')) return 'success';
    return 'disconnected';
  };

  return (
    <div className="card">
      <h2 className="card-title">
        <i className="fa-solid fa-sliders"></i> Interview Controls
      </h2>

      <div className="controls-layout">
        {/* Left Side: Status & Controls */}
        <div className="controls-left">
          <div className="status-banner">
            <div className={`status-indicator ${getStatusClass()}`}>
              <span>{status}</span>
            </div>
          </div>

          <div className="action-buttons">
            <button
              onClick={onStart}
              disabled={isConnected}
              className="btn btn-primary"
            >
              <i className="fa-solid fa-play"></i> Start Interview
            </button>
            <button
              onClick={onEnd}
              disabled={!isConnected}
              className="btn btn-danger"
            >
              <i className="fa-solid fa-stop"></i> End Interview
            </button>
            <button
              onClick={onReset}
              className="btn btn-secondary"
            >
              <i className="fa-solid fa-xmark"></i> Reset
            </button>
          </div>
        </div>

        {/* Right Side: Text Input */}
        <div className="controls-right">
          <div className="form-field">
            <label>Inject Additional Context (Optional)</label>
            <div className="inject-input-group">
              <input
                type="text"
                value={injectMessage}
                onChange={(e) => setInjectMessage(e.target.value)}
                placeholder="Send additional context or instructions to the agent"
                disabled={!isConnected}
              />
              <button
                onClick={handleSendInject}
                disabled={!isConnected || !injectMessage.trim()}
                className="btn btn-primary"
              >
                <i className="fa-solid fa-paper-plane"></i> Send
              </button>
            </div>
            <small>Use this to inject context or clarifications during the interview</small>
          </div>
        </div>
      </div>
    </div>
  );
}
