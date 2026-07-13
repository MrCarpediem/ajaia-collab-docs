import { useState, useRef } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { Upload, X, FileText } from 'lucide-react';

export default function UploadModal({ mode = 'import', docId, onClose, onImported }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const inputRef = useRef();

  const acceptTypes = mode === 'import'
    ? '.txt,.md,.docx'
    : '.txt,.md,.docx,.png,.jpg,.jpeg,.gif,.pdf';

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const url = mode === 'import'
        ? '/upload/import'
        : `/upload/attachment/${docId}`;
      const { data } = await api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onImported(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>
            {mode === 'import' ? 'Import File as Document' : 'Attach File'}
          </h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        <div
          className={`upload-zone ${dragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptTypes}
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {file ? (
            <div>
              <FileText size={40} style={{ color: 'var(--primary)' }} />
              <p style={{ fontWeight: 500, color: 'var(--text)' }}>{file.name}</p>
              <p className="supported">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <Upload size={40} />
              <p>Drop a file here or click to browse</p>
              <p className="supported">
                {mode === 'import'
                  ? 'Supported: .txt, .md, .docx'
                  : 'Supported: .txt, .md, .docx, .png, .jpg, .gif, .pdf'}
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? 'Uploading...' : mode === 'import' ? 'Import as Document' : 'Attach File'}
          </button>
        </div>
      </div>
    </div>
  );
}
