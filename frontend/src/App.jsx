import React, { useState, useRef } from 'react';
import InterviewConfig from './components/InterviewConfig';
import ConversationHistory from './components/ConversationHistory';
import InterviewControls from './components/InterviewControls';
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

  const {
    isConnected,
    status,
    messages,
    interviewStats,
    startInterview,
    endInterview,
    resetInterview,
    sendTextResponse
  } = useVoiceAgent(config);

  return (
    <div className="min-h-screen bg-gradient-to-br from-interview-purple via-interview-dark-purple to-interview-pink bg-fixed font-jura">
      <header className="bg-gradient-to-r from-white to-gray-50 border-b-4 border-interview-purple shadow-lg shadow-interview-purple/15 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-user-tie text-2xl text-interview-purple"></i>
            <h1 className="text-2xl font-semibold text-interview-purple m-0">AI Mock Interview Agent</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8">
        <InterviewConfig 
          config={config}
          setConfig={setConfig}
          stats={interviewStats}
          isConnected={isConnected}
        />
        
        <ConversationHistory 
          messages={messages}
          interactionMode={config.interactionMode}
          isConnected={isConnected}
          onSendTextResponse={sendTextResponse}
        />
        
        <InterviewControls
          isConnected={isConnected}
          status={status}
          onStart={startInterview}
          onEnd={endInterview}
          onReset={resetInterview}
        />
      </div>
    </div>
  );
}

export default App;
