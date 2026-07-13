import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/documents - list user's owned + shared documents
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;

    const owned = db.prepare(`
      SELECT d.*, u.name as owner_name, u.email as owner_email, u.avatar_color as owner_color,
             'owner' as access_type
      FROM documents d
      JOIN users u ON d.owner_id = u.id
      WHERE d.owner_id = ?
      ORDER BY d.updated_at DESC
    `).all(userId);

    const shared = db.prepare(`
      SELECT d.*, u.name as owner_name, u.email as owner_email, u.avatar_color as owner_color,
             s.permission as access_type
      FROM documents d
      JOIN shares s ON s.document_id = d.id
      JOIN users u ON d.owner_id = u.id
      WHERE s.shared_with_id = ?
      ORDER BY d.updated_at DESC
    `).all(userId);

    res.json({ owned, shared });
  } catch (err) {
    console.error('List docs error:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// POST /api/documents - create new document
router.post('/', (req, res) => {
  try {
    const id = uuidv4();
    const { title = 'Untitled Document', content = '' } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO documents (id, title, content, owner_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, title, content, req.user.id, now, now);

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    res.status(201).json(doc);
  } catch (err) {
    console.error('Create doc error:', err);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// GET /api/documents/:id - get single document
router.get('/:id', (req, res) => {
  try {
    const doc = db.prepare(`
      SELECT d.*, u.name as owner_name, u.email as owner_email, u.avatar_color as owner_color
      FROM documents d
      JOIN users u ON d.owner_id = u.id
      WHERE d.id = ?
    `).get(req.params.id);

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Check access
    const userId = req.user.id;
    const isOwner = doc.owner_id === userId;
    const share = db.prepare(
      'SELECT * FROM shares WHERE document_id = ? AND shared_with_id = ?'
    ).get(req.params.id, userId);

    if (!isOwner && !share) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get shares for this document
    const shares = db.prepare(`
      SELECT s.*, u.name as user_name, u.email as user_email, u.avatar_color as user_color
      FROM shares s
      JOIN users u ON s.shared_with_id = u.id
      WHERE s.document_id = ?
    `).all(req.params.id);

    // Get attachments
    const attachments = db.prepare(
      'SELECT * FROM attachments WHERE document_id = ? ORDER BY created_at DESC'
    ).all(req.params.id);

    res.json({
      ...doc,
      access_type: isOwner ? 'owner' : share.permission,
      shares,
      attachments,
    });
  } catch (err) {
    console.error('Get doc error:', err);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// PUT /api/documents/:id - update document
router.put('/:id', (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Check access
    const userId = req.user.id;
    const isOwner = doc.owner_id === userId;
    const share = db.prepare(
      'SELECT * FROM shares WHERE document_id = ? AND shared_with_id = ? AND permission = ?'
    ).get(req.params.id, userId, 'edit');

    if (!isOwner && !share) {
      return res.status(403).json({ error: 'No edit access' });
    }

    const { title, content } = req.body;
    const now = new Date().toISOString();

    if (title !== undefined) {
      db.prepare('UPDATE documents SET title = ?, updated_at = ? WHERE id = ?').run(title, now, req.params.id);
    }
    if (content !== undefined) {
      db.prepare('UPDATE documents SET content = ?, updated_at = ? WHERE id = ?').run(content, now, req.params.id);
    }

    const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Update doc error:', err);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// DELETE /api/documents/:id - delete document (owner only)
router.delete('/:id', (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the owner can delete this document' });
    }

    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete doc error:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// POST /api/documents/:id/share - share document
router.post('/:id/share', (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the owner can share this document' });
    }

    const { user_id, permission = 'view' } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });
    if (user_id === req.user.id) return res.status(400).json({ error: 'Cannot share with yourself' });

    const targetUser = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Upsert share
    const existing = db.prepare(
      'SELECT * FROM shares WHERE document_id = ? AND shared_with_id = ?'
    ).get(req.params.id, user_id);

    if (existing) {
      db.prepare('UPDATE shares SET permission = ? WHERE id = ?').run(permission, existing.id);
    } else {
      db.prepare(
        'INSERT INTO shares (id, document_id, shared_with_id, permission) VALUES (?, ?, ?, ?)'
      ).run(uuidv4(), req.params.id, user_id, permission);
    }

    // Return updated shares
    const shares = db.prepare(`
      SELECT s.*, u.name as user_name, u.email as user_email, u.avatar_color as user_color
      FROM shares s
      JOIN users u ON s.shared_with_id = u.id
      WHERE s.document_id = ?
    `).all(req.params.id);

    res.json({ shares });
  } catch (err) {
    console.error('Share doc error:', err);
    res.status(500).json({ error: 'Failed to share document' });
  }
});

// DELETE /api/documents/:id/share/:shareId - remove share
router.delete('/:id/share/:shareId', (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the owner can manage sharing' });
    }

    db.prepare('DELETE FROM shares WHERE id = ? AND document_id = ?').run(req.params.shareId, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Remove share error:', err);
    res.status(500).json({ error: 'Failed to remove share' });
  }
});

export default router;
