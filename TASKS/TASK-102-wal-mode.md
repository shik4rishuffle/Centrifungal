## Task 102: WAL Mode Configuration
**Phase:** 1 | **Agent:** backend
**Priority:** High | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-101

### Context
SQLite defaults to rollback journal mode which blocks concurrent reads during writes. WAL mode enables concurrent reads and writes - critical for an API serving a frontend while processing webhooks and cron jobs. Busy timeout prevents "database is locked" errors under light contention.

### What Needs Doing
1. Create a service provider or use `AppServiceProvider::boot()` to execute SQLite pragmas on every connection
2. Set `PRAGMA journal_mode = WAL;`
3. Set `PRAGMA busy_timeout = 5000;` (5 seconds)
4. Set `PRAGMA synchronous = NORMAL;` (safe with WAL mode, better write performance)
5. Set `PRAGMA foreign_keys = ON;` (SQLite disables FK enforcement by default)
6. Verify pragmas apply by querying them back in a test
7. Add a note in config comments about the SQLite 3.52.0+ requirement (WAL-reset bug fix)

### Files
- `app/Providers/AppServiceProvider.php` (or new `app/Providers/DatabaseServiceProvider.php`)
- `config/database.php` (SQLite connection config)

### How to Test
- Boot application and run `PRAGMA journal_mode;` via Tinker - returns `wal`
- Run `PRAGMA busy_timeout;` - returns `5000`
- Run `PRAGMA synchronous;` - returns `1` (NORMAL)
- Run `PRAGMA foreign_keys;` - returns `1`
- Attempt to insert a row violating a FK constraint - confirm it is rejected

### Unexpected Outcomes
- WAL mode fails to engage (file permission issue on Railway volume) - flag
- SQLite version on Railway image is below 3.52.0 - flag, must update Docker image

### On Completion
Queue TASK-103 and TASK-104 in parallel.
