import sqlite3

conn = sqlite3.connect("lendspace.db")
cur = conn.cursor()
print("Users in lendspace.db:")
for row in cur.execute("SELECT id, email, full_name, role, is_deleted FROM users").fetchall():
    print(" ", row)

print("\nResources in lendspace.db:")
for row in cur.execute("SELECT id, title, kind, hourly_rate, is_deleted FROM resources").fetchall():
    print(" ", row)

conn.close()

