import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { X, UserPlus, Trash2 } from 'lucide-react';

export default function SharePanel({ docId, isOpen, onClose, shares, onSharesUpdated }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [permission, setPermission] = useState('view');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get('/auth/users').then(({ data }) => setUsers(data.users)).catch(() => {});
    }
  }, [isOpen]);

  const shareDoc = async () => {
    if (!selectedUser) return toast.error('Select a user');
    setLoading(true);
    try {
      const { data } = await api.post(`/documents/${docId}/share`, {
        user_id: selectedUser,
        permission,
      });
      onSharesUpdated(data.shares);
      setSelectedUser('');
      toast.success('Document shared!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to share');
    } finally {
      setLoading(false);
    }
  };

  const removeShare = async (shareId) => {
    try {
      await api.delete(`/documents/${docId}/share/${shareId}`);
      onSharesUpdated(shares.filter(s => s.id !== shareId));
      toast.success('Access removed');
    } catch {
      toast.error('Failed to remove access');
    }
  };

  // Filter out already-shared users
  const sharedIds = new Set(shares.map(s => s.shared_with_id));
  const availableUsers = users.filter(u => !sharedIds.has(u.id));

  return (
    <div className={`right-panel ${isOpen ? 'open' : ''}`}>
      <div className="panel-header">
        <h3>Share Document</h3>
        <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="panel-body">
        {/* Add new share */}
        <div style={{ marginBottom: 24 }}>
          <label className="form-label">Add people</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <select className="input" style={{ flex: 1 }} value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
              <option value="">Select a user...</option>
              {availableUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
            <select className="share-select" value={permission} onChange={(e) => setPermission(e.target.value)}>
              <option value="view">View</option>
              <option value="edit">Edit</option>
            </select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={shareDoc} disabled={loading || !selectedUser}>
            <UserPlus size={14} /> {loading ? 'Sharing...' : 'Share'}
          </button>
        </div>

        {/* Current shares */}
        <div>
          <label className="form-label">People with access</label>
          {shares.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              Only you have access to this document.
            </p>
          ) : (
            shares.map(share => (
              <div key={share.id} className="share-user-row">
                <div className="avatar avatar-sm" style={{ background: share.user_color || '#6366f1' }}>
                  {share.user_name?.[0] || '?'}
                </div>
                <div className="share-user-info">
                  <div className="share-user-name">{share.user_name}</div>
                  <div className="share-user-email">{share.user_email}</div>
                </div>
                <span className={`doc-card-badge ${share.permission === 'edit' ? 'badge-edit' : 'badge-view'}`}>
                  {share.permission === 'edit' ? 'Can Edit' : 'View Only'}
                </span>
                <button className="btn btn-icon btn-ghost btn-sm" onClick={() => removeShare(share.id)} title="Remove">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
