## Task 005: Litestream Setup - Continuous Replication to Cloudflare R2
**Phase:** 2 | **Agent:** architect
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-004

### Context
Litestream provides near-zero RPO backup by continuously replicating SQLite WAL frames to Cloudflare R2. This is the primary disaster recovery mechanism. If the Railway volume fails or is corrupted, Litestream allows restoring to within seconds of the last write.

### What Needs Doing
1. Install Litestream in the Dockerfile (add to TASK-003's Dockerfile):
   - Download the latest Litestream binary for Alpine Linux.
   - Place at `/usr/local/bin/litestream`.
2. Create `infrastructure/litestream.yml` configuration:
   ```yaml
   dbs:
     - path: /data/database.sqlite
       replicas:
         - type: s3
           bucket: centrifungal-backup
           path: litestream
           endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
           access-key-id: ${R2_ACCESS_KEY_ID}
           secret-access-key: ${R2_SECRET_ACCESS_KEY}
           retention: 72h
           sync-interval: 1s
   ```
3. Update `infrastructure/entrypoint.sh` to run `litestream replicate` as the process wrapper:
   - Use `litestream replicate -exec "supervisord -c /etc/supervisor/supervisord.conf"` pattern so Litestream wraps the main process.
4. Create a Cloudflare R2 bucket named `centrifungal-backup` (document the manual steps - R2 bucket creation is a dashboard/CLI action):
   - Enable S3-compatible API access.
   - Create an API token with read/write access to the bucket.
   - Document the required env vars: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, R2 endpoint URL.
5. Create `infrastructure/restore-from-litestream.sh`:
   - Stops the running application.
   - Runs `litestream restore -o /data/database.sqlite`.
   - Verifies the restored database with an integrity check: `sqlite3 /data/database.sqlite "PRAGMA integrity_check;"`.
   - Restarts the application.

### Files
- `infrastructure/litestream.yml` (create)
- `infrastructure/restore-from-litestream.sh` (create)
- `infrastructure/Dockerfile` (modify - add Litestream binary)
- `infrastructure/entrypoint.sh` (modify - wrap with Litestream)

### How to Test
- Deploy to Railway. Insert a test row into the database.
- Check R2 bucket - WAL frames should appear within seconds.
- Destroy the SQLite file on the volume (`rm /data/database.sqlite`).
- Run `restore-from-litestream.sh`.
- Verify the test row is present in the restored database.
- `PRAGMA integrity_check` returns `ok`.

### Unexpected Outcomes
- If Litestream fails to connect to R2, check endpoint URL format and credentials. Cloudflare R2's S3 compatibility has specific endpoint requirements.
- If replication lag exceeds 10 seconds under normal load, flag for investigation.
- If Litestream significantly increases container memory usage (beyond 50MB overhead), flag - may need to adjust Railway resource allocation.

### On Completion
Litestream is operational. Queue TASK-006 (daily backup cron) which provides the second backup layer.
