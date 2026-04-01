## Task 004: Confirm Persistent Volume - SQLite Survives Redeploy
**Phase:** 1 | **Agent:** architect
**Priority:** High | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-003

### Context
This is a non-negotiable Phase 1 gate. The architecture depends on SQLite on a Railway persistent volume. If data does not survive a redeploy, the entire database strategy must change (fallback: Postgres). This must be proven before any other backend work proceeds.

### What Needs Doing
1. Deploy the Dockerfile from TASK-003 to Railway with the persistent volume mounted at `/data`.
2. SSH or exec into the running container (via `railway shell` or Railway CLI).
3. Create a test SQLite database at `/data/test-persistence.sqlite`.
4. Insert a known test row: `CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT); INSERT INTO test VALUES (1, 'survives-redeploy');`
5. Trigger a redeploy (push a trivial commit or use `railway up`).
6. After the new container is running, verify:
   - `/data/test-persistence.sqlite` still exists.
   - `SELECT value FROM test WHERE id = 1;` returns `survives-redeploy`.
7. Document the result in a verification log.
8. Clean up the test database.

### Files
- `infrastructure/verify-persistence.sh` (create - script to automate steps 3-6)
- `AGENTS/verification-log.md` (create - record the result with timestamp)

### How to Test
- The test row inserted before redeploy is readable after redeploy.
- Pass: proceed with SQLite architecture.
- Fail: escalate immediately. Do not proceed with any database-dependent tasks.

### Unexpected Outcomes
- If the volume does not persist: STOP. Flag to orchestrator. The fallback is Railway Postgres addon (free tier available). This changes TASK-003, TASK-005, TASK-006, and all backend database configuration.
- If the volume persists but with corruption or permission changes, flag for investigation.

### On Completion
If PASS: unblocks TASK-005, TASK-006, and all backend database work. Record "PERSISTENT VOLUME CONFIRMED" in verification log.
If FAIL: escalate to orchestrator with recommendation to switch to Postgres.
