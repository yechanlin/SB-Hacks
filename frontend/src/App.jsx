import React, { useState, useRef } from 'react';
import InterviewPage from './pages/InterviewPage';
import LandingPage from './pages/LandingPage';
import { useVoiceAgent } from './hooks/useVoiceAgent';
import './App.css';

function App() {
  const [config, setConfig] = useState({
    role: 'software_engineer',
    customRole: '',
    companyName: '',
    resumeContent: '',
    interviewType: 'behavioral',
    difficulty: 'mid',
    interactionMode: 'speech'
  });
  const [page, setPage] = useState('landing');

  const {
    isConnected,
    status,
    messages,
    interviewStats,
    sessionId,
    startInterview,
    endInterview,
    resetInterview,
    sendTextResponse,
    injectHint
  } = useVoiceAgent(config);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-200 to-slate-200 bg-fixed font-jura">
      <header className="bg-gradient-to-r from-white to-gray-50 border-b-4 border-interview-purple shadow-lg shadow-slate-300/50 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-center items-center">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-user-tie text-2xl text-interview-purple"></i>
            <h1 className="text-2xl font-semibold text-interview-purple m-0">AI Mock Interview Agent</h1>
          </div>
        </div>
      </header>

      {page === 'landing' ? (
        <LandingPage
          config={config}
          setConfig={setConfig}
          interviewStats={interviewStats}
          isConnected={isConnected}
          onProceed={() => setPage('interview')}
        />
      ) : (
        <InterviewPage
          config={config}
          setConfig={setConfig}
          messages={messages}
          interactionMode={config.interactionMode}
          isConnected={isConnected}
          status={status}
          interviewStats={interviewStats}
          startInterview={startInterview}
          endInterview={endInterview}
          resetInterview={resetInterview}
          sendTextResponse={sendTextResponse}
          injectHint={injectHint}
          onBack={() => setPage('landing')}
          sessionId={sessionId}
        />
      )}
    </div>
  );
}

export default App;
