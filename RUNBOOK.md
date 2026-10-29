# LendSpace Production Operational Runbook

## Overview
LendSpace is a local-first resource sharing platform with a FastAPI + SQLAlchemy backend and React/Vite frontend. This runbook covers cold start, maintenance, backup/restore drills, recovery from failure, and troubleshooting.

---

## 1. System Cold Start (Starting from Zero)

### Option A: Local Bare-Metal / Native (Windows / Linux / macOS)
1. **Prerequisites**: Python 3.12+ (or 3.13), Node.js 18+.
2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Ensure SECRET_KEY is set to at least 32 characters
   ```
3. **Database & Migrations**:
   ```powershell
   # Run pre-flight checks to ensure DB readiness
   powershell.exe -ExecutionPolicy Bypass -File .\scripts\preflight.ps1
   ```
4. **Start Backend**:
   ```powershell
   .\.venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
5. **Start Frontend**:
   ```bash
   npm install
   npm run dev
   ```
   Open `http://localhost:5173`.

### Option B: Production Containerized (Docker Compose)
```bash
# 1. Validate environment
docker compose -f docker-compose.prod.yml config

# 2. Build and start containers
docker compose -f docker-compose.prod.yml up -d --build

# 3. Check health status
docker compose -f docker-compose.prod.yml ps
curl -f http://localhost:8000/health
```

---

## 2. Pre-Flight Verification

Before launching the server or after any code update, execute the automated pre-flight script:

```powershell
# Windows
.\scripts\preflight.ps1

# Linux / macOS
chmod +x ./scripts/preflight.sh
./scripts/preflight.sh
```

**Pre-flight checks performed**:
- Environment variables and security configurations (`SECRET_KEY` >= 32 chars).
- Database reachability, WAL journal mode, and `PRAGMA integrity_check`.
- Alembic migration alignment at head revision (`fc02f7bc64ac`).
- 5 ACID invariant queries (zero orphaned records, zero overlapping approvals, zero ledger drift).
- Synthetic transactional booking lifecycle (create -> cancel -> purge).

---

## 3. Routine Maintenance & Disk Operations

### SQLite WAL Checkpointing & Vacuuming
Run monthly or after heavy write traffic to compact database size:
```powershell
.\.venv\Scripts\python -c "import sqlite3; conn=sqlite3.connect('lendspace.db'); conn.execute('PRAGMA wal_checkpoint(TRUNCATE);'); conn.execute('VACUUM;'); conn.close(); print('Compaction complete.')"
```

### Outbox Email Purge
Old `.eml` files in `./outbox` can be safely pruned after 30 days:
```powershell
# PowerShell (files older than 30 days)
Get-ChildItem -Path .\outbox\*.eml | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item
```

### Log Rotation
Containerized logs are capped via `json-file` driver in `docker-compose.prod.yml`:
- `max-size: "10m"`
- `max-file: "3"` (maximum 30 MB log storage per container).

---

## 4. Backup & Restore Procedures

### Automated Backup & Restore Drill
To execute the live verification drill:
```powershell
.\.venv\Scripts\python scripts/backup_restore_drill.py
```

### Manual Backup (Online, Non-Blocking)
```powershell
# Creates snapshot while backend is active using SQLite online backup API
$dateStr = Get-Date -Format "yyyyMMdd_HHmmss"
.\.venv\Scripts\python -c "import sqlite3; s=sqlite3.connect('lendspace.db'); b=sqlite3.connect(f'backups/lendspace_backup_$dateStr.db'); s.backup(b); b.close(); s.close(); print('Backup created.')"
```

### Manual Restore
1. Stop the backend process:
   ```powershell
   # Stop uvicorn or docker compose
   docker compose -f docker-compose.prod.yml down
   ```
2. Replace `lendspace.db` with your verified snapshot:
   ```powershell
   Copy-Item "backups\lendspace_backup_20261029.db" "lendspace.db" -Force
   Remove-Item "lendspace.db-wal", "lendspace.db-shm" -ErrorAction SilentlyContinue
   ```
3. Run `preflight.ps1` to confirm restored database integrity.
4. Restart backend.

---

## 5. Failure Recovery

### Database Crash / Sudden Power Loss
SQLite with WAL mode guarantees that any transaction not committed at crash time is automatically rolled back on next connection. No manual repair needed.
Verify integrity:
```powershell
.\.venv\Scripts\python -c "import sqlite3; conn=sqlite3.connect('lendspace.db'); print(conn.execute('PRAGMA integrity_check;').fetchone()[0])"
```
Must return `ok`.

### Scheduler Crash
If background jobs stop executing:
1. Query APScheduler status via `GET /health/ready`.
2. Restart uvicorn process; APScheduler restarts synchronously in FastAPI `lifespan` handler.
3. Overdue detection and auto-completion catch up immediately on the next scheduled run.

### Stuck Pending Bookings
To expire reservations whose start time has passed without owner decision:
```powershell
.\.venv\Scripts\python -c "import asyncio; from app.jobs.stale_booking_cleaner import expire_stale_bookings_and_release_holds; asyncio.run(expire_stale_bookings_and_release_holds())"
```

---

## 6. Common Error Codes & Troubleshooting

| Status Code | Message | Cause | Resolution |
|---|---|---|---|
| `409 Conflict` | Reservation slot overlaps with existing booking | Double-booking race prevented by ACID exclusion/locks | Booker must choose alternative slot suggested in response |
| `403 Forbidden` | Operation requires one of roles: `['owner', 'admin']` | Booker attempted to access owner management route | Sign in with owner credentials or switch role |
| `422 Unprocessable` | End time must be strictly after start time | Invalid reservation duration submitted | Select an end time at least 15 minutes after start time |
| `401 Unauthorized` | Token has expired | JWT bearer session elapsed | Re-login via `/api/v1/auth/login` to obtain fresh access token |
| `400 Bad Request` | Insufficient wallet balance for reservation | User credits < booking price + deposit | Use `/api/v1/wallet/topup` to add required platform credits |

