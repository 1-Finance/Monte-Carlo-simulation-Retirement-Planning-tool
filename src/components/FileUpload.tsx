import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Eye, Download } from 'lucide-react';

interface FileUploadProps {
  label: string;
  description: string;
  accept?: string;
  onFileLoaded: (buffer: ArrayBuffer, fileName: string) => void;
  isLoaded: boolean;
  loadedFileName?: string;
  onView?: () => void;
  onDownload?: () => void;
  replaceable?: boolean;
  error?: string | null;
}

export function FileUpload({
  label,
  description,
  accept = '.xlsx,.xls',
  onFileLoaded,
  isLoaded,
  loadedFileName,
  onView,
  onDownload,
  replaceable,
  error,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        if (buffer) {
          onFileLoaded(buffer, file.name);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [onFileLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="animate-fade-in">
      <label className="input-label" style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
        {label}
      </label>
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
        {description}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      {isLoaded ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <CheckCircle2 size={20} color="var(--color-accent-emerald)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-accent-emerald)' }}>
              File loaded successfully
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {loadedFileName}
            </p>
          </div>
          {onView && (
            <button className="btn-icon" onClick={onView} title="View data">
              <Eye size={16} />
            </button>
          )}
          {onDownload && (
            <button className="btn-icon" onClick={onDownload} title="Download file">
              <Download size={16} />
            </button>
          )}
          {replaceable && (
            <button className="btn-icon" onClick={() => inputRef.current?.click()} title="Upload new file (replaces current)">
              <Upload size={16} />
            </button>
          )}
        </div>
      ) : (
        <div
          className={`file-dropzone ${isDragOver ? 'dragover' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(79,143,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isDragOver ? (
                <FileSpreadsheet size={24} color="var(--color-accent-blue)" />
              ) : (
                <Upload size={24} color="var(--color-accent-blue)" />
              )}
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {isDragOver ? 'Drop file here' : 'Click to browse or drag & drop'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Supports .xlsx and .xls files
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: 'rgba(244,63,94,0.08)',
            border: '1px solid rgba(244,63,94,0.2)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <AlertCircle size={16} color="var(--color-accent-rose)" />
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-accent-rose)' }}>{error}</p>
        </div>
      )}
    </div>
  );
}
