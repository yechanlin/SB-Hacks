import React, { useEffect, useRef } from 'react';

const LANGUAGE_MAP = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  csharp: 'csharp',
  go: 'go',
  rust: 'rust',
  ruby: 'ruby',
  php: 'php'
};

let themeDefined = false;

export default function MonacoCodeEditor({ code, setCode, language }) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  useEffect(() => {
    let disposed = false;

    import('monaco-editor').then((monaco) => {
      if (disposed || !containerRef.current) return;
      monacoRef.current = monaco;

      if (!themeDefined) {
        monaco.editor.defineTheme('rehearse', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: {
            'editor.background': '#171a21',
            'editor.lineHighlightBackground': '#1d212a',
            'editorLineNumber.foreground': '#5d6474',
            'editorLineNumber.activeForeground': '#8b91a0',
            'editorGutter.background': '#171a21',
            'editor.selectionBackground': '#3a2f16',
            'editorCursor.foreground': '#d9a441'
          }
        });
        themeDefined = true;
      }

      const editor = monaco.editor.create(containerRef.current, {
        value: code,
        language: LANGUAGE_MAP[language] || 'javascript',
        theme: 'rehearse',
        automaticLayout: true,
        fontSize: 13,
        fontFamily: '"JetBrains Mono", ui-monospace, Menlo, monospace',
        lineHeight: 20,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: 'line',
        overviewRulerBorder: false,
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 }
      });
      editorRef.current = editor;
      editor.onDidChangeModelContent(() => setCode(editor.getValue()));
    });

    return () => {
      disposed = true;
      editorRef.current?.dispose();
      editorRef.current = null;
    };
    // The editor is recreated when the language changes; code is preserved through props.
  }, [language]);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.getValue() !== code) {
      editor.setValue(code);
    }
  }, [code]);

  return <div ref={containerRef} className="h-full w-full" />;
}
