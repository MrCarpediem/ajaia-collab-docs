# Ajaia CollabDocs

A lightweight collaborative document editor built for the Ajaia LLC AI-Native Full Stack Developer Assignment.

![CollabDocs Editor](https://img.shields.io/badge/status-complete-brightgreen)

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Setup & Run

```bash
# 1. Clone the repo
git clone <repo-url>
cd ajaia-collab-docs

# 2. Install & seed the backend
cd server
npm install
npm run seed

# 3. Start the backend (port 3001)
npm run dev

# 4. In a new terminal, install & start the frontend
cd ../client
npm install
npm run dev
```

The app will be running at **http://localhost:5173**

### Test Accounts

| Email | Password | Notes |
|-------|----------|-------|
| alice@ajaia.com | password123 | Owns "Project Kickoff Notes" |
| bob@ajaia.com | password123 | Owns "API Design Spec" |
| carol@ajaia.com | password123 | No docs, for sharing tests |
| prem@ajaia.com | password123 | Owns "Meeting Agenda", has shared access |

### Running Tests

```bash
cd server
npm test
```

## Features

### ✅ Document Creation & Editing
- Create, rename, and delete documents
- Rich text editing powered by TipTap (ProseMirror)
- Bold, italic, underline, strikethrough, highlight
- Headings (H1, H2, H3), bullet/numbered lists
- Blockquotes, code blocks, horizontal rules
- Text alignment (left, center, right)
- Auto-save with debounce (1s)

### ✅ File Upload
- **Import mode**: Upload `.txt`, `.md`, or `.docx` files → creates editable documents
- **Attachment mode**: Attach any supported file to a document
- Drag-and-drop + click-to-browse upload UI
- Markdown parsing preserves headings, bold, italic, lists
- DOCX content extraction via Mammoth.js

### ✅ Sharing
- Document owner can share with other users
- Two permission levels: **View** (read-only) and **Edit** (full access)
- Clear visual badges: "Owner", "Can Edit", "View Only"
- Separate "My Documents" and "Shared with Me" tabs
- Owner can add/remove shares via slide-out panel

### ✅ Persistence
- SQLite database with WAL mode
- Documents, shares, and attachments persist across refresh
- Rich text content stored as TipTap JSON (preserves formatting)
- Foreign key constraints with cascade deletes

### ✅ Engineering Quality
- 5 automated tests covering CRUD, sharing, cascade deletes, JSON persistence
- JWT authentication with bcrypt password hashing
- Input validation and error handling on all endpoints
- Clean separation: API routes, middleware, database layer
- Responsive design with mobile support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Rich Text | TipTap (ProseMirror) |
| Styling | Vanilla CSS with design tokens |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Auth | JWT + bcrypt |
| File Upload | Multer + Mammoth.js |
| Icons | Lucide React |
| Testing | Vitest |

## Intentional Scope Cuts

- **No real-time collaboration**: WebSocket sync adds significant complexity; auto-save is sufficient for the scope
- **No version history**: Would require content diffing and versioned snapshots
- **No commenting/suggestions**: Feature-rich but out of timebox scope
- **No PDF export**: Would need a rendering library
- **No role-based permissions beyond owner/viewer/editor**: Simple 2-level model covers the core use case

## What I Would Build Next (2-4 Hours)

1. **Real-time cursors**: WebSocket presence indicators showing who else is viewing
2. **Document version history**: Store snapshots on save, allow rollback
3. **Export to PDF/Markdown**: One-click export from the editor
4. **Image embedding**: Drag-and-drop images directly into the editor content
5. **Deployment**: Dockerize and deploy to Render (backend) + Vercel (frontend)
