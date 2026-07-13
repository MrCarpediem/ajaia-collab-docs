import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Save, Share2, Upload, Bold, Italic, UnderlineIcon,
  Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Minus, AlignLeft, AlignCenter, AlignRight, Highlighter,
  Undo, Redo, Paperclip, X, FileText, Trash2, Download
} from 'lucide-react';
import SharePanel from '../components/SharePanel';
import UploadModal from '../components/UploadModal';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved');
  const [showShare, setShowShare] = useState(false);
  const [showAttachUpload, setShowAttachUpload] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const saveTimer = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    editorProps: {
      attributes: { class: 'tiptap' },
    },
    onUpdate: ({ editor }) => {
      setSaveStatus('unsaved');
      debouncedSave(editor.getJSON());
    },
  });

  const saveContent = useCallback(async (content) => {
    if (!id) return;
    setSaveStatus('saving');
    try {
      await api.put(`/documents/${id}`, { content: JSON.stringify(content) });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, [id]);

  const debouncedSave = useCallback((content) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveContent(content), 1000);
  }, [saveContent]);

  const saveTitle = useCallback(async (newTitle) => {
    try {
      await api.put(`/documents/${id}`, { title: newTitle });
    } catch {
      // silent fail for title
    }
  }, [id]);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const { data } = await api.get(`/documents/${id}`);
        setDoc(data);
        setTitle(data.title);
        setAttachments(data.attachments || []);
        if (data.content && editor) {
          try {
            const parsed = JSON.parse(data.content);
            editor.commands.setContent(parsed);
          } catch {
            editor.commands.setContent(data.content);
          }
        }
      } catch (err) {
        toast.error('Failed to load document');
        navigate('/');
      }
    };
    if (editor) fetchDoc();
  }, [id, editor, navigate]);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveTitle(val), 800);
  };

  const forceSave = async () => {
    if (!editor) return;
    setSaveStatus('saving');
    try {
      await api.put(`/documents/${id}`, {
        title,
        content: JSON.stringify(editor.getJSON()),
      });
      setSaveStatus('saved');
      toast.success('Saved');
    } catch {
      setSaveStatus('error');
      toast.error('Save failed');
    }
  };

  const deleteAttachment = async (attId) => {
    try {
      await api.delete(`/upload/attachment/${attId}`);
      setAttachments(prev => prev.filter(a => a.id !== attId));
      toast.success('Attachment removed');
    } catch {
      toast.error('Failed to remove attachment');
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isReadOnly = doc?.access_type === 'view';

  useEffect(() => {
    if (editor && isReadOnly) {
      editor.setEditable(false);
    }
  }, [editor, isReadOnly]);

  if (!doc) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div className="editor-page">
      {/* Top Bar */}
      <div className="editor-topbar">
        <button className="btn btn-icon btn-ghost" onClick={() => navigate('/')} title="Back">
          <ArrowLeft size={18} />
        </button>
        <input
          className="editor-title-input"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Document"
          readOnly={isReadOnly}
        />
        <div className={`editor-save-status ${saveStatus}`}>
          {saveStatus === 'saving' && '● Saving...'}
          {saveStatus === 'saved' && '✓ Saved'}
          {saveStatus === 'unsaved' && '○ Unsaved'}
          {saveStatus === 'error' && '✕ Error'}
        </div>
        {!isReadOnly && (
          <button className="btn btn-ghost btn-sm" onClick={forceSave} title="Save now">
            <Save size={16} /> Save
          </button>
        )}
        {doc.access_type === 'owner' && (
          <button className="btn btn-ghost btn-sm" onClick={() => setShowShare(true)}>
            <Share2 size={16} /> Share
          </button>
        )}
        {!isReadOnly && (
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAttachUpload(true)}>
            <Paperclip size={16} /> Attach
          </button>
        )}
        {isReadOnly && (
          <span className="doc-card-badge badge-view" style={{ fontSize: 12 }}>View Only</span>
        )}
      </div>

      {/* Toolbar */}
      {!isReadOnly && editor && (
        <div className="editor-toolbar">
          <button className="toolbar-btn" onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={18} /></button>
          <button className="toolbar-btn" onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={18} /></button>
          <div className="toolbar-divider" />
          <button className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold size={18} /></button>
          <button className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic size={18} /></button>
          <button className={`toolbar-btn ${editor.isActive('underline') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><UnderlineIcon size={18} /></button>
          <button className={`toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><Strikethrough size={18} /></button>
          <button className={`toolbar-btn ${editor.isActive('highlight') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight"><Highlighter size={18} /></button>
          <div className="toolbar-divider" />
          <button className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1"><Heading1 size={18} /></button>
          <button className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><Heading2 size={18} /></button>
          <button className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3"><Heading3 size={18} /></button>
          <div className="toolbar-divider" />
          <button className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List"><List size={18} /></button>
          <button className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List"><ListOrdered size={18} /></button>
          <button className={`toolbar-btn ${editor.isActive('blockquote') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote"><Quote size={18} /></button>
          <button className={`toolbar-btn ${editor.isActive('codeBlock') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code Block"><Code size={18} /></button>
          <button className="toolbar-btn" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus size={18} /></button>
          <div className="toolbar-divider" />
          <button className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align Left"><AlignLeft size={18} /></button>
          <button className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align Center"><AlignCenter size={18} /></button>
          <button className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align Right"><AlignRight size={18} /></button>
        </div>
      )}

      {/* Editor Body */}
      <div className="editor-body">
        <div className="editor-container">
          <EditorContent editor={editor} />

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="attachment-list" style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)' }}>
                <Paperclip size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                Attachments ({attachments.length})
              </h4>
              {attachments.map((att) => (
                <div key={att.id} className="attachment-item">
                  <FileText size={20} />
                  <span className="attachment-name">{att.original_name}</span>
                  <span className="attachment-size">{formatSize(att.size)}</span>
                  <a
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/upload/file/${att.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-icon btn-ghost btn-sm"
                    title="Download"
                  >
                    <Download size={14} />
                  </a>
                  {doc.access_type === 'owner' && (
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => deleteAttachment(att.id)} title="Remove">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share Panel */}
      <div className={`panel-overlay ${showShare ? 'open' : ''}`} onClick={() => setShowShare(false)} />
      <SharePanel
        docId={id}
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        shares={doc.shares || []}
        onSharesUpdated={(shares) => setDoc(prev => ({ ...prev, shares }))}
      />

      {/* Attachment Upload */}
      {showAttachUpload && (
        <UploadModal
          mode="attachment"
          docId={id}
          onClose={() => setShowAttachUpload(false)}
          onImported={(att) => {
            setShowAttachUpload(false);
            setAttachments(prev => [...prev, att]);
            toast.success('File attached');
          }}
        />
      )}
    </div>
  );
}
