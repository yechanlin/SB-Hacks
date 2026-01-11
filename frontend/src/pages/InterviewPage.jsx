import React, { useState } from 'react';
import InterviewConfig from '../components/InterviewConfig';
import ConversationHistory from '../components/ConversationHistory';
import InterviewControls from '../components/InterviewControls';
import CodeEditor from '../components/CodeEditor';

export default function InterviewPage({
  config,
  setConfig,
  messages,
  interactionMode,
  isConnected,
  status,
  interviewStats,
  startInterview,
  endInterview,
  resetInterview,
  sendTextResponse,
  onBack,
  sessionId
}) {
  const isTechnical = config.interviewType === 'technical' || config.interviewType === 'mixed';
  const [interviewEnded, setInterviewEnded] = useState(false);

  const handleEndInterview = () => {
    endInterview();
    setInterviewEnded(true);
  };
  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-100 via-gray-200 to-slate-200 font-jura relative">
      {/* Back to Setup Button - Top Right */}
      <button
        className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-slate-200 text-interview-purple rounded-lg font-semibold shadow-md hover:bg-slate-300 hover:shadow-lg transition-all text-sm"
        onClick={onBack}
      >
        <i className="fa-solid fa-arrow-left mr-1"></i> Back to setup
      </button>

      <div className="w-full h-full grid grid-cols-2 gap-0 pt-14">
        {/* Left Column: Interview Stats, Conversation, Controls */}
        <div className="grid grid-rows-[auto_1fr_auto] h-full p-6 gap-3 overflow-hidden">
          {/* Interview Stats (Progress) - Always visible */}
          <div
            className={`p-4 bg-gradient-to-br from-white/95 to-gray-100/95 backdrop-blur-lg rounded-2xl border-2 border-interview-purple/40 shadow-lg shadow-interview-purple/10 transition-opacity duration-300 ${!interviewStats.isActive ? 'opacity-60 grayscale' : ''}`}
          >
            <h3 className="text-sm font-semibold mb-3 text-center uppercase tracking-wider text-interview-purple">
              <i className="fa-solid fa-chart-line mr-2"></i> Interview Progress
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-white/80 rounded-xl border border-blue-500/20 shadow-sm">
                <div className="text-xs text-gray-600 font-semibold mb-1.5 uppercase tracking-wide">
                  <i className="fa-solid fa-comment-dots mr-1"></i> Questions
                </div>
                <div className="text-2xl font-bold text-blue-500 drop-shadow">{interviewStats.isActive ? interviewStats.questionsCount : 0}</div>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-blue-500/20 shadow-sm">
                <div className="text-xs text-gray-600 font-semibold mb-1.5 uppercase tracking-wide">
                  <i className="fa-solid fa-clock mr-1"></i> Duration
                </div>
                <div className="text-2xl font-bold text-blue-500 drop-shadow">{interviewStats.isActive ? interviewStats.duration : '0:00'}</div>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-blue-500/20 shadow-sm">
                <div className="text-xs text-gray-600 font-semibold mb-1.5 uppercase tracking-wide">
                  <i className="fa-solid fa-circle-check mr-1"></i> Status
                </div>
                <div className="text-xl font-bold text-yellow-500 drop-shadow">{interviewStats.isActive ? interviewStats.status : 'Not Started'}</div>
              </div>
            </div>
          </div>

          <ConversationHistory
            messages={messages}
            interactionMode={interactionMode}
            isConnected={isConnected}
            onSendTextResponse={sendTextResponse}
          />

          <InterviewControls
            isConnected={isConnected}
            status={status}
            onStart={() => {
              startInterview();
              setInterviewEnded(false);
            }}
            onEnd={handleEndInterview}
            onReset={() => {
              resetInterview();
              setInterviewEnded(false);
            }}
            sessionId={sessionId}
            interviewEnded={interviewEnded}
          />
        </div>

        {/* Right Column: Code Editor or Notes */}
        <div className="h-full p-6 overflow-hidden flex flex-col">
          {isTechnical ? (
            <CodeEditor interviewType={config.interviewType} isConnected={isConnected} />
          ) : (
            <div className="bg-white/95 backdrop-blur-lg border-2 border-slate-300 rounded-2xl p-3 shadow-lg shadow-slate-300/30 h-full flex flex-col">
              <h2 className="text-lg text-interview-purple uppercase tracking-widest font-bold mb-2">
                <i className="fa-solid fa-note-sticky"></i> Notes
              </h2>
              <textarea
                className="flex-1 w-full p-2 font-mono text-sm bg-slate-100 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-interview-purple resize-none"
                placeholder="Jot down your notes here..."
                style={{ minHeight: '160px' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}