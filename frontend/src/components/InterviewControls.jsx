import React, { useState } from 'react';
import { generateFeedback, getConversations } from '../utils/api';

export default function InterviewControls({ isConnected, status, onStart, onEnd, onReset, sessionId, interviewEnded }) {
  const [injectMessage, setInjectMessage] = useState('');
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [feedbackError, setFeedbackError] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [conversationCount, setConversationCount] = useState(null);

  const handleSendInject = () => {
    if (injectMessage.trim()) {
      // This would need to be implemented in the voice agent hook
      console.log('Inject message:', injectMessage);
      setInjectMessage('');
    }
  };

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
      setFeedback(result.report);
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

      <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-start">
        {/* Left Side: Status & Buttons */}
        <div className="flex flex-col gap-3">
          {/* Status */}
          <div className={`px-4 py-2 rounded-lg font-semibold text-sm text-center border-2 ${statusInfo.color} flex items-center justify-center gap-2`}>
            <i className={`fa-solid ${statusInfo.icon} ${statusInfo.pulse ? 'fa-spin' : ''}`}></i>
            <span>{status}</span>
          </div>
          
          {/* Buttons */}
          <div className="flex flex-col gap-2">
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
            {interviewEnded && (
              <>
                <button
                  onClick={handleCheckConversations}
                  className="px-4 py-2 border-none rounded-lg font-jura text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:scale-105 hover:shadow-lg w-full"
                  title="Check how many conversations are saved in database"
                >
                  <i className="fa-solid fa-database"></i>
                  Check Conversations {conversationCount !== null && `(${conversationCount})`}
                </button>
                <button
                  onClick={handleGenerateFeedback}
                  disabled={isGeneratingFeedback}
                  className="px-4 py-2 border-none rounded-lg font-jura text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all bg-gradient-to-br from-interview-purple to-interview-dark-purple text-white hover:scale-105 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none w-full"
                >
                  <i className={`fa-solid ${isGeneratingFeedback ? 'fa-spinner fa-spin' : 'fa-star'}`}></i>
                  {isGeneratingFeedback ? 'Generating Feedback...' : 'Generate Feedback'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Context Injection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 flex items-center gap-2">
            <i className="fa-solid fa-message-plus"></i> Inject Context (Optional)
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={injectMessage}
              onChange={(e) => setInjectMessage(e.target.value)}
              placeholder="Send additional context or instructions..."
              disabled={!isConnected}
              className="flex-1 p-2.5 border-2 border-interview-purple/20 rounded-lg font-jura text-sm font-medium focus:outline-none focus:border-interview-purple focus:ring-2 focus:ring-interview-purple/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
            <button
              onClick={handleSendInject}
              disabled={!isConnected || !injectMessage.trim()}
              className="px-4 py-2.5 border-none rounded-lg font-jura text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all bg-gradient-to-br from-interview-purple to-interview-dark-purple text-white hover:scale-105 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none whitespace-nowrap"
            >
              <i className="fa-solid fa-paper-plane"></i> Send
            </button>
          </div>
          <small className="text-gray-600 text-xs flex items-start gap-1">
            <i className="fa-solid fa-circle-info mt-0.5"></i>
            <span>Add clarifications during the interview</span>
          </small>
        </div>
      </div>

      {/* Feedback Section */}
      {(feedbackError || feedback) && (
        <div className="mt-4 p-4 bg-white/95 backdrop-blur-lg border-2 border-slate-300 rounded-2xl shadow-xl">
          {feedbackError && (
            <div className="text-red-600 text-sm font-semibold flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{feedbackError}</span>
            </div>
          )}
          {feedback && showFeedback && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-interview-purple">Interview Feedback</h3>
                <button
                  onClick={() => setShowFeedback(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              
              {/* Summary */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Summary</h4>
                <p className="text-sm text-gray-600">{feedback.content.summary}</p>
              </div>

              {/* Scores */}
              {feedback.content.scores && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Scores</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Overall: <span className="font-bold text-interview-purple">{feedback.content.scores.overall}/100</span></div>
                    <div>Communication: <span className="font-bold text-blue-600">{feedback.content.scores.communication}/100</span></div>
                    <div>Technical: <span className="font-bold text-green-600">{feedback.content.scores.technical}/100</span></div>
                    <div>Behavior: <span className="font-bold text-orange-600">{feedback.content.scores.behavior}/100</span></div>
                  </div>
                </div>
              )}

              {/* Strengths */}
              {feedback.content.strengths && feedback.content.strengths.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">Strengths</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {feedback.content.strengths.map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {feedback.content.weaknesses && feedback.content.weaknesses.length > 0 && (
                <div>
                  <h4 className="font-semibold text-orange-700 mb-2">Areas for Improvement</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {feedback.content.weaknesses.map((weakness, idx) => (
                      <li key={idx}>{weakness}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {feedback.content.recommendations && feedback.content.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-blue-700 mb-2">Recommendations</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {feedback.content.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
