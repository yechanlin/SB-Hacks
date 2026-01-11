import React, { useState } from 'react';
import MonacoCodeEditor from './MonacoCodeEditor';

export default function CodeEditor({ interviewType, isConnected }) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');

  // Only show for technical or mixed interviews
  if (interviewType !== 'technical' && interviewType !== 'mixed') {
    return null;
  }

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

  // Language-specific placeholder text
  const placeholders = {
    javascript: `// Write your JavaScript code here...\nfunction solution() {\n    // Your code\n}`,
    python: `# Write your Python code here...\ndef solution():\n    # Your code\n    pass`,
    java: `// Write your Java code here...\npublic class Solution {\n    public static void main(String[] args) {\n        // Your code\n    }\n}`,
    cpp: `// Write your C++ code here...\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code\n    return 0;\n}`,
    csharp: `// Write your C# code here...\nusing System;\n\nclass Solution {\n    static void Main(string[] args) {\n        // Your code\n    }\n}`,
    go: `// Write your Go code here...\npackage main\nimport "fmt"\n\nfunc main() {\n    // Your code\n}`,
    rust: `// Write your Rust code here...\nfn main() {\n    // Your code\n}`,
    typescript: `// Write your TypeScript code here...\nfunction solution(): void {\n    // Your code\n}`,
    ruby: `# Write your Ruby code here...\ndef solution\n  # Your code\nend`,
    php: `<?php\n// Write your PHP code here...\nfunction solution() {\n    // Your code\n}\n?>`,
  };

  return (
    <div className="bg-white/95 backdrop-blur-lg border-2 border-slate-300 rounded-2xl p-6 mb-6 shadow-xl shadow-slate-300/50">
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
      <div className="relative">
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
            onClick={() => setCode('')}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!code.trim()}
          >
            <i className="fa-solid fa-trash"></i> Clear
          </button>
          <button
            onClick={() => {
              // Copy to clipboard functionality
              navigator.clipboard.writeText(code);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!code.trim()}
          >
            <i className="fa-solid fa-copy"></i> Copy
          </button>
        </div>
        
        <button
          className="px-6 py-2 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!code.trim() || !isConnected}
          title={!isConnected ? 'Start interview first' : 'Submit code (functionality coming soon)'}
        >
          <i className="fa-solid fa-paper-plane"></i> Submit Code
        </button>
      </div>

      {/* Info message */}
      <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
        <p className="text-sm text-gray-700">
          <i className="fa-solid fa-info-circle text-blue-500"></i> 
          <strong className="ml-2">Note:</strong> Write your solution here. Code submission and execution features will be available soon.
        </p>
      </div>
    </div>
  );
}
