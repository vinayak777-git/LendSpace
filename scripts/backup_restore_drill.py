import os
import sqlite3
import sys
from audit_data_integrity import run_data_integrity_audit

def backup_restore_drill():
    print("=== STARTING BACKUP & RESTORE DRILL ===")
    src_db = "lendspace.db"
    backup_file = "backups/drill_snapshot.db"
    restored_db = "restore_drill.db"

    os.makedirs("backups", exist_ok=True)
    if os.path.exists(backup_file):
        os.remove(backup_file)
    if os.path.exists(restored_db):
        os.remove(restored_db)

    # 1. Online atomic backup
    print(f"1. Performing atomic backup: {src_db} -> {backup_file}")
    src_conn = sqlite3.connect(src_db)
    bck_conn = sqlite3.connect(backup_file)
    src_conn.backup(bck_conn)
    bck_conn.close()
    src_conn.close()
    print("   Backup completed successfully.")

    # 2. Restore into a fresh database
    print(f"2. Performing restore drill into fresh database: {backup_file} -> {restored_db}")
    bck_conn = sqlite3.connect(backup_file)
    res_conn = sqlite3.connect(restored_db)
    bck_conn.backup(res_conn)
    bck_conn.close()
    res_conn.close()
    print("   Restore completed successfully.")

    # 3. Run full data integrity audit against restored database
    print(f"3. Running full data integrity queries on restored database {restored_db}...")
    success = run_data_integrity_audit(restored_db)

    # 4. Cleanup drill files
    if os.path.exists(restored_db):
        os.remove(restored_db)
    if os.path.exists(backup_file):
        os.remove(backup_file)
    print("4. Cleaned up drill artifacts. Backup & restore drill PASSED.")
    return success

if __name__ == "__main__":
    if not backup_restore_drill():
        sys.exit(1)

