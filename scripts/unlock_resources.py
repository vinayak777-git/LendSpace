import sqlite3

def unlock():
    conn = sqlite3.connect("lendspace.db")
    c = conn.cursor()
    # 1. Ensure all resources have allowed_audience = 'anyone_verified'
    c.execute("UPDATE resources SET allowed_audience = 'anyone_verified';")
    print(f"Updated allowed_audience on {c.rowcount} resources.")

    # 2. Delete hard blocking requirements on demo resources
    c.execute("DELETE FROM resource_requirements;")
    print(f"Removed strict requirement badge barriers ({c.rowcount} rows).")

    conn.commit()
    conn.close()
    print("Database resources successfully unlocked for all bookers!")

if __name__ == "__main__":
    unlock()

