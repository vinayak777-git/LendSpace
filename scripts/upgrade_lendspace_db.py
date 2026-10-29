import sqlite3

def upgrade_schema(db_path):
    print(f"Applying schema additions to {db_path}...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    def get_columns(table):
        return [row[1] for row in cur.execute(f'PRAGMA table_info("{table}");').fetchall()]

    # 1. users
    user_cols = get_columns("users")
    user_additions = [
        ("phone", "VARCHAR(50)"),
        ("business_name", "VARCHAR(255)"),
        ("email_verified", "BOOLEAN DEFAULT 0 NOT NULL"),
        ("is_verified_by_platform", "BOOLEAN DEFAULT 0 NOT NULL"),
        ("completed_bookings_count", "INTEGER DEFAULT 0 NOT NULL"),
        ("average_rating", "FLOAT DEFAULT 0.0 NOT NULL"),
    ]
    for col, col_type in user_additions:
        if col not in user_cols:
            print(f"Adding column users.{col}")
            cur.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type};")

    # 2. resources
    res_cols = get_columns("resources")
    res_additions = [
        ("hourly_rate", "FLOAT DEFAULT 0.0 NOT NULL"),
        ("daily_rate", "FLOAT DEFAULT 0.0 NOT NULL"),
        ("pricing_model", "VARCHAR(50) DEFAULT 'hourly' NOT NULL"),
        ("currency", "VARCHAR(10) DEFAULT '₹' NOT NULL"),
        ("area_sq_ft", "FLOAT"),
    ]
    for col, col_type in res_additions:
        if col not in res_cols:
            print(f"Adding column resources.{col}")
            cur.execute(f"ALTER TABLE resources ADD COLUMN {col} {col_type};")

    # 3. bookings
    book_cols = get_columns("bookings")
    book_additions = [
        ("total_price_minor_units", "INTEGER DEFAULT 0 NOT NULL"),
        ("deposit_minor_units", "INTEGER DEFAULT 0 NOT NULL"),
        ("payment_status", "VARCHAR(50) DEFAULT 'none' NOT NULL"),
    ]
    for col, col_type in book_additions:
        if col not in book_cols:
            print(f"Adding column bookings.{col}")
            cur.execute(f"ALTER TABLE bookings ADD COLUMN {col} {col_type};")

    conn.commit()
    conn.close()
    print("Schema update complete.")

if __name__ == "__main__":
    upgrade_schema("lendspace.db")

