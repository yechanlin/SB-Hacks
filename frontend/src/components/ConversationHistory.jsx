import React, { useEffect, useRef, useState } from 'react';

export default function ConversationHistory({ messages, interactionMode, isConnected, onSendTextResponse }) {
  const historyRef = useRef(null);
  const [textInput, setTextInput] = useState('');
  const [isVisible, setIsVisible] = useState(true);

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
    <div className="bg-white/95 backdrop-blur-lg border-2 border-slate-300 rounded-2xl p-6 mb-6 shadow-xl shadow-slate-300/50">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl text-center text-interview-purple uppercase tracking-widest font-bold flex-1">
          <i className="fa-solid fa-comments"></i> Interview Conversation
        </h2>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="px-4 py-2 bg-gradient-to-br from-interview-purple to-interview-dark-purple text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
          title={isVisible ? 'Hide conversation' : 'Show conversation'}
        >
          <i className={`fa-solid ${isVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
        </button>
      </div>
      
      {isVisible && <div 
        ref={historyRef} 
        className="min-h-[400px] max-h-[480px] overflow-y-auto p-4 bg-gray-50/90 rounded-xl border-2 border-slate-300 shadow-inner scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100/50 [&::-webkit-scrollbar-thumb]:bg-gradient-to-b [&::-webkit-scrollbar-thumb]:from-interview-purple [&::-webkit-scrollbar-thumb]:to-interview-dark-purple [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:from-interview-purple/80 [&::-webkit-scrollbar-thumb:hover]:to-interview-dark-purple/80"
      >
        {messages.length === 0 && (
          <div className="text-purple-300 italic flex items-center justify-center min-h-[400px]">
            Click "Start Interview" to begin your mock interview...
          </div>
        )}
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`mb-4 flex flex-col max-w-[70%] clear-both ${
              msg.role === 'user' 
                ? 'items-start float-left' 
                : 'items-end float-right ml-auto'
            }`}
          >
            <div className={`text-sm font-bold mb-2 capitalize ${
              msg.role === 'user' ? 'text-blue-500' : 'text-purple-600'
            }`}>
              {msg.role === 'user' ? 'You' : 'Interviewer'}
            </div>
            <div className={`text-base leading-relaxed text-gray-800 p-3 px-4 rounded-xl break-words border ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-blue-100 to-slate-200 text-gray-800 border-slate-300/50 rounded-bl shadow-md shadow-slate-300/30 before:content-[">_"] before:text-black/20 before:mr-1'
                : 'bg-gradient-to-br from-slate-100 to-gray-100 text-gray-800 border-slate-300/50 rounded-br shadow-md shadow-slate-300/30 before:content-[">_"] before:text-black/20 before:mr-1'
            }`}>
              {msg.content}
            </div>
            {msg.timestamp && <div className="text-xs text-gray-600 mt-2">{msg.timestamp}</div>}
          </div>
        ))}
        <div className="clear-both"></div>
      </div>}
      
      {/* Text Response Input (shown only in text mode when connected) */}
      {interactionMode === 'text' && isConnected && isVisible && (
        <div className="mt-4 p-4 bg-slate-50 rounded-xl border-2 border-slate-300">
          <label className="mb-2 block font-semibold">
            <i className="fa-solid fa-keyboard"></i> Your Response:
          </label>
          <div className="flex gap-3 items-end">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your answer here and press Enter or click Send..."
              rows="3"
              className="flex-1 resize-y font-jura p-3 border-2 border-interview-purple/20 rounded-lg focus:outline-none focus:border-interview-purple"
            />
            <button
              onClick={handleSendText}
              className="px-4 py-3 bg-gradient-to-br from-interview-purple to-interview-dark-purple text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 whitespace-nowrap"
              disabled={!textInput.trim()}
            >
              <i className="fa-solid fa-paper-plane"></i> Send
            </button>
          </div>
          <small className="block mt-2 text-gray-600">
            💡 Tip: Press Enter to send, Shift+Enter for new line
          </small>
        </div>
      )}
    </div>
  );
}
