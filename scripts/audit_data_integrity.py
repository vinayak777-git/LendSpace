import sqlite3
import sys

def run_data_integrity_audit(db_path="lendspace.db"):
    print(f"=== RUNNING DATA INTEGRITY QUERIES ON {db_path} ===")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    queries = [
        (
            "Orphaned Bookings (User does not exist)",
            """
            SELECT b.id, b.user_id FROM bookings b
            LEFT JOIN users u ON b.user_id = u.id
            WHERE u.id IS NULL;
            """
        ),
        (
            "Orphaned Bookings (Resource does not exist)",
            """
            SELECT b.id, b.resource_id FROM bookings b
            LEFT JOIN resources r ON b.resource_id = r.id
            WHERE r.id IS NULL;
            """
        ),
        (
            "Orphaned Resources (Owner does not exist)",
            """
            SELECT r.id, r.owner_id FROM resources r
            LEFT JOIN users u ON r.owner_id = u.id
            WHERE u.id IS NULL;
            """
        ),
        (
            "Orphaned Ledger Entries (Wallet does not exist)",
            """
            SELECT l.id, l.wallet_id FROM ledger_entries l
            LEFT JOIN wallets w ON l.wallet_id = w.id
            WHERE w.id IS NULL;
            """
        ),
        (
            "Overlapping Approved/Pending Bookings on Same Resource",
            """
            SELECT b1.id, b2.id, b1.resource_id, b1.start_at, b1.end_at, b2.start_at, b2.end_at
            FROM bookings b1
            JOIN bookings b2 ON b1.resource_id = b2.resource_id AND b1.id != b2.id
            WHERE b1.status IN ('pending', 'approved', 'checked_in', 'overdue')
              AND b2.status IN ('pending', 'approved', 'checked_in', 'overdue')
              AND b1.start_at < b2.end_at
              AND b1.end_at > b2.start_at;
            """
        ),
        (
            "Wallets where Balance != SUM(ledger_entries)",
            """
            SELECT w.id, w.user_id, w.balance_minor_units, COALESCE(SUM(l.amount_minor_units), 0) AS ledger_sum
            FROM wallets w
            LEFT JOIN ledger_entries l ON w.id = l.wallet_id
            GROUP BY w.id
            HAVING w.balance_minor_units != COALESCE(SUM(l.amount_minor_units), 0);
            """
        ),
        (
            "Ledger Entries with Duplicate Idempotency Keys",
            """
            SELECT idempotency_key, COUNT(*)
            FROM ledger_entries
            GROUP BY idempotency_key
            HAVING COUNT(*) > 1;
            """
        ),
        (
            "Impossible State: Approved paid booking with no payment hold",
            """
            SELECT id, resource_id, status, payment_status, total_price_minor_units
            FROM bookings
            WHERE status = 'approved'
              AND total_price_minor_units > 0
              AND payment_status = 'none';
            """
        ),
        (
            "Impossible State: Completed/Returned paid booking with no settlement",
            """
            SELECT id, resource_id, status, payment_status, total_price_minor_units
            FROM bookings
            WHERE status = 'returned'
              AND total_price_minor_units > 0
              AND payment_status NOT IN ('released', 'refunded');
            """
        ),
    ]

    all_passed = True
    for name, q in queries:
        rows = cur.execute(q).fetchall()
        count = len(rows)
        status = "PASS (0 rows)" if count == 0 else f"FAIL ({count} rows)"
        print(f"[{status}] {name}")
        if count > 0:
            all_passed = False
            for r in rows[:5]:
                print("   Violation:", r)

    conn.close()
    return all_passed

if __name__ == "__main__":
    success = run_data_integrity_audit("lendspace.db")
    if not success:
        sys.exit(1)

