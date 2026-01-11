import React from 'react';

export default function InterviewControls({ isConnected, status, onStart, onEnd, onReset }) {
  const getStatusInfo = () => {
    if (status.includes('ERROR')) {
      return {
        color: 'bg-red-500/10 border-red-500 text-red-900',
        icon: 'fa-circle-xmark',
        pulse: false
      };
    }
    if (status.includes('CONNECTING')) {
      return {
        color: 'bg-orange-500/10 border-orange-500 text-orange-800',
        icon: 'fa-spinner',
        pulse: true
      };
    }
    if (status.includes('CONNECTED')) {
      return {
        color: 'bg-emerald-500/10 border-emerald-500 text-green-800',
        icon: 'fa-circle-check',
        pulse: false
      };
    }
    return {
      color: 'bg-gray-500/10 border-gray-500 text-gray-700',
      icon: 'fa-circle',
      pulse: false
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="bg-white/95 backdrop-blur-lg border-2 border-slate-300 rounded-2xl p-6 mb-6 shadow-xl shadow-slate-300/50">
      <h2 className="text-xl mb-4 text-center text-interview-purple uppercase tracking-widest font-bold flex items-center justify-center gap-3">
        <i className="fa-solid fa-sliders"></i> Interview Controls
      </h2>

      <div className="flex flex-col gap-3 items-center max-w-md mx-auto">
        {/* Status */}
        <div className={`px-4 py-2 rounded-lg font-semibold text-sm text-center border-2 ${statusInfo.color} flex items-center justify-center gap-2 w-full`}>
          <i className={`fa-solid ${statusInfo.icon} ${statusInfo.pulse ? 'fa-spin' : ''}`}></i>
          <span>{status}</span>
        </div>
        
        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onStart}
            disabled={isConnected}
            className="px-4 py-2 border-none rounded-lg font-jura text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all bg-gradient-to-br from-emerald-500 to-green-600 text-white hover:scale-105 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            <i className="fa-solid fa-play"></i> Start
          </button>
          <button
            onClick={onEnd}
            disabled={!isConnected}
            className="px-4 py-2 border-none rounded-lg font-jura text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all bg-gradient-to-br from-red-500 to-red-700 text-white hover:scale-105 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            <i className="fa-solid fa-stop"></i> End
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 border-none rounded-lg font-jura text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all bg-gradient-to-br from-gray-500 to-gray-700 text-white hover:scale-105 hover:shadow-lg"
          >
            <i className="fa-solid fa-rotate-right"></i> Reset
          </button>
        </div>
      </div>
    </div>
  );
}
