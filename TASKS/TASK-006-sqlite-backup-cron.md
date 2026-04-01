## Task 006: SQLite Backup Cron - Daily Offsite Copy with Tested Restore
**Phase:** 1 | **Agent:** architect
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-004

### Context
Litestream provides continuous replication, but a belt-and-suspenders approach requires a daily full backup as well. This is a separate, independent backup mechanism that uses SQLite's `.backup` command to produce a consistent snapshot. The restore procedure must be tested and documented so the owner (or a future developer) can recover from any failure scenario.

### What Needs Doing
1. Create `infrastructure/backup-daily.sh`:
   - Use `sqlite3 /data/database.sqlite ".backup /tmp/backup-$(date +%Y%m%d-%H%M%S).sqlite"` to produce a consistent snapshot.
   - Run `sqlite3 /tmp/backup-*.sqlite "PRAGMA integrity_check;"` to verify the backup.
   - Upload to Cloudflare R2 under a `daily-backups/` prefix using `aws s3 cp` (S3-compatible CLI) or `rclone`.
   - Retain the last 30 daily backups (delete older ones).
   - Log success/failure to stdout (Railway captures container logs).
2. Create `infrastructure/backup-manual.sh`:
   - Same logic as daily backup but with a `manual-` prefix in the filename.
   - Intended for the owner to trigger before risky operations (e.g., bulk product changes).
   - Can be invoked via `railway run bash infrastructure/backup-manual.sh` or an admin endpoint.
3. Create `infrastructure/restore-from-backup.sh`:
   - Lists available backups in R2.
   - Downloads the specified backup (or latest if no argument).
   - Stops the application.
   - Replaces `/data/database.sqlite` with the backup.
   - Runs `PRAGMA integrity_check`.
   - Restarts the application.
4. Schedule the daily backup:
   - Add a Laravel scheduled command that runs `backup-daily.sh` at 03:00 UTC daily.
   - Alternatively, use Railway's cron job feature if available.
5. Document the restore procedure in `infrastructure/RESTORE-RUNBOOK.md`:
   - Step-by-step instructions a non-developer can follow with Railway CLI.
   - Covers three scenarios: (a) restore from daily backup, (b) restore from Litestream, (c) restore from Railway volume snapshot.
6. Test the restore procedure end-to-end:
   - Create a backup, delete the database, restore, verify data integrity.

### Files
- `infrastructure/backup-daily.sh` (create)
- `infrastructure/backup-manual.sh` (create)
- `infrastructure/restore-from-backup.sh` (create)
- `infrastructure/RESTORE-RUNBOOK.md` (create)
- `backend/app/Console/Kernel.php` or equivalent Laravel 12 scheduling config (modify)

### How to Test
- Run `backup-daily.sh` manually. Verify a `.sqlite` file appears in R2 under `daily-backups/`.
- Run `PRAGMA integrity_check` on the uploaded backup - returns `ok`.
- Run `restore-from-backup.sh` targeting the backup just created. Verify data is intact.
- Verify the scheduled command runs at the expected time (check Laravel schedule list).
- Run `backup-manual.sh` and verify a `manual-` prefixed backup appears in R2.

### Unexpected Outcomes
- If `sqlite3` CLI is not available in the container, install it in the Dockerfile.
- If R2 upload fails due to credential or endpoint issues, ensure the same credentials as Litestream are used (TASK-005).
- If the backup file is larger than expected (>100MB for this scale of site), flag for investigation.

### On Completion
Backup strategy is complete. Both continuous (Litestream) and daily (cron) backups are operational with tested restore procedures. This is a Phase 1 gate - must be confirmed before launch.
