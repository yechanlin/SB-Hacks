import React, { useEffect, useRef, useState } from 'react';

export default function ConversationHistory({ messages, interactionMode, isConnected, onSendTextResponse }) {
  const historyRef = useRef(null);
  const [textInput, setTextInput] = useState('');

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendText = () => {
    if (textInput.trim() && onSendTextResponse) {
      onSendTextResponse(textInput.trim());
      setTextInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">
        <i className="fa-solid fa-comments"></i> Interview Conversation
      </h2>
      
      <div ref={historyRef} className="conversation-history">
        {messages.length === 0 && (
          <div className="empty-state">
            Click "Start Interview" to begin your mock interview...
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="role">{msg.role === 'user' ? 'You' : 'Interviewer'}</div>
            <div className="content">{msg.content}</div>
            {msg.timestamp && <div className="timestamp">{msg.timestamp}</div>}
          </div>
        ))}
      </div>
      
      {/* Text Response Input (shown only in text mode when connected) */}
      {interactionMode === 'text' && isConnected && (
        <div className="text-response-container">
          <label>
            <i className="fa-solid fa-keyboard"></i> Your Response:
          </label>
          <div className="text-response-input-group">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your answer here and press Enter or click Send..."
              rows="3"
            />
            <button
              onClick={handleSendText}
              className="send-btn"
              disabled={!textInput.trim()}
            >
              <i className="fa-solid fa-paper-plane"></i> Send
            </button>
          </div>
          <small className="tip">
            💡 Tip: Press Enter to send, Shift+Enter for new line
          </small>
        </div>
      )}
    </div>
  );
}
