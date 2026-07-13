<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/TipTap-ProseMirror-6366f1" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Tests-5%20Passing-10b981" />
</p>

# 📝 Ajaia CollabDocs

> A lightweight collaborative document editor with rich text editing, file import, and document sharing — built for the **Ajaia LLC AI-Native Full Stack Developer Assignment**.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/)) — *or just* **Docker**
- **npm** 9+

### 1️⃣ Clone & Install Backend

```bash
git clone https://github.com/MrCarpediem/ajaia-collab-docs.git
cd ajaia-collab-docs/server
npm install
```

### 2️⃣ Seed the Database

```bash
npm run seed
```

Creates 4 demo users and 3 sample documents with rich text content and pre-configured sharing.

### 3️⃣ Start the Backend

```bash
npm run dev
# ✅ Server running on http://localhost:3001
```

### 4️⃣ Start the Frontend (new terminal)

```bash
cd ajaia-collab-docs/client
npm install
npm run dev
# ✅ App running on http://localhost:5173
```

### 5️⃣ Open & Login

Visit **http://localhost:5173** and use any demo account below.

---

## 🐳 Docker (One-Command Alternative)

Skip all of the above — run everything with:

```bash
docker compose up --build
# ✅ Full app running on http://localhost:3001
```

This builds the React frontend, bundles it into the Express server, auto-seeds the database, and starts everything on port **3001**. Data persists in Docker volumes.

---

## 🔐 Demo Accounts

| User | Email | Password | Pre-loaded Data |
|------|-------|----------|-----------------|
| 👩 Alice Johnson | `alice@ajaia.com` | `password123` | Owns "Project Kickoff Notes" (shared with Bob & Prem) |
| 👨 Bob Smith | `bob@ajaia.com` | `password123` | Owns "API Design Spec" (shared with Alice) |
| 👩 Carol Davis | `carol@ajaia.com` | `password123` | No docs — great for testing sharing |
| 👨 Prem Prakash | `prem@ajaia.com` | `password123` | Owns "Meeting Agenda", has view access to Alice's doc |

---

## ✨ Features

### 📄 Document Creation & Editing
- Create, rename, and delete documents
- **Rich text editor** powered by [TipTap](https://tiptap.dev/) (ProseMirror)
- Formatting: **Bold**, *Italic*, <u>Underline</u>, ~~Strikethrough~~, Highlight
- Headings (H1, H2, H3), bullet lists, numbered lists
- Blockquotes, code blocks, horizontal rules
- Text alignment (left, center, right)
- **Auto-save** — saves 1 second after you stop typing

### 📁 File Upload & Import
- **Import mode**: Upload `.txt`, `.md`, or `.docx` → auto-converts to editable document
- **Attachment mode**: Attach files (`.txt`, `.md`, `.docx`, `.png`, `.jpg`, `.pdf`) to any document
- Drag-and-drop or click-to-browse upload UI
- Markdown parsing preserves headings, bold, italic, lists
- `.docx` content extraction via [Mammoth.js](https://github.com/mwilliamson/mammoth.js)

### 🤝 Document Sharing
- Document owner can share with any registered user
- **Two permission levels**: View (read-only) and Edit (full access)
- Visual badges: `OWNER`, `CAN EDIT`, `VIEW ONLY`
- Separate **"My Documents"** and **"Shared with Me"** tabs
- Slide-out share panel to add/remove collaborators

### 💾 Persistence
- SQLite database with WAL mode for reliable writes
- Documents, shares, and attachments persist across browser refresh
- Rich text stored as TipTap JSON — preserves all formatting perfectly
- Foreign key constraints with cascade deletes

---

## 🧪 Running Tests

```bash
cd server
npm test
```

```
 ✓ should create a document
 ✓ should update a document title
 ✓ should create and query shares
 ✓ should cascade delete shares when document is deleted
 ✓ should store and parse document content as JSON

 Test Files  1 passed (1)
      Tests  5 passed (5)
```

---

## 🏗️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 19 + Vite | Fast HMR, modern tooling |
| **Rich Text** | TipTap (ProseMirror) | Best DX, extensible, schema-based |
| **Styling** | Vanilla CSS + Design Tokens | Full control, no extra deps |
| **Backend** | Node.js + Express | JS full stack, fast to build |
| **Database** | SQLite (better-sqlite3) | Zero config, no cloud account needed |
| **Auth** | JWT + bcrypt | Lightweight, production-ready pattern |
| **File Upload** | Multer + Mammoth.js | Multi-format support |
| **Icons** | Lucide React | Clean, consistent icon set |
| **Testing** | Vitest | Fast, Vite-native |
| **Container** | Docker + Compose | One-command deployment |

---

## 📂 Project Structure

```
ajaia-collab-docs/
├── Dockerfile                # Multi-stage production build
├── docker-compose.yml        # One-command startup
├── server/
│   ├── index.js              # Express entry point
│   ├── db.js                 # SQLite schema & connection
│   ├── seed.js               # Database seeder (users + docs)
│   ├── db.test.js            # Automated tests (5 tests)
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   └── routes/
│       ├── auth.js           # Login, /me, user listing
│       ├── documents.js      # CRUD, sharing endpoints
│       └── upload.js         # File import & attachments
├── client/
│   ├── src/
│   │   ├── api/client.js     # Axios with auth interceptors
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx     # Auth page with quick-login
│   │   │   ├── Dashboard.jsx # Doc grid, tabs, search
│   │   │   └── Editor.jsx    # TipTap editor + toolbar
│   │   ├── components/
│   │   │   ├── SharePanel.jsx
│   │   │   └── UploadModal.jsx
│   │   └── index.css         # Design system (dark theme)
│   └── vite.config.js
├── README.md
├── ARCHITECTURE.md           # System design & decisions
├── AI_WORKFLOW.md            # AI tool usage notes
└── SUBMISSION.md             # Deliverables checklist
```

---

## ✂️ Intentional Scope Cuts

| Feature | Why Cut |
|---------|---------|
| Real-time collaboration | WebSocket sync adds significant complexity |
| Version history | Requires content diffing and snapshot storage |
| Commenting / suggestions | Rich feature, out of timebox |
| PDF export | Needs a rendering library |
| User registration UI | Seeded accounts keep the demo focused |

---

## 🔮 What I'd Build Next (2–4 Hours)

1. **Real-time presence** — WebSocket indicators showing who's viewing
2. **Version history** — Snapshots on save with rollback support
3. **Export to PDF/Markdown** — One-click export from the editor
4. **Image embedding** — Drag images directly into document content
5. **Cloud deploy** — Push Docker image to Render or Railway

---

## 📄 License

Built for the Ajaia LLC assessment. Not for redistribution.
