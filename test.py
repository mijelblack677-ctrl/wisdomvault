#!/usr/bin/env python3
"""
Test the production database connection (VPS PostgreSQL).

Run:  python3 test.py
Set DATABASE_URL to test a different target, e.g. the VPS loopback:
  DATABASE_URL='postgresql://wisdom_vault:<pass>@127.0.0.1:5432/wisdom_vault' python3 test.py
"""

import os
import sys
import time

import psycopg2
import psycopg2.extras

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db_config import DATABASE_URL

LABEL = "PRODUCTION DATABASE (VPS PostgreSQL)"


def test_connection(url, name):
    print(f"\n{'='*60}")
    print(f"🔍 Testing: {name}")
    print(f"{'='*60}")
    safe = url
    if "@" in safe and "//" in safe:
        scheme, rest = safe.split("//", 1)
        creds, host = rest.split("@", 1)
        user = creds.split(":", 1)[0]
        safe = f"{scheme}//{user}:***@{host}"
    print(f"URL: {safe}")

    try:
        start = time.time()
        conn = psycopg2.connect(url)
        elapsed = (time.time() - start) * 1000
        print(f"✅ Connection successful! ({elapsed:.0f}ms)")

        cursor = conn.cursor()
        cursor.execute("""
            SELECT 1, NOW(), current_database(), current_user,
                   setting FROM pg_settings WHERE name = 'ssl'
        """)
        test, server_time, db_name, db_user, ssl = cursor.fetchone()

        print(f"\n📊 Query Result:")
        print(f"  Test: {test}")
        print(f"  Server Time: {server_time}")
        print(f"  Database: {db_name}  |  User: {db_user}")
        print(f"  SSL on server: {ssl}")

        cursor.execute("SELECT version()")
        print(f"  PostgreSQL Version: {cursor.fetchone()[0][:60]}...")

        cursor.execute("""
            SELECT
                COUNT(*) AS total_connections,
                SUM(CASE WHEN state = 'idle' THEN 1 ELSE 0 END) AS idle,
                SUM(CASE WHEN state = 'active' THEN 1 ELSE 0 END) AS active
            FROM pg_stat_activity
            WHERE datname = current_database()
        """)
        total, idle, active = cursor.fetchone()
        print(f"\n📊 Connection Stats ({db_name}):")
        print(f"  Total: {total}  |  Idle: {idle}  |  Active: {active}")

        cursor.execute("SELECT count(*) FROM users")
        print(f"\n👥 Rows: users = {cursor.fetchone()[0]:,}")

        cursor.close()
        conn.close()
        return True

    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False


def main():
    print(f"\n{'='*60}")
    print(f"🧪 DATABASE CONNECTION TEST")
    print(f"{'='*60}")

    ok = test_connection(DATABASE_URL, LABEL)

    print(f"\n{'='*60}")
    print(f"📊 SUMMARY")
    print(f"{'='*60}")
    print(f"{'✅' if ok else '❌'} {LABEL}: {'WORKING' if ok else 'FAILED'}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
