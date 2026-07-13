import { describe, it, expect, beforeAll } from 'vitest';
import db from './db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

describe('Document API Logic', () => {
  let testUserId;

  beforeAll(() => {
    // Create a test user
    testUserId = uuidv4();
    const hash = bcrypt.hashSync('testpass', 10);
    db.prepare(
      'INSERT OR IGNORE INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)'
    ).run(testUserId, `test-${testUserId}@test.com`, 'Test User', hash);
  });

  it('should create a document', () => {
    const docId = uuidv4();
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO documents (id, title, content, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(docId, 'Test Doc', '{"type":"doc","content":[]}', testUserId, now, now);

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
    expect(doc).toBeDefined();
    expect(doc.title).toBe('Test Doc');
    expect(doc.owner_id).toBe(testUserId);
  });

  it('should update a document title', () => {
    const docId = uuidv4();
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO documents (id, title, content, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(docId, 'Original Title', '', testUserId, now, now);

    db.prepare('UPDATE documents SET title = ? WHERE id = ?').run('Updated Title', docId);
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
    expect(doc.title).toBe('Updated Title');
  });

  it('should create and query shares', () => {
    const docId = uuidv4();
    const shareUserId = uuidv4();
    const now = new Date().toISOString();

    // Create share user
    const hash = bcrypt.hashSync('pass', 10);
    db.prepare(
      'INSERT OR IGNORE INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)'
    ).run(shareUserId, `share-${shareUserId}@test.com`, 'Share User', hash);

    // Create document
    db.prepare(
      'INSERT INTO documents (id, title, content, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(docId, 'Shared Doc', '', testUserId, now, now);

    // Create share
    const shareId = uuidv4();
    db.prepare(
      'INSERT INTO shares (id, document_id, shared_with_id, permission) VALUES (?, ?, ?, ?)'
    ).run(shareId, docId, shareUserId, 'edit');

    const shares = db.prepare('SELECT * FROM shares WHERE document_id = ?').all(docId);
    expect(shares).toHaveLength(1);
    expect(shares[0].shared_with_id).toBe(shareUserId);
    expect(shares[0].permission).toBe('edit');
  });

  it('should cascade delete shares when document is deleted', () => {
    const docId = uuidv4();
    const shareUserId = uuidv4();
    const now = new Date().toISOString();

    const hash = bcrypt.hashSync('pass', 10);
    db.prepare(
      'INSERT OR IGNORE INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)'
    ).run(shareUserId, `cascade-${shareUserId}@test.com`, 'Cascade User', hash);

    db.prepare(
      'INSERT INTO documents (id, title, content, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(docId, 'To Delete', '', testUserId, now, now);

    db.prepare(
      'INSERT INTO shares (id, document_id, shared_with_id, permission) VALUES (?, ?, ?, ?)'
    ).run(uuidv4(), docId, shareUserId, 'view');

    // Delete document
    db.prepare('DELETE FROM documents WHERE id = ?').run(docId);

    // Shares should be cascade deleted
    const shares = db.prepare('SELECT * FROM shares WHERE document_id = ?').all(docId);
    expect(shares).toHaveLength(0);
  });

  it('should store and parse document content as JSON', () => {
    const docId = uuidv4();
    const now = new Date().toISOString();
    const content = JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Hello' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'World' }] },
      ],
    });

    db.prepare(
      'INSERT INTO documents (id, title, content, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(docId, 'JSON Test', content, testUserId, now, now);

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
    const parsed = JSON.parse(doc.content);
    expect(parsed.type).toBe('doc');
    expect(parsed.content).toHaveLength(2);
    expect(parsed.content[0].type).toBe('heading');
  });
});
