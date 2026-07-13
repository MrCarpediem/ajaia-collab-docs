# Architecture Note

## System Overview

```
┌─────────────────────────────┐
│     React Frontend (Vite)   │
│  ┌───────┐  ┌────────────┐  │
│  │ Login │  │ Dashboard   │  │
│  └───────┘  └────────────┘  │
│  ┌───────────────────────┐  │
│  │ TipTap Rich Text      │  │
│  │ Editor + Toolbar       │  │
│  └───────────────────────┘  │
│  ┌───────┐  ┌────────────┐  │
│  │ Share │  │ Upload     │  │
│  │ Panel │  │ Modal      │  │
│  └───────┘  └────────────┘  │
└──────────┬──────────────────┘
           │ REST API (JSON)
           ▼
┌─────────────────────────────┐
│   Express.js API Server     │
│  ┌─────────────────────┐    │
│  │ JWT Auth Middleware  │    │
│  └─────────────────────┘    │
│  ┌───────┐┌──────┐┌──────┐ │
│  │ Auth  ││ Docs ││Upload│ │
│  │Routes ││Routes││Routes│ │
│  └───────┘└──────┘└──────┘ │
└──────────┬──────────────────┘
           │ better-sqlite3
           ▼
┌─────────────────────────────┐
│        SQLite Database      │
│  ┌───────┐  ┌────────────┐  │
│  │ users │  │ documents  │  │
│  └───────┘  └────────────┘  │
│  ┌───────┐  ┌────────────┐  │
│  │shares │  │attachments │  │
│  └───────┘  └────────────┘  │
└─────────────────────────────┘
```

## Key Design Decisions

### 1. TipTap for Rich Text (over Quill, Slate, Draft.js)
- **Why**: Best developer experience, ProseMirror-based (battle-tested), extensible, free
- **Tradeoff**: Slightly larger bundle than Quill, but the schema-based content model makes persistence straightforward

### 2. Content Stored as TipTap JSON (not HTML)
- **Why**: TipTap's JSON schema is the canonical format—roundtrips perfectly, preserves all formatting semantics
- **Tradeoff**: Needs parsing for preview text, but avoids XSS concerns with raw HTML storage

### 3. SQLite over Postgres/Supabase
- **Why**: Zero external dependencies, instant setup, no cloud account needed for reviewers
- **Tradeoff**: Single-writer limitation, not horizontally scalable—acceptable for this scope

### 4. Simple JWT Auth with Seeded Users
- **Why**: Full auth flow (register, login, token refresh) is production-ready but keeps scope tight
- **Tradeoff**: No registration UI—deliberate cut to focus on editor and sharing quality

### 5. Two Permission Levels: View + Edit
- **Why**: Covers the core sharing use case without building a full RBAC system
- **Tradeoff**: No "commenter" or "admin" roles, but the model is extensible

### 6. Auto-Save with Debounce
- **Why**: Google Docs-like behavior—saves 1 second after the user stops typing
- **Tradeoff**: No explicit "save" confirmation unless the user clicks Save manually

## Data Model

```sql
users (id, email, name, password_hash, avatar_color)
documents (id, title, content, owner_id, created_at, updated_at)
shares (id, document_id, shared_with_id, permission)
attachments (id, document_id, filename, original_name, mime_type, size)
```

## What I Prioritized and Why

1. **Editor quality first**: The editing experience is the core product surface. A broken or awkward editor undermines everything else.
2. **Sharing logic over UI polish**: Working access control is more impressive than pixel-perfect styling.
3. **File import over attachments**: Converting `.md`/`.docx` into editable documents demonstrates more engineering depth than simple file storage.
4. **Tests on data layer**: Testing the database operations validates the most critical business logic (CRUD, sharing, cascade deletes).
