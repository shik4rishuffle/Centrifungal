#!/bin/sh
# =============================================================================
# Database Restore Script - Centrifungal
# =============================================================================
#
# Restores the SQLite database from either:
#   1. A Litestream replica (continuous replication)
#   2. A daily backup file from S3/R2
#
# Usage:
#   ./restore-db.sh litestream          Restore from Litestream replica
#   ./restore-db.sh backup <filename>   Restore a specific backup file from R2
#   ./restore-db.sh list                List available backup files in R2
#
# Prerequisites:
#   - AWS CLI or rclone configured with R2 credentials
#   - Litestream installed (for litestream restore)
#   - The application should be stopped before restoring
#
# Environment variables:
#   DB_DATABASE         - Path to the SQLite database (default: /data/database.sqlite)
#   R2_ENDPOINT_URL     - Cloudflare R2 endpoint URL
#   R2_ACCESS_KEY_ID    - R2 access key
#   R2_SECRET_ACCESS_KEY - R2 secret key
#   R2_BUCKET           - R2 bucket name (default: centrifungal-db-backups)

set -e

DB_PATH="${DB_DATABASE:-/data/database.sqlite}"
BUCKET="${R2_BUCKET:-centrifungal-db-backups}"
COMMAND="${1:-help}"

echo "=== Centrifungal Database Restore ==="
echo ""

case "$COMMAND" in
  litestream)
    echo "Restoring from Litestream replica..."
    echo ""
    echo "WARNING: This will overwrite the current database at ${DB_PATH}."
    echo "Make sure the application is stopped first."
    echo ""

    # Back up the current database if it exists
    if [ -f "$DB_PATH" ]; then
      BACKUP_PATH="${DB_PATH}.pre-restore.$(date +%Y%m%d_%H%M%S)"
      echo "Backing up current database to ${BACKUP_PATH}..."
      cp "$DB_PATH" "$BACKUP_PATH"
    fi

    # Restore from Litestream
    echo "Running litestream restore..."
    litestream restore -config /etc/litestream.yml "$DB_PATH"

    echo ""
    echo "Restore complete. Verify with:"
    echo "  sqlite3 ${DB_PATH} 'SELECT count(*) FROM migrations;'"
    echo ""
    echo "Then restart the application."
    ;;

  backup)
    FILENAME="$2"
    if [ -z "$FILENAME" ]; then
      echo "ERROR: Please specify the backup filename."
      echo "Usage: $0 backup <filename>"
      echo "Run '$0 list' to see available backups."
      exit 1
    fi

    echo "Restoring from backup: ${FILENAME}"
    echo ""
    echo "WARNING: This will overwrite the current database at ${DB_PATH}."
    echo "Make sure the application is stopped first."
    echo ""

    # Back up the current database if it exists
    if [ -f "$DB_PATH" ]; then
      BACKUP_PATH="${DB_PATH}.pre-restore.$(date +%Y%m%d_%H%M%S)"
      echo "Backing up current database to ${BACKUP_PATH}..."
      cp "$DB_PATH" "$BACKUP_PATH"
    fi

    # Download from R2 using AWS CLI (compatible with R2)
    echo "Downloading ${FILENAME} from R2..."
    AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
    AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
    aws s3 cp \
      --endpoint-url "$R2_ENDPOINT_URL" \
      "s3://${BUCKET}/backups/${FILENAME}" \
      "$DB_PATH"

    echo ""
    echo "Restore complete. Verify with:"
    echo "  sqlite3 ${DB_PATH} 'SELECT count(*) FROM migrations;'"
    echo ""
    echo "Then restart the application."
    ;;

  list)
    echo "Listing available backups in R2..."
    echo ""

    AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
    AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
    aws s3 ls \
      --endpoint-url "$R2_ENDPOINT_URL" \
      "s3://${BUCKET}/backups/" \
      --human-readable

    echo ""
    echo "To restore a backup:"
    echo "  $0 backup <filename>"
    ;;

  help|*)
    echo "Usage: $0 <command> [args]"
    echo ""
    echo "Commands:"
    echo "  litestream          Restore from Litestream continuous replica"
    echo "  backup <filename>   Restore a specific daily backup from R2"
    echo "  list                List available daily backups in R2"
    echo ""
    echo "Examples:"
    echo "  $0 litestream"
    echo "  $0 list"
    echo "  $0 backup database-2026-04-01_030000.sqlite"
    ;;
esac
