import os
import sqlite3
import time
import uuid

def check_explain_query_plan(db_path="lendspace.db"):
    print(f"=== EXPLAIN QUERY PLAN ON {db_path} ===")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    queries = [
        (
            "1. Resource Search by Kind & Status",
            "EXPLAIN QUERY PLAN SELECT * FROM resources WHERE kind = 'equipment' AND status = 'live';"
        ),
        (
            "2. Bookings by User",
            "EXPLAIN QUERY PLAN SELECT * FROM bookings WHERE user_id = 'test-id' ORDER BY start_at DESC;"
        ),
        (
            "3. Overlap Check for Resource Window",
            "EXPLAIN QUERY PLAN SELECT * FROM bookings WHERE resource_id = 'res-1' AND status IN ('pending', 'approved', 'checked_in', 'overdue') AND start_at < '2026-10-30T12:00:00' AND end_at > '2026-10-30T10:00:00';"
        ),
        (
            "4. Unread Notifications for User",
            "EXPLAIN QUERY PLAN SELECT * FROM notifications WHERE user_id = 'test-id' AND read_at IS NULL ORDER BY created_at DESC;"
        ),
        (
            "5. Owner Listings Query",
            "EXPLAIN QUERY PLAN SELECT * FROM resources WHERE owner_id = 'owner-id' AND status = 'live';"
        ),
    ]

    for name, q in queries:
        print(f"\n{name}:")
        plans = cur.execute(q).fetchall()
        for p in plans:
            print("  ", p)

    conn.close()


def benchmark_10000_records():
    perf_db = "throwaway_perf.db"
    if os.path.exists(perf_db):
        os.remove(perf_db)

    print(f"\n=== POPULATING 10,000 SYNTHETIC RECORDS IN THROWAWAY DB ({perf_db}) ===")
    conn = sqlite3.connect(perf_db)
    cur = conn.cursor()

    # Create tables and indexes
    cur.execute("""
    CREATE TABLE resources (
        id VARCHAR(36) PRIMARY KEY,
        owner_id VARCHAR(36),
        kind VARCHAR(50),
        title VARCHAR(255),
        status VARCHAR(50),
        category VARCHAR(100),
        hourly_rate FLOAT DEFAULT 0.0,
        is_deleted BOOLEAN DEFAULT 0
    );
    """)
    cur.execute("CREATE INDEX ix_resources_owner_status ON resources(owner_id, status);")
    cur.execute("CREATE INDEX ix_resources_category_status ON resources(category, status);")

    cur.execute("""
    CREATE TABLE bookings (
        id VARCHAR(36) PRIMARY KEY,
        resource_id VARCHAR(36),
        user_id VARCHAR(36),
        start_at DATETIME,
        end_at DATETIME,
        status VARCHAR(50),
        total_price_minor_units INTEGER DEFAULT 0
    );
    """)
    cur.execute("CREATE INDEX ix_bookings_user_status ON bookings(user_id, status);")
    cur.execute("CREATE INDEX ix_bookings_resource_window_status ON bookings(resource_id, start_at, end_at, status);")

    # Insert 10,000 rows
    print("Generating 10,000 records...")
    res_rows = []
    book_rows = []
    for i in range(5000):
        r_id = str(uuid.uuid4())
        res_rows.append((r_id, f"owner-{i % 50}", "equipment", f"Machine {i}", "live", "Machining", 25.0, 0))
        book_rows.append((str(uuid.uuid4()), r_id, f"user-{i % 100}", "2026-11-01T10:00:00", "2026-11-01T12:00:00", "approved", 5000))
        book_rows.append((str(uuid.uuid4()), r_id, f"user-{i % 100}", "2026-11-02T14:00:00", "2026-11-02T16:00:00", "pending", 5000))

    cur.executemany("INSERT INTO resources VALUES (?,?,?,?,?,?,?,?);", res_rows)
    cur.executemany("INSERT INTO bookings VALUES (?,?,?,?,?,?,?);", book_rows)
    conn.commit()

    print(f"Total inserted: {len(res_rows)} resources, {len(book_rows)} bookings (Total: {len(res_rows) + len(book_rows)} rows)")

    benchmarks = [
        (
            "Search resources by owner and status (10,000 dataset)",
            "SELECT COUNT(*) FROM resources WHERE owner_id = 'owner-25' AND status = 'live';"
        ),
        (
            "Bookings by user (10,000 dataset)",
            "SELECT * FROM bookings WHERE user_id = 'user-42' AND status = 'approved';"
        ),
        (
            "Overlap check on 10,000 dataset",
            "SELECT * FROM bookings WHERE resource_id = 'some-resource' AND status IN ('pending', 'approved') AND start_at < '2026-11-01T13:00:00' AND end_at > '2026-11-01T09:00:00';"
        )
    ]

    all_under_300ms = True
    for name, q in benchmarks:
        t0 = time.perf_counter()
        cur.execute(q).fetchall()
        t1 = time.perf_counter()
        elapsed_ms = (t1 - t0) * 1000.0
        status = "PASS (<300ms)" if elapsed_ms < 300.0 else "FAIL (>300ms)"
        print(f"[{status}] {name}: {elapsed_ms:.2f} ms")
        if elapsed_ms >= 300.0:
            all_passed = False

    conn.close()

    # Clean up throwaway database
    if os.path.exists(perf_db):
        os.remove(perf_db)
        print(f"Cleaned up and dropped {perf_db}.")

    return all_under_300ms

if __name__ == "__main__":
    check_explain_query_plan()
    benchmark_10000_records()
