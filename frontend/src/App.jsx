import React, { useState } from 'react';
import SetupPage from './pages/SetupPage';
import SessionPage from './pages/SessionPage';
import ReportPage from './pages/ReportPage';
import { useVoiceAgent } from './hooks/useVoiceAgent';
import './App.css';

const DEFAULT_CONFIG = {
  role: 'software_engineer',
  customRole: '',
  companyName: '',
  resumeContent: '',
  resumeFileName: '',
  interviewType: 'behavioral',
  difficulty: 'mid',
  interactionMode: 'speech'
};

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [page, setPage] = useState('setup');

  const agent = useVoiceAgent(config);

  const handleStart = () => {
    setPage('session');
    agent.startInterview();
  };

  const handleEnd = async () => {
    await agent.endInterview();
    setPage('report');
  };

  const handleRestart = () => {
    agent.resetInterview();
    setPage('setup');
  };

  if (page === 'session') {
    return (
      <SessionPage
        config={config}
        agentState={agent.agentState}
        status={agent.status}
        isConnected={agent.isConnected}
        messages={agent.messages}
        interviewStats={agent.interviewStats}
        onSendText={agent.sendTextResponse}
        onEnd={handleEnd}
        onAbort={handleRestart}
      />
    );
  }

  if (page === 'report') {
    return (
      <ReportPage
        config={config}
        sessionId={agent.sessionId}
        interviewStats={agent.interviewStats}
        messages={agent.messages}
        onRestart={handleRestart}
      />
    );
  }

  return <SetupPage config={config} setConfig={setConfig} onStart={handleStart} />;
}
