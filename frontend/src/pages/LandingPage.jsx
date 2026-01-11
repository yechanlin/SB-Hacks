import React from 'react';
import InterviewConfig from '../components/InterviewConfig';

export default function LandingPage({ config, setConfig, interviewStats, isConnected, onProceed }) {
  return (
    <div className="w-full h-[100vh] flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-gray-200 to-slate-200 overflow-y-auto py-8">
      <div className="w-full max-w-3xl flex flex-col items-center justify-center px-4">
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

        {/* Quick Tips Section */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-300 rounded-xl p-5 w-full shadow-lg">
          <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2 text-lg">
            <i className="fa-solid fa-lightbulb"></i>
            Quick Tips for Success
          </h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-start gap-2">
              <i className="fa-solid fa-check text-green-600 mt-0.5"></i>
              <span>Find a quiet space for the interview</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fa-solid fa-check text-green-600 mt-0.5"></i>
              <span>Have your resume ready for behavioral interviews</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fa-solid fa-check text-green-600 mt-0.5"></i>
              <span>Speak clearly and take your time to think</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fa-solid fa-check text-green-600 mt-0.5"></i>
              <span>Chad is demanding - show your depth of knowledge!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
