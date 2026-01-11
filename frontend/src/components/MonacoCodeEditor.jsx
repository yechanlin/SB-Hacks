import React, { useRef, useEffect } from 'react';


export default function MonacoCodeEditor({ code, setCode, language }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  useEffect(() => {
    let editorInstance;
    let monacoInstance;
    let disposed = false;

    import('monaco-editor').then(monaco => {
      if (disposed) return;
      monacoInstance = monaco;
      monacoRef.current = monaco;
      editorInstance = monaco.editor.create(editorRef.current, {
        value: code,
        language: languageMap[language] || 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
      });
      editorInstance.onDidChangeModelContent(() => {
        setCode(editorInstance.getValue());
      });
    });

    return () => {
      disposed = true;
      if (editorInstance) {
        editorInstance.dispose();
      }
    };
  }, [language]);

  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      const model = monacoRef.current.editor.getModels()[0];
      if (model && model.getValue() !== code) {
        model.setValue(code);
      }
    }
  }, [code]);

  return (
    <div ref={editorRef} style={{ height: '100%', width: '100%', borderRadius: '0.5rem', overflow: 'hidden', border: '2px solid #334155' }} />
  );
}

const languageMap = {
  javascript: 'javascript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  csharp: 'csharp',
  go: 'go',
  rust: 'rust',
  typescript: 'typescript',
  ruby: 'ruby',
  php: 'php',
};
