# AI Workflow Note

## Tools Used
- **Gemini (Antigravity Agent)** — primary AI coding assistant for scaffolding, code generation, debugging, and documentation

## Where AI Materially Sped Up Work

1. **Project scaffolding** (~20 min saved): Generated the initial Express server structure, database schema, and Vite+React setup. Without AI, this boilerplate would take 30-40 minutes manually.

2. **TipTap integration** (~15 min saved): AI generated the toolbar button bindings and editor configuration. TipTap's API has many extensions and the AI knew the correct imports and chain syntax.

3. **File import logic** (~15 min saved): The Markdown-to-TipTap JSON converter (parsing headings, lists, bold/italic) was AI-generated. Manual implementation would require reading TipTap's JSON spec thoroughly.

4. **CSS design system** (~20 min saved): The complete dark theme with design tokens, glassmorphism effects, and responsive styles was generated in one pass. This is tedious to write manually.

5. **Test scaffolding** (~10 min saved): AI generated the Vitest test cases covering CRUD, sharing, cascade deletes, and JSON persistence.

## What I Changed or Rejected

1. **Rejected initial Tailwind suggestion**: AI initially suggested Tailwind CSS, but I chose vanilla CSS for maximum control and to avoid adding a build dependency.

2. **Modified auto-save logic**: AI's first implementation saved on every keystroke. I changed it to debounced saves (1 second delay) to reduce API calls.

3. **Simplified share model**: AI suggested a full RBAC system with roles. I cut it to owner/view/edit—sufficient for the assignment scope.

4. **Fixed proxy configuration**: AI initially set up API calls with full URLs. I added Vite's proxy config to simplify CORS handling in development.

5. **Rewrote seed data**: AI generated generic lorem ipsum content. I wrote product-relevant sample documents (kickoff notes, API spec, sprint agenda) that demonstrate the editor's formatting capabilities.

## How I Verified Correctness

1. **Backend tests**: Ran `npm test` — 5/5 tests pass covering document CRUD, sharing, cascade deletes, and JSON content persistence.

2. **API smoke testing**: Used `curl` to verify login, document listing, and token-based auth before building the frontend.

3. **Manual E2E testing**: Tested the full flow in the browser — login, create doc, edit with formatting, share, import file, view shared docs.

4. **Cross-user verification**: Logged in as different users to verify sharing permissions work correctly (owner sees share button, viewers see read-only mode).

5. **Code review**: Read through all AI-generated code, checking for security issues (SQL injection via parameterized queries ✓, XSS via JSON storage ✓, auth middleware on all protected routes ✓).
