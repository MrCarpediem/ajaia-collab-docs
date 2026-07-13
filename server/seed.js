import db from './db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const AVATAR_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

const users = [
  { email: 'alice@ajaia.com', name: 'Alice Johnson', password: 'password123' },
  { email: 'bob@ajaia.com', name: 'Bob Smith', password: 'password123' },
  { email: 'carol@ajaia.com', name: 'Carol Davis', password: 'password123' },
  { email: 'prem@ajaia.com', name: 'Prem Prakash', password: 'password123' },
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, email, name, password_hash, avatar_color)
  VALUES (?, ?, ?, ?, ?)
`);

const insertDoc = db.prepare(`
  INSERT OR IGNORE INTO documents (id, title, content, owner_id, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertShare = db.prepare(`
  INSERT OR IGNORE INTO shares (id, document_id, shared_with_id, permission)
  VALUES (?, ?, ?, ?)
`);

const seedTransaction = db.transaction(() => {
  const userIds = [];

  users.forEach((user, i) => {
    const id = uuidv4();
    const hash = bcrypt.hashSync(user.password, 10);
    insertUser.run(id, user.email, user.name, hash, AVATAR_COLORS[i % AVATAR_COLORS.length]);
    userIds.push(id);
    console.log(`  ✓ Created user: ${user.email} (password: ${user.password})`);
  });

  // Create sample documents
  const doc1Id = uuidv4();
  const doc2Id = uuidv4();
  const doc3Id = uuidv4();

  insertDoc.run(
    doc1Id,
    'Project Kickoff Notes',
    JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Project Kickoff Notes' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Welcome to the Ajaia Collaborative Docs project! This document outlines our initial goals and milestones.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Goals' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Build a lightweight collaborative editor' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Support rich text formatting' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Enable document sharing between users' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Timeline' }] },
        { type: 'paragraph', content: [
          { type: 'text', text: 'Phase 1: ', marks: [{ type: 'bold' }] },
          { type: 'text', text: 'Core editor and document management' },
        ]},
        { type: 'paragraph', content: [
          { type: 'text', text: 'Phase 2: ', marks: [{ type: 'bold' }] },
          { type: 'text', text: 'File upload and sharing features' },
        ]},
      ],
    }),
    userIds[0],
    new Date().toISOString(),
    new Date().toISOString()
  );

  insertDoc.run(
    doc2Id,
    'API Design Spec',
    JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'API Design Specification' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'This document covers the REST API design for the collaborative docs platform.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Endpoints' }] },
        { type: 'orderedList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: 'POST /api/auth/login' }, { type: 'text', text: ' — Authenticate user' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: 'GET /api/documents' }, { type: 'text', text: ' — List user documents' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: 'POST /api/documents' }, { type: 'text', text: ' — Create new document' }] }] },
        ]},
      ],
    }),
    userIds[1],
    new Date().toISOString(),
    new Date().toISOString()
  );

  insertDoc.run(
    doc3Id,
    'Meeting Agenda - Sprint Review',
    JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Sprint Review Agenda' }] },
        { type: 'paragraph', content: [
          { type: 'text', text: 'Date: ', marks: [{ type: 'bold' }] },
          { type: 'text', text: 'July 14, 2026' },
        ]},
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Demo new features' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Review team velocity' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Plan next sprint priorities' }] }] },
        ]},
      ],
    }),
    userIds[3],
    new Date().toISOString(),
    new Date().toISOString()
  );

  // Share doc1 (Alice's) with Bob and Prem
  insertShare.run(uuidv4(), doc1Id, userIds[1], 'edit');
  insertShare.run(uuidv4(), doc1Id, userIds[3], 'view');

  // Share doc2 (Bob's) with Alice
  insertShare.run(uuidv4(), doc2Id, userIds[0], 'edit');

  console.log(`  ✓ Created 3 sample documents with sharing`);
});

console.log('🌱 Seeding database...');
seedTransaction();
console.log('✅ Database seeded successfully!');
console.log('\n📋 Test Accounts:');
users.forEach(u => console.log(`   ${u.email} / ${u.password}`));
