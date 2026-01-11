import React, { useState } from 'react';

export default function InterviewConfig({ config, setConfig, stats, isConnected }) {
  const [resumeFileName, setResumeFileName] = useState('No file selected');

  const handleRoleChange = (e) => {
    setConfig({ ...config, role: e.target.value });
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setConfig({ ...config, resumeContent: '' });
      setResumeFileName('No file selected');
      return;
    }

    setResumeFileName(`Selected: ${file.name}`);

    try {
      let content = '';
      if (file.type === 'application/pdf') {
        // PDF parsing would need pdf.js
        if (typeof pdfjsLib !== 'undefined') {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            content += pageText + '\n';
          }
        } else {
          alert('PDF parsing not available. Please upload a .txt file.');
          return;
        }
      } else if (file.type === 'text/plain') {
        content = await file.text();
      } else {
        alert('Please upload a PDF or TXT file');
        return;
      }

      setConfig({ ...config, resumeContent: content });
    } catch (error) {
      console.error('Error reading resume:', error);
      alert('Error reading resume file. Please try again.');
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-lg border-2 border-interview-purple/30 rounded-2xl p-6 mb-6 shadow-xl shadow-interview-purple/15">
      <h2 className="text-2xl mb-8 text-center text-interview-purple uppercase tracking-widest font-bold">
        <i className="fa-solid fa-sliders"></i> Interview Setup
      </h2>
      
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Role Section */}
          <div className="p-6 rounded-xl border-2 bg-gradient-to-br from-interview-purple/10 to-interview-dark-purple/10 border-interview-purple/20">
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-interview-purple">
              <i className="fa-solid fa-briefcase"></i> Position Details
            </h3>
            <div className="mb-4">
              <label className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <i className="fa-solid fa-user-tie"></i> Role/Position
              </label>
              <select 
                value={config.role}
                onChange={handleRoleChange}
                disabled={isConnected}
                className="w-full p-3 border-2 border-interview-purple/20 rounded-lg font-jura text-base font-medium focus:outline-none focus:border-interview-purple disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="software_engineer">Software Engineer</option>
                <option value="frontend_developer">Frontend Developer</option>
                <option value="backend_developer">Backend Developer</option>
                <option value="data_scientist">Data Scientist</option>
                <option value="product_manager">Product Manager</option>
                <option value="devops_engineer">DevOps Engineer</option>
                <option value="full_stack_developer">Full Stack Developer</option>
                <option value="ml_engineer">Machine Learning Engineer</option>
                <option value="custom">Custom Role...</option>
              </select>
            </div>

            {config.role === 'custom' && (
              <div className="mb-4">
                <label className="font-semibold text-gray-800 flex items-center gap-2 mb-2">Custom Role Name</label>
                <input
                  type="text"
                  value={config.customRole}
                  onChange={(e) => setConfig({ ...config, customRole: e.target.value })}
                  placeholder="e.g., QA Engineer, Security Analyst..."
                  disabled={isConnected}
                  className="w-full p-3 border-2 border-interview-purple/20 rounded-lg font-jura text-base font-medium focus:outline-none focus:border-interview-purple disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            )}

            <div className="mb-0">
              <label className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <i className="fa-solid fa-building"></i> Company Name <span className="font-normal text-gray-600 text-sm">(Optional)</span>
              </label>
              <input
                type="text"
                value={config.companyName}
                onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                placeholder="e.g., TechCorp, Acme Inc..."
                disabled={isConnected}
                className="w-full p-3 border-2 border-interview-purple/20 rounded-lg font-jura text-base font-medium focus:outline-none focus:border-interview-purple disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          
          {/* Interview Settings */}
          <div className="p-6 rounded-xl border-2 bg-gradient-to-br from-purple-400/10 to-purple-600/10 border-purple-400/20">
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-purple-600">
              <i className="fa-solid fa-gear"></i> Interview Settings
            </h3>
            <div className="mb-4">
              <label className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <i className="fa-solid fa-clipboard-question"></i> Interview Type
              </label>
              <select
                value={config.interviewType}
                onChange={(e) => setConfig({ ...config, interviewType: e.target.value })}
                disabled={isConnected}
                className="w-full p-3 border-2 border-interview-purple/20 rounded-lg font-jura text-base font-medium focus:outline-none focus:border-interview-purple disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="behavioral">Behavioral (STAR method)</option>
                <option value="technical">Technical (Coding & Design)</option>
                <option value="mixed">Mixed (Behavioral + Technical)</option>
                <option value="system_design">System Design</option>
              </select>
            </div>

            <div className="mb-0">
              <label className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <i className="fa-solid fa-signal"></i> Difficulty Level
              </label>
              <select
                value={config.difficulty}
                onChange={(e) => setConfig({ ...config, difficulty: e.target.value })}
                disabled={isConnected}
                className="w-full p-3 border-2 border-interview-purple/20 rounded-lg font-jura text-base font-medium focus:outline-none focus:border-interview-purple disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="entry">Entry Level (0-2 years)</option>
                <option value="mid">Mid Level (3-5 years)</option>
                <option value="senior">Senior Level (6-10 years)</option>
                <option value="lead">Lead/Principal (10+ years)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Resume Upload */}
          <div className="p-6 rounded-xl border-2 bg-gradient-to-br from-orange-400/10 to-yellow-400/10 border-orange-400/20">
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-orange-500">
              <i className="fa-solid fa-file-arrow-up"></i> Resume Upload
            </h3>
            <div className="mb-0">
              <label className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <i className="fa-solid fa-file-pdf"></i> Upload Resume <span className="font-normal text-gray-600 text-sm">(PDF or TXT)</span>
              </label>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleResumeUpload}
                disabled={isConnected}
                className="w-full p-3 border-2 border-dashed border-orange-400/40 rounded-lg bg-white/80"
              />
              <small className="block mt-3 text-gray-600 italic font-medium">{resumeFileName}</small>
              <div className="flex items-start gap-2 mt-3 p-3 bg-white/60 rounded-lg border-l-4 border-orange-500">
                <i className="fa-solid fa-lightbulb mt-1"></i>
                <small className="text-gray-600 leading-relaxed">Upload your resume to get personalized questions tailored to your experience</small>
              </div>
            </div>
          </div>
          
          {/* Interaction Mode */}
          <div className="p-6 rounded-xl border-2 bg-gradient-to-br from-emerald-400/10 to-green-500/10 border-emerald-400/30">
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-emerald-500">
              <i className="fa-solid fa-microphone-lines"></i> Interaction Mode
            </h3>
            <div className="mb-0">
              <label className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <i className="fa-solid fa-comments"></i> How to Respond
              </label>
              <select
                value={config.interactionMode}
                onChange={(e) => setConfig({ ...config, interactionMode: e.target.value })}
                disabled={isConnected}
                className="w-full p-3 border-2 border-interview-purple/20 rounded-lg font-jura text-base font-medium focus:outline-none focus:border-interview-purple disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="speech">Voice (Speak your answers)</option>
                <option value="text">Text (Type your answers)</option>
              </select>
              <div className="flex items-start gap-2 mt-3 p-3 bg-white/60 rounded-lg border-l-4 border-emerald-500">
                <i className="fa-solid fa-circle-info mt-1"></i>
                <small className="text-gray-600 leading-relaxed">Choose between speaking or typing your responses during the interview</small>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Interview Stats */}
      {stats.isActive && (
        <div className="mt-4 p-6 bg-gradient-to-br from-white/95 to-gray-100/95 backdrop-blur-lg rounded-2xl border-4 border-interview-purple/40 shadow-2xl shadow-interview-purple/20">
          <h3 className="text-sm font-semibold mb-5 text-center uppercase tracking-wider text-interview-purple">
            <i className="fa-solid fa-chart-line"></i> Interview Progress
          </h3>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="p-4 bg-white/80 rounded-xl border-2 border-blue-500/20">
              <div className="text-xs text-gray-600 font-semibold mb-2 uppercase tracking-wide">
                <i className="fa-solid fa-comment-dots"></i> Questions
              </div>
              <div className="text-3xl font-bold text-blue-500 drop-shadow">{stats.questionsCount}</div>
            </div>
            <div className="p-4 bg-white/80 rounded-xl border-2 border-blue-500/20">
              <div className="text-xs text-gray-600 font-semibold mb-2 uppercase tracking-wide">
                <i className="fa-solid fa-clock"></i> Duration
              </div>
              <div className="text-3xl font-bold text-blue-500 drop-shadow">{stats.duration}</div>
            </div>
            <div className="p-4 bg-white/80 rounded-xl border-2 border-blue-500/20">
              <div className="text-xs text-gray-600 font-semibold mb-2 uppercase tracking-wide">
                <i className="fa-solid fa-circle-check"></i> Status
              </div>
              <div className="text-2xl font-bold text-yellow-500 drop-shadow">{stats.status}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
