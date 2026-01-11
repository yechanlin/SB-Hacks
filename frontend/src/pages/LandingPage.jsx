import React from 'react';
import InterviewConfig from '../components/InterviewConfig';

export default function LandingPage({ config, setConfig, interviewStats, isConnected, onProceed }) {
  return (
    <div className="w-full h-[100vh] flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-gray-200 to-slate-200">
      <div className="w-full max-w-3xl flex flex-col items-center justify-center">
        <InterviewConfig
          config={config}
          setConfig={setConfig}
          stats={interviewStats}
          isConnected={isConnected}
          compact
        />
        <button
          className="mt-4 px-8 py-3 bg-gradient-to-br from-interview-purple to-interview-dark-purple text-white rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-all"
          onClick={onProceed}
        >
          Proceed to Interview
        </button>
      </div>
    </div>
  );
}
