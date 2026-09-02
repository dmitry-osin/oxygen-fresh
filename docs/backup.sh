#!/bin/sh
# Backup the blog data and uploads (ai/requirements.md 53-58).
# Stops the container, archives both volumes, restarts the container.
# Run on the host where the volumes are mounted (see docs/deployment.md).
#
# Usage:
#   ./docs/backup.sh [backup-directory]     # default: ./backups
#   CONTAINER=my-blog ./docs/backup.sh

set -eu

CONTAINER="${CONTAINER:-oxygen-blog}"
APP_DIR="${APP_DIR:-$HOME/oxygen-blog}"
BACKUP_DIR="${1:-./backups}"
DATE="$(date +%F)"

cd "$APP_DIR"
mkdir -p "$BACKUP_DIR"

docker stop "$CONTAINER"
tar czf "$BACKUP_DIR/backup-$DATE.tar.gz" data/ static/uploads/
docker start "$CONTAINER"

echo "Backup written to $BACKUP_DIR/backup-$DATE.tar.gz"
echo "Copy it off the host (rsync / S3 / backup disk) - the archive"
echo "contains kv.sqlite3 (all content) and every uploaded image."
