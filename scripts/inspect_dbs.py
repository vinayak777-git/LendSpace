import sqlite3

def inspect(path):
    print("=== " + path + " ===")
    conn = sqlite3.connect(path)
    cur = conn.cursor()
    tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
    for (t,) in tables:
        count = cur.execute(f'SELECT COUNT(*) FROM "{t}";').fetchone()[0]
        print(f"  {t}: {count} rows")
    conn.close()

try:
    inspect("lendspace.db")
except Exception as e:
    print("lendspace.db error:", e)

try:
    inspect("backups/lendspace_backup_20261029.db")
except Exception as e:
    print("backup error:", e)

