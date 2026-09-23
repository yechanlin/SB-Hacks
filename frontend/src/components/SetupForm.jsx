import React, { useRef, useState } from 'react';

const ROLES = [
  ['software_engineer', 'Software Engineer'],
  ['frontend_developer', 'Frontend Developer'],
  ['backend_developer', 'Backend Developer'],
  ['full_stack_developer', 'Full Stack Developer'],
  ['data_scientist', 'Data Scientist'],
  ['ml_engineer', 'Machine Learning Engineer'],
  ['devops_engineer', 'DevOps Engineer'],
  ['product_manager', 'Product Manager'],
  ['custom', 'Custom role…']
];

const LEVELS = [
  ['entry', 'Entry, 0 to 2 years'],
  ['mid', 'Mid, 3 to 5 years'],
  ['senior', 'Senior, 6 to 10 years'],
  ['lead', 'Lead or Principal, 10+ years']
];

const TYPES = [
  ['behavioral', 'Behavioral'],
  ['technical', 'Technical'],
  ['mixed', 'Mixed'],
  ['system_design', 'System design']
];

const MODES = [
  ['speech', 'Voice'],
  ['text', 'Text']
];

async function extractText(file) {
  if (file.type === 'application/pdf') {
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF parsing is unavailable. Upload a .txt file instead.');
    }
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(' ') + '\n';
    }
    return text;
  }
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return file.text();
  }
  throw new Error('Upload a PDF or a .txt file.');
}

function Field({ label, hint, htmlFor, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] text-ink-muted">
        {label}
        {hint && <span className="text-ink-faint"> · {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Segmented({ id, value, options, onChange }) {
  return (
    <div className="segmented" role="group" id={id}>
      {options.map(([val, label]) => (
        <button
          key={val}
          type="button"
          aria-pressed={value === val}
          onClick={() => onChange(val)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function SetupForm({ config, setConfig, onStart }) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [parsing, setParsing] = useState(false);

  const update = (patch) => setConfig((prev) => ({ ...prev, ...patch }));

  const handleFile = async (file) => {
    if (!file) return;
    setResumeError('');
    setParsing(true);
    try {
      const content = await extractText(file);
      update({ resumeContent: content, resumeFileName: file.name });
    } catch (err) {
      update({ resumeContent: '', resumeFileName: '' });
      setResumeError(err.message);
    } finally {
      setParsing(false);
    }
  };

  const clearResume = () => {
    update({ resumeContent: '', resumeFileName: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const canStart = config.role !== 'custom' || config.customRole.trim().length > 0;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (canStart) onStart();
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Role" htmlFor="role">
          <select
            id="role"
            className="field"
            value={config.role}
            onChange={(e) => update({ role: e.target.value })}
          >
            {ROLES.map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </Field>

        <Field label="Level" htmlFor="level">
          <select
            id="level"
            className="field"
            value={config.difficulty}
            onChange={(e) => update({ difficulty: e.target.value })}
          >
            {LEVELS.map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </Field>
      </div>

      {config.role === 'custom' && (
        <Field label="Role title" htmlFor="customRole">
          <input
            id="customRole"
            className="field"
            type="text"
            placeholder="QA Engineer, Security Analyst, Solutions Architect"
            value={config.customRole}
            onChange={(e) => update({ customRole: e.target.value })}
            autoFocus
          />
        </Field>
      )}

      <Field label="Company" hint="optional" htmlFor="company">
        <input
          id="company"
          className="field"
          type="text"
          placeholder="Where are you interviewing?"
          value={config.companyName}
          onChange={(e) => update({ companyName: e.target.value })}
        />
      </Field>

      <Field label="Interview type" htmlFor="type">
        <Segmented
          id="type"
          value={config.interviewType}
          options={TYPES}
          onChange={(v) => update({ interviewType: v })}
        />
      </Field>

      <Field label="How you'll answer" htmlFor="mode">
        <Segmented
          id="mode"
          value={config.interactionMode}
          options={MODES}
          onChange={(v) => update({ interactionMode: v })}
        />
      </Field>

      <Field label="Resume" hint="PDF or TXT, optional" htmlFor="resume">
        <input
          ref={fileInputRef}
          id="resume"
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {config.resumeFileName ? (
          <div className="flex items-center justify-between gap-3 border border-line rounded-[4px] bg-panel px-3 py-2.5">
            <span className="truncate font-mono text-[13px]">{config.resumeFileName}</span>
            <button type="button" className="btn btn-quiet text-[13px]" onClick={clearResume}>Remove</button>
          </div>
        ) : (
          <label
            htmlFor="resume"
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={`flex items-center justify-center gap-2 border border-dashed rounded-[4px] px-3 py-5 cursor-pointer text-[13px] transition-colors ${
              dragging ? 'border-accent text-ink bg-accent-soft' : 'border-line-strong text-ink-muted hover:text-ink hover:border-ink-faint'
            }`}
          >
            {parsing ? 'Reading resume…' : 'Drop a file here or click to choose'}
          </label>
        )}
        {resumeError && <p className="m-0 text-[13px] text-warn">{resumeError}</p>}
      </Field>

      <div className="flex flex-col gap-3 pt-2">
        <button type="submit" className="btn btn-primary w-full text-[15px] py-3" disabled={!canStart}>
          Start interview
        </button>
        <p className="m-0 text-center text-[12px] text-ink-faint font-mono">
          {config.interactionMode === 'speech' ? 'microphone access will be requested' : 'you will type your answers'} · about 20 minutes
        </p>
      </div>
    </form>
  );
}
