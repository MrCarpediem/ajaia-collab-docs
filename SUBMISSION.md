# Submission

## Contents

| Item | Location | Status |
|------|----------|--------|
| Source code | `/server` and `/client` directories | ✅ Complete |
| README.md | `/README.md` | ✅ Complete |
| Architecture note | `/ARCHITECTURE.md` | ✅ Complete |
| AI workflow note | `/AI_WORKFLOW.md` | ✅ Complete |
| SUBMISSION.md | This file | ✅ Complete |
| Automated tests | `/server/db.test.js` (5 tests) | ✅ Passing |
| Live deployment URL | TBD | 🔄 Pending |
| Walkthrough video URL | TBD | 🔄 Pending |

## Test Accounts

All accounts use password: `password123`

| Email | Name | Pre-configured Data |
|-------|------|-------------------|
| alice@ajaia.com | Alice Johnson | Owns "Project Kickoff Notes", shared with Bob (edit) and Prem (view) |
| bob@ajaia.com | Bob Smith | Owns "API Design Spec", shared with Alice (edit) |
| carol@ajaia.com | Carol Davis | No documents (good for testing sharing) |
| prem@ajaia.com | Prem Prakash | Owns "Meeting Agenda", has view access to Alice's doc |

## Feature Status

### Complete
- ✅ Document creation, renaming, deletion
- ✅ Rich text editing (bold, italic, underline, strikethrough, highlight, headings, lists, quotes, code blocks, alignment)
- ✅ Auto-save with debounce
- ✅ File import (.txt, .md, .docx → editable document)
- ✅ File attachments on documents
- ✅ Document sharing (view/edit permissions)
- ✅ Owned vs shared document views
- ✅ JWT authentication with seeded users
- ✅ SQLite persistence with WAL mode
- ✅ 5 automated tests
- ✅ Responsive dark theme UI

### Not Implemented (Intentional Scope Cuts)
- ❌ Real-time collaboration (WebSocket complexity)
- ❌ Version history
- ❌ Commenting / suggestion mode
- ❌ PDF export
- ❌ User registration UI

## Local Setup

```bash
# Backend
cd server && npm install && npm run seed && npm run dev

# Frontend (new terminal)
cd client && npm install && npm run dev
```

App runs at http://localhost:5173
