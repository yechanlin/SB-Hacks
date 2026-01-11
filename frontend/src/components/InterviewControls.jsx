import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { generateFeedback, getConversations } from '../utils/api';

export default function InterviewControls({ isConnected, status, onStart, onEnd, onReset, sessionId, interviewEnded }) {
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [feedbackError, setFeedbackError] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [conversationCount, setConversationCount] = useState(null);

  const handleCheckConversations = async () => {
    if (!sessionId) {
      console.warn('⚠️ No sessionId available');
      return;
    }

    try {
      const result = await getConversations(sessionId);
      console.log('📊 Conversations in database:', result);
      setConversationCount(result.count);
      alert(`Found ${result.count} conversations in database for this session.\nCheck console for details.`);
    } catch (error) {
      console.error('Error checking conversations:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleGenerateFeedback = async () => {
    if (!sessionId) {
      setFeedbackError('Session ID not available. Please ensure the interview session was properly created.');
      return;
    }

    setIsGeneratingFeedback(true);
    setFeedbackError(null);
    setFeedback(null);

    // First check conversations
    try {
      const convResult = await getConversations(sessionId);
      console.log('📊 Checking conversations before generating feedback:', convResult);
      setConversationCount(convResult.count);
      
      if (convResult.count === 0) {
        setFeedbackError(`No conversations found in database. Found ${convResult.count} conversations. Check console for details.`);
        setIsGeneratingFeedback(false);
        return;
      }
    } catch (error) {
      console.error('Error checking conversations:', error);
      // Continue anyway
    }

    try {
      const result = await generateFeedback(sessionId);
      console.log('📋 Feedback API response:', result);
      // The backend returns report.content for the feedback data
      const feedbackData = result.report?.content || result.report;
      console.log('📊 Extracted feedback data:', feedbackData);
      setFeedback(feedbackData);
      setShowFeedback(true);
    } catch (error) {
      console.error('Error generating feedback:', error);
      setFeedbackError(error.message || 'Failed to generate feedback. Please try again.');
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

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

      <div className="flex flex-col gap-4">
        {/* Status */}
        <div className={`px-4 py-2 rounded-lg font-semibold text-sm text-center border-2 ${statusInfo.color} flex items-center justify-center gap-2`}>
          <i className={`fa-solid ${statusInfo.icon} ${statusInfo.pulse ? 'fa-spin' : ''}`}></i>
          <span>{status}</span>
        </div>
        
        {/* Main Control Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onStart}
            disabled={isConnected}
            className="px-4 py-2.5 border-none rounded-lg font-jura text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all bg-gradient-to-br from-emerald-500 to-green-600 text-white hover:scale-105 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            <i className="fa-solid fa-play"></i> Start
          </button>
          <button
            onClick={onEnd}
            disabled={!isConnected}
            className="px-4 py-2.5 border-none rounded-lg font-jura text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all bg-gradient-to-br from-red-500 to-red-700 text-white hover:scale-105 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            <i className="fa-solid fa-stop"></i> End
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2.5 border-none rounded-lg font-jura text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all bg-gradient-to-br from-gray-500 to-gray-700 text-white hover:scale-105 hover:shadow-lg"
          >
            <i className="fa-solid fa-rotate-right"></i> Reset
          </button>
        </div>

        {/* Additional Buttons - Only shown after interview ends */}
        {interviewEnded && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCheckConversations}
              className="px-4 py-2.5 border-none rounded-lg font-jura text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:scale-105 hover:shadow-lg"
              title="Check how many conversations are saved in database"
            >
              <i className="fa-solid fa-database"></i>
              Check Conversations {conversationCount !== null && `(${conversationCount})`}
            </button>
            <button
              onClick={handleGenerateFeedback}
              disabled={isGeneratingFeedback}
              className="px-4 py-2.5 border-none rounded-lg font-jura text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all bg-gradient-to-br from-interview-purple to-interview-dark-purple text-white hover:scale-105 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              <i className={`fa-solid ${isGeneratingFeedback ? 'fa-spinner fa-spin' : 'fa-star'}`}></i>
              {isGeneratingFeedback ? 'Generating Feedback...' : 'Generate Feedback'}
            </button>
          </div>
        )}
      </div>

      {/* Feedback Error Display (inline) */}
      {feedbackError && (
        <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-2xl shadow-lg">
          <div className="text-red-600 text-sm font-semibold flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{feedbackError}</span>
          </div>
        </div>
      )}

      {/* Feedback Modal Popup - Rendered via Portal */}
      {feedback && showFeedback && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
            onClick={() => setShowFeedback(false)}
          ></div>
          
          {/* Modal Content - Centered using transform */}
          <div 
            className="fixed z-[10000] bg-white rounded-2xl shadow-2xl w-[90vw] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-interview-purple to-interview-dark-purple text-white px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-star text-2xl"></i>
                <h2 className="text-2xl font-bold">Interview Feedback</h2>
              </div>
              <button
                onClick={() => setShowFeedback(false)}
                className="text-white/90 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                aria-label="Close feedback"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border-l-4 border-interview-purple">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-file-lines text-interview-purple"></i>
                  Summary
                </h3>
                <p className="text-gray-700 leading-relaxed">{feedback.summary}</p>
              </div>

              {/* Scores */}
              {feedback.scores && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-chart-bar text-interview-purple"></i>
                    Scores
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(feedback.scores).map(([key, value]) => (
                      <div key={key} className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border-2 border-gray-200 hover:border-interview-purple/50 transition-all shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-700 capitalize">{key}</span>
                          <span className="font-bold text-2xl text-interview-purple">{value}/100</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {feedback.strengths && feedback.strengths.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-white p-5 rounded-xl border-l-4 border-green-500">
                  <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-check-circle text-green-600"></i>
                    Strengths
                  </h3>
                  <ul className="space-y-3">
                    {feedback.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700">
                        <i className="fa-solid fa-chevron-right text-green-500 mt-1 text-sm"></i>
                        <span className="flex-1">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {feedback.weaknesses && feedback.weaknesses.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-white p-5 rounded-xl border-l-4 border-orange-500">
                  <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-exclamation-triangle text-orange-600"></i>
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-3">
                    {feedback.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700">
                        <i className="fa-solid fa-chevron-right text-orange-500 mt-1 text-sm"></i>
                        <span className="flex-1">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {feedback.recommendations && feedback.recommendations.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border-l-4 border-blue-500">
                  <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-lightbulb text-blue-600"></i>
                    Recommendations
                  </h3>
                  <ul className="space-y-3">
                    {feedback.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700">
                        <i className="fa-solid fa-chevron-right text-blue-500 mt-1 text-sm"></i>
                        <span className="flex-1">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
              <button
                onClick={() => setShowFeedback(false)}
                className="px-6 py-2.5 bg-gradient-to-br from-interview-purple to-interview-dark-purple text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
