import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import mammoth from 'mammoth';
import db from '../db.js';
import { authenticate } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.txt', '.md', '.docx', '.png', '.jpg', '.jpeg', '.gif', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Allowed: ${allowed.join(', ')}`));
    }
  },
});

const router = Router();
router.use(authenticate);

// Convert file content to TipTap-compatible JSON
function textToTipTap(text, title) {
  const lines = text.split('\n');
  const content = [];

  // Add title heading
  if (title) {
    content.push({
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: title }],
    });
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      content.push({ type: 'paragraph' });
    } else if (trimmed.startsWith('# ')) {
      content.push({
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: trimmed.slice(2) }],
      });
    } else if (trimmed.startsWith('## ')) {
      content.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: trimmed.slice(3) }],
      });
    } else if (trimmed.startsWith('### ')) {
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: trimmed.slice(4) }],
      });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      content.push({
        type: 'bulletList',
        content: [{
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: trimmed.slice(2) }],
          }],
        }],
      });
    } else if (/^\d+\.\s/.test(trimmed)) {
      content.push({
        type: 'orderedList',
        content: [{
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: trimmed.replace(/^\d+\.\s/, '') }],
          }],
        }],
      });
    } else {
      // Handle inline markdown: **bold** and *italic*
      const inlineContent = parseInlineMarkdown(trimmed);
      content.push({
        type: 'paragraph',
        content: inlineContent,
      });
    }
  }

  return JSON.stringify({ type: 'doc', content });
}

function parseInlineMarkdown(text) {
  const result = [];
  // Simple regex-based parsing for bold and italic
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|_(.+?)_|`(.+?)`|([^*_`]+))/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      // **bold**
      result.push({ type: 'text', text: match[2], marks: [{ type: 'bold' }] });
    } else if (match[3]) {
      // *italic*
      result.push({ type: 'text', text: match[3], marks: [{ type: 'italic' }] });
    } else if (match[4]) {
      // __bold__
      result.push({ type: 'text', text: match[4], marks: [{ type: 'bold' }] });
    } else if (match[5]) {
      // _italic_
      result.push({ type: 'text', text: match[5], marks: [{ type: 'italic' }] });
    } else if (match[6]) {
      // `code`
      result.push({ type: 'text', text: match[6], marks: [{ type: 'code' }] });
    } else if (match[7]) {
      result.push({ type: 'text', text: match[7] });
    }
  }

  return result.length > 0 ? result : [{ type: 'text', text }];
}

// POST /api/upload/import - import file as new document
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const baseName = path.basename(req.file.originalname, ext);
    let content;

    if (ext === '.txt' || ext === '.md') {
      const text = fs.readFileSync(req.file.path, 'utf-8');
      content = textToTipTap(text, baseName);
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: req.file.path });
      content = textToTipTap(result.value, baseName);
    } else {
      return res.status(400).json({ error: 'Unsupported file type for import' });
    }

    // Create document
    const id = uuidv4();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO documents (id, title, content, owner_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, baseName, content, req.user.id, now, now);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    res.status(201).json(doc);
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Failed to import file' });
  }
});

// POST /api/upload/attachment/:docId - attach file to document
router.post('/attachment/:docId', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Check access
    const isOwner = doc.owner_id === req.user.id;
    const share = db.prepare(
      'SELECT * FROM shares WHERE document_id = ? AND shared_with_id = ? AND permission = ?'
    ).get(req.params.docId, req.user.id, 'edit');
    if (!isOwner && !share) {
      return res.status(403).json({ error: 'No edit access' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO attachments (id, document_id, filename, original_name, mime_type, size)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.params.docId, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size);

    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id);
    res.status(201).json(attachment);
  } catch (err) {
    console.error('Attachment error:', err);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

// GET /api/upload/file/:filename - serve uploaded file
router.get('/file/:filename', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.sendFile(filePath);
});

// DELETE /api/upload/attachment/:id - delete attachment
router.delete('/attachment/:id', (req, res) => {
  try {
    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id);
    if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(attachment.document_id);
    if (doc.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the owner can delete attachments' });
    }

    // Delete file
    const filePath = path.join(UPLOAD_DIR, attachment.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    db.prepare('DELETE FROM attachments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete attachment error:', err);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

export default router;
