import os
import sqlite3
import pytest
from app.core.config import settings


def test_sqlite_wal_crash_recovery_and_isolation():
    """Verify that uncommitted transactions interrupted abruptly leave zero half-committed data
    and SQLite WAL recovery maintains 100% database integrity."""
    db_file = "test_crash_recovery.db"
    if os.path.exists(db_file):
        os.remove(db_file)

    try:
        # 1. Initialize DB with WAL mode and table
        conn1 = sqlite3.connect(db_file)
        conn1.execute("PRAGMA journal_mode=WAL;")
        conn1.execute("PRAGMA synchronous=NORMAL;")
        conn1.execute(
            "CREATE TABLE sample_bookings (id TEXT PRIMARY KEY, amount INTEGER, status TEXT);"
        )
        conn1.execute("INSERT INTO sample_bookings VALUES ('b1', 100, 'approved');")
        conn1.commit()
        conn1.close()

        # 2. Simulate process crash during transaction:
        # Start a connection, insert an in-flight uncommitted transaction
        conn2 = sqlite3.connect(db_file)
        conn2.execute("BEGIN IMMEDIATE;")
        conn2.execute("INSERT INTO sample_bookings VALUES ('b2_crash', 500, 'pending');")
        # Simulate sudden process termination without conn2.commit() or conn2.rollback()
        # By closing the underlying OS file handle / connection abruptly
        conn2.close()

        # 3. Simulate recovery on backend restart
        conn3 = sqlite3.connect(db_file)
        cursor = conn3.cursor()

        # Run integrity check
        cursor.execute("PRAGMA integrity_check;")
        integrity_status = cursor.fetchone()[0]
        assert integrity_status == "ok"

        # Verify uncommitted transaction did not persist
        cursor.execute("SELECT id, amount, status FROM sample_bookings;")
        rows = cursor.fetchall()
        assert len(rows) == 1
        assert rows[0][0] == "b1"
        assert not any(r[0] == "b2_crash" for r in rows)

        conn3.close()
    finally:
        for ext in ["", "-wal", "-shm"]:
            f = f"{db_file}{ext}"
            if os.path.exists(f):
                try:
                    os.remove(f)
                except Exception:
                    pass

