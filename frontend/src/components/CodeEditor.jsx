import React, { useState, useEffect } from 'react';
import MonacoCodeEditor from './MonacoCodeEditor';

export default function CodeEditor({ interviewType, isConnected, sendTextResponse, messages }) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [problem, setProblem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProblem, setShowProblem] = useState(false);

  // Only show for technical or mixed interviews
  if (interviewType !== 'technical' && interviewType !== 'mixed') {
    return null;
  }

  // Fetch the problem on mount
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const response = await fetch('/api/problem');
        if (response.ok) {
          const problemData = await response.json();
          setProblem(problemData);
          // Set initial code with function signature
          if (problemData.functionSignature && problemData.functionSignature[language]) {
            setCode(problemData.functionSignature[language]);
          }
        }
      } catch (error) {
        console.error('Error fetching problem:', error);
      }
    };
    fetchProblem();
  }, []);

  // Update code when language changes
  useEffect(() => {
    if (problem && problem.functionSignature && problem.functionSignature[language]) {
      setCode(problem.functionSignature[language]);
    }
  }, [language, problem]);

  // Monitor interviewer messages for the special [SHOW_PROBLEM] marker
  useEffect(() => {
    if (!messages || messages.length === 0 || showProblem) return;
    
    // Check the last interviewer message for the marker metadata
    const lastInterviewerMessage = messages
      .filter(msg => msg.role === 'interviewer')
      .slice(-1)[0];
    
    if (lastInterviewerMessage && lastInterviewerMessage.showProblem) {
      console.log('Problem marker detected, showing problem statement');
      setShowProblem(true);
    }
  }, [messages, showProblem]);

  const languages = [
    { value: 'javascript', label: 'JavaScript', icon: 'fa-brands fa-js' },
    { value: 'python', label: 'Python', icon: 'fa-brands fa-python' },
    { value: 'java', label: 'Java', icon: 'fa-brands fa-java' },
    { value: 'cpp', label: 'C++', icon: 'fa-solid fa-code' },
    { value: 'csharp', label: 'C#', icon: 'fa-solid fa-code' },
    { value: 'go', label: 'Go', icon: 'fa-brands fa-golang' },
    { value: 'rust', label: 'Rust', icon: 'fa-solid fa-code' },
    { value: 'typescript', label: 'TypeScript', icon: 'fa-brands fa-js' },
    { value: 'ruby', label: 'Ruby', icon: 'fa-solid fa-gem' },
    { value: 'php', label: 'PHP', icon: 'fa-brands fa-php' },
  ];

  const handleSubmit = () => {
    if (!code.trim() || !problem || isSubmitting) {
      return;
    }

    // Check if interview is connected before submitting
    if (!isConnected) {
      alert('Please start the interview first before submitting code.');
      return;
    }

    if (!sendTextResponse) {
      console.error('sendTextResponse is not available');
      return;
    }

    setIsSubmitting(true);
    
    // Get language label for the message
    const languageLabel = languages.find(lang => lang.value === language)?.label || language;
    
    // Format code as a message to send to the agent
    const codeMessage = `Here is my solution:

\`\`\`${language}
${code.trim()}
\`\`\``;

    try {
      sendTextResponse(codeMessage);
    } catch (error) {
      console.error('Error submitting code:', error);
      alert('Error submitting code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Problem Statement */}
      {problem && showProblem && (
        <div className="bg-gradient-to-br from-blue-50/95 via-white to-blue-50/95 backdrop-blur-lg border-2 border-blue-400/50 rounded-2xl shadow-xl shadow-blue-300/30 flex-shrink-0 max-h-[35vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-2xl border-b-2 border-blue-500/50 z-10">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <i className="fa-solid fa-code text-2xl"></i>
                <div>
                  <h3 className="text-2xl font-bold mb-1.5">
                    {problem.title}
                  </h3>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wide ${
                    problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {problem.difficulty}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowProblem(!showProblem)}
                className="text-white/90 hover:text-white hover:bg-white/20 px-3 py-2 rounded-lg transition-all"
                title="Hide problem"
              >
                <i className="fa-solid fa-eye-slash text-lg"></i>
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="text-base text-gray-800 leading-relaxed font-sans space-y-4">
              {(() => {
                const description = problem.description;
                const parts = description.split(/\n(?=Example \d+:|Constraints:)/);
                return parts.map((part, idx) => {
                  const trimmed = part.trim();
                  if (trimmed.match(/^Example \d+:/)) {
                    const lines = trimmed.split('\n');
                    const title = lines[0];
                    const content = lines.slice(1).join('\n');
                    return (
                      <div key={idx} className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg shadow-sm">
                        <div className="font-bold text-blue-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                          <i className="fa-solid fa-lightbulb"></i>
                          {title}
                        </div>
                        <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap font-normal leading-relaxed">
                          {content}
                        </pre>
                      </div>
                    );
                  } else if (trimmed.startsWith('Constraints:')) {
                    const lines = trimmed.split('\n');
                    const title = lines[0];
                    const content = lines.slice(1).join('\n');
                    return (
                      <div key={idx} className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg shadow-sm">
                        <div className="font-bold text-amber-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                          <i className="fa-solid fa-list-check"></i>
                          {title}
                        </div>
                        <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap font-normal leading-relaxed">
                          {content}
                        </pre>
                      </div>
                    );
                  } else {
                    return (
                      <p key={idx} className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {trimmed}
                      </p>
                    );
                  }
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {!showProblem && (
        <button
          onClick={() => setShowProblem(true)}
          className="text-sm text-blue-600 hover:text-blue-800 font-semibold self-start"
        >
          <i className="fa-solid fa-eye mr-1"></i> Show Problem
        </button>
      )}

      {/* Code Editor Section */}
      <div className="bg-white/95 backdrop-blur-lg border-2 border-slate-300 rounded-2xl p-6 shadow-xl shadow-slate-300/50 flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl text-interview-purple uppercase tracking-widest font-bold">
            <i className="fa-solid fa-laptop-code"></i> Code Editor
          </h2>
          {/* Language Selector */}
          <div className="flex items-center gap-3">
            <label className="font-semibold text-gray-700 flex items-center gap-2">
              <i className="fa-solid fa-language"></i> Language:
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="p-2 px-4 border-2 border-slate-300 rounded-lg font-jura text-sm font-medium focus:outline-none focus:border-interview-purple bg-white"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Monaco Code Editor */}
        <div className="relative flex-1 min-h-0">
          <MonacoCodeEditor
            code={code}
            setCode={setCode}
            language={language}
          />
          {/* Line counter indicator */}
          <div className="absolute bottom-3 right-3 bg-slate-800/80 px-3 py-1 rounded text-xs font-mono text-slate-400 border border-slate-700">
            Lines: {code.split('\n').length} | Chars: {code.length}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-3 justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (problem && problem.functionSignature && problem.functionSignature[language]) {
                  setCode(problem.functionSignature[language]);
                } else {
                  setCode('');
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              <i className="fa-solid fa-trash"></i> Reset
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(code);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!code.trim() || isSubmitting}
            >
              <i className="fa-solid fa-copy"></i> Copy
            </button>
          </div>
          
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
            disabled={!code.trim() || !isConnected || isSubmitting}
            title={!isConnected ? 'Start interview first before submitting code' : isSubmitting ? 'Submitting code...' : 'Submit code to the interviewer'}
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Submitting...
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane"></i> Submit Code
              </>
            )}
          </button>
        </div>

        {/* Info message */}
        <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
          <p className="text-sm text-gray-700">
            <i className="fa-solid fa-info-circle text-blue-500"></i> 
            <strong className="ml-2">Note:</strong> Write your solution and click Submit to get feedback from the interviewer.
          </p>
        </div>
      </div>
    </div>
  );
}
