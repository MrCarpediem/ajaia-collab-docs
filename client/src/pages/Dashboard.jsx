import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
  Plus, Upload, FileText, Clock, Users, LogOut, Search, Trash2
} from 'lucide-react';
import UploadModal from '../components/UploadModal';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState({ owned: [], shared: [] });
  const [tab, setTab] = useState('owned');
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState('');

  const fetchDocs = useCallback(async () => {
    try {
      const { data } = await api.get('/documents');
      setDocs(data);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const createDoc = async () => {
    try {
      const { data } = await api.post('/documents', { title: 'Untitled Document', content: '' });
      navigate(`/doc/${data.id}`);
    } catch {
      toast.error('Failed to create document');
    }
  };

  const deleteDoc = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Document deleted');
      fetchDocs();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const formatDate = (d) => {
    const date = new Date(d);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPreview = (content) => {
    if (!content) return 'Empty document';
    try {
      const parsed = JSON.parse(content);
      const texts = [];
      const extract = (node) => {
        if (node.text) texts.push(node.text);
        if (node.content) node.content.forEach(extract);
      };
      extract(parsed);
      return texts.join(' ').slice(0, 120) || 'Empty document';
    } catch {
      return 'Empty document';
    }
  };

  const currentDocs = tab === 'owned' ? docs.owned : docs.shared;
  const filtered = currentDocs.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo"><FileText size={18} /></div>
          <span className="sidebar-brand">CollabDocs</span>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={createDoc}>
              <Plus size={16} /> New Document
            </button>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Documents</div>
            <button className={`sidebar-item ${tab === 'owned' ? 'active' : ''}`} onClick={() => setTab('owned')}>
              <FileText size={18} />
              <span className="sidebar-item-text">My Documents ({docs.owned.length})</span>
            </button>
            <button className={`sidebar-item ${tab === 'shared' ? 'active' : ''}`} onClick={() => setTab('shared')}>
              <Users size={18} />
              <span className="sidebar-item-text">Shared with Me ({docs.shared.length})</span>
            </button>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Actions</div>
            <button className="sidebar-item" onClick={() => setShowUpload(true)}>
              <Upload size={18} />
              <span className="sidebar-item-text">Import File</span>
            </button>
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="avatar" style={{ background: user?.avatar_color || '#6366f1' }}>
            {user?.name?.[0] || '?'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 500 }}>{user?.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={() => { logout(); navigate('/login'); }} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="dashboard">
          <div className="dashboard-header">
            <h1 className="dashboard-title">
              {tab === 'owned' ? 'My Documents' : 'Shared with Me'}
            </h1>
            <div className="dashboard-actions">
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  className="input"
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: 36, width: 220 }}
                />
              </div>
              <button className="btn btn-primary" onClick={createDoc}>
                <Plus size={16} /> New
              </button>
            </div>
          </div>

          {loading ? (
            <div className="empty-state"><p>Loading...</p></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <FileText size={64} />
              <h3>{search ? 'No matches found' : 'No documents yet'}</h3>
              <p>{search ? 'Try a different search term' : 'Create your first document or import a file to get started.'}</p>
            </div>
          ) : (
            <div className="doc-grid">
              {filtered.map((doc) => (
                <div key={doc.id} className="doc-card" onClick={() => navigate(`/doc/${doc.id}`)}>
                  <div className="doc-card-title">
                    <FileText size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.title}
                    </span>
                    <span className={`doc-card-badge ${doc.access_type === 'owner' ? 'badge-owner' : doc.access_type === 'edit' ? 'badge-edit' : 'badge-view'}`}>
                      {doc.access_type === 'owner' ? 'Owner' : doc.access_type === 'edit' ? 'Can Edit' : 'View Only'}
                    </span>
                  </div>
                  <div className="doc-card-meta">
                    <Clock size={12} />
                    {formatDate(doc.updated_at)}
                    {doc.access_type !== 'owner' && (
                      <>
                        <span style={{ margin: '0 4px' }}>·</span>
                        by {doc.owner_name}
                      </>
                    )}
                  </div>
                  <div className="doc-card-preview">{getPreview(doc.content)}</div>
                  {doc.access_type === 'owner' && (
                    <button
                      className="btn btn-icon btn-ghost btn-sm"
                      style={{ position: 'absolute', top: 12, right: 12 }}
                      onClick={(e) => deleteDoc(e, doc.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onImported={(doc) => {
            setShowUpload(false);
            navigate(`/doc/${doc.id}`);
          }}
        />
      )}
    </div>
  );
}
