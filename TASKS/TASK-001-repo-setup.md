## Task 001: Repository Setup
**Phase:** 1 | **Agent:** architect
**Priority:** High | **Status:** TODO
**Est. Effort:** S | **Dependencies:** none

### Context
Every other task depends on a working monorepo. This is the first thing that must exist before any agent can begin work.

### What Needs Doing
1. Initialise the Git repository (if not already initialised) with a `main` branch.
2. Create the top-level directory structure:
   ```
   /
   ├── backend/          # Laravel 12 + Statamic 6 application
   ├── frontend/         # Static HTML/CSS/JS source (built and deployed to Netlify)
   ├── infrastructure/   # Dockerfile, docker-compose.yml, Litestream config, backup scripts
   ├── AGENTS/           # Agent instructions and plans (already exists)
   ├── .gitignore
   ├── README.md
   └── REQUIREMENTS.md   # Already exists
   ```
3. Create `.gitignore` covering:
   - PHP: `vendor/`, `.env`, `storage/framework/`, `bootstrap/cache/`
   - Node: `node_modules/`, `dist/`
   - SQLite: `*.sqlite`, `*.sqlite-journal`, `*.sqlite-wal`, `*.sqlite-shm`
   - OS: `.DS_Store`, `Thumbs.db`
   - IDE: `.idea/`, `.vscode/` (except shared settings if needed)
4. Create a minimal `README.md` with project name, one-line description, and links to `REQUIREMENTS.md` and `AGENTS/architect-output.md`.

### Files
- `.gitignore` (create)
- `README.md` (create)
- `backend/` (create directory)
- `frontend/` (create directory)
- `infrastructure/` (create directory)

### How to Test
- `git status` shows a clean working tree after initial commit.
- All three subdirectories exist.
- `.gitignore` prevents committing `vendor/`, `node_modules/`, `.env`, and `*.sqlite` files.

### Unexpected Outcomes
- If the repo is already initialised with a different branch structure, flag before restructuring.
- If existing files would be moved or deleted, flag for approval.

### On Completion
Unblocks all other TASK-002 through TASK-009. Queue TASK-002 and TASK-003 in parallel.
