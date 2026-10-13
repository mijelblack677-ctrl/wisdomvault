#!/usr/bin/env python3
"""
Wisdom Vault - 7-Day Database Cleanup Tool
Safe cleanup of:
  1. Unverified users (7+ days old, payment_status='pending')
  2. Notifications (7+ days old)
  3. Earn/Watch & Earn content (7+ days old)
"""

import sys
import os
from datetime import datetime, timedelta, timezone
import psycopg2
import psycopg2.extras

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db_config import get_db_connection, Colors, print_success, print_error, print_warning, print_info, print_header, input_prompt, input_confirm

# ── Configuration ─────────────────────────────────────────────────────────────
CLEANUP_DAYS = 7
CUTOFF = datetime.now(timezone.utc) - timedelta(days=CLEANUP_DAYS)

# Additional tables that may need cleanup
EXTRA_TABLES = ['user_sessions']

# ── TABLES TO DELETE OLD DATA FROM ────────────────────────────────────────────
OLD_NOTIFICATIONS_TABLE = 'notifications'
OLD_NOTIFICATIONS_COLUMN = 'created_at'

OLD_EARN_CONTENT_TABLE = 'earn_content'
OLD_EARN_CONTENT_COLUMN = 'created_at'

# ── TABLES TO CLEAN UP PER USER ON DELETE ────────────────────────────────────
USER_DEPENDENT_TABLES = [
    ('course_progress', 'user_id'),
    ('user_sponsored_views', 'user_id'),
    ('user_content_purchases', 'user_id'),
    ('user_premium_packs', 'user_id'),
    ('course_purchases', 'user_id'),
    ('notifications', 'user_id'),
    ('referral_earnings', 'user_id'),
    ('fee_chunks', 'user_id'),
    ('payment_proofs', 'user_id'),
    ('audit_logs', 'user_id'),
    ('earn_content_views', 'user_id'),
    ('password_reset_tokens', 'user_id'),
]


def get_db_tables():
    """Get list of existing public tables."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
        return [row[0] for row in cursor.fetchall()]
    finally:
        cursor.close()
        conn.close()


def check_7day_counts():
    """Count records that would be affected by 7-day cleanup."""
    print_header("🔍 7-DAY CLEANUP PREVIEW")

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    try:
        # ── 1. Unverified users 7+ days old ──
        cursor.execute("""
            SELECT
                COUNT(*) as total_unverified,
                COUNT(*) FILTER (WHERE created_at < %s) as older_than_7days
            FROM users
            WHERE payment_status = 'pending'
              AND is_active = true
        """, (CUTOFF,))
        user_stats = cursor.fetchone()

        print(f"{Colors.BOLD}1. UNVERIFIED USERS (payment_status='pending'):{Colors.END}")
        print(f"   Total unverified:     {user_stats['total_unverified'] or 0}")
        print(f"   Older than {CLEANUP_DAYS} days:     {Colors.RED}{user_stats['older_than_7days'] or 0}{Colors.END}")
        print(f"   Newer than {CLEANUP_DAYS} days (kept): {user_stats['total_unverified'] - (user_stats['older_than_7days'] or 0)}")

        # ── 2. Old notifications ──
        cursor.execute("""
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE created_at < %s) as older_than_7days
            FROM notifications
        """, (CUTOFF,))
        notif_stats = cursor.fetchone()

        print(f"\n{Colors.BOLD}2. NOTIFICATIONS (7+ days old):{Colors.END}")
        print(f"   Total notifications:  {notif_stats['total'] or 0}")
        print(f"   Older than {CLEANUP_DAYS} days:  {Colors.YELLOW}{notif_stats['older_than_7days'] or 0}{Colors.END}")
        print(f"   Newer than {CLEANUP_DAYS} days (kept): {notif_stats['total'] - (notif_stats['older_than_7days'] or 0)}")

        # ── 3. Old earn content ──
        cursor.execute("""
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE created_at < %s) as older_than_7days
            FROM earn_content
        """, (CUTOFF,))
        earn_stats = cursor.fetchone()

        print(f"\n{Colors.BOLD}3. EARN / WATCH & EARN CONTENT (7+ days old):{Colors.END}")
        print(f"   Total earn content:   {earn_stats['total'] or 0}")
        print(f"   Older than {CLEANUP_DAYS} days:   {Colors.YELLOW}{earn_stats['older_than_7days'] or 0}{Colors.END}")
        print(f"   Newer than {CLEANUP_DAYS} days (kept): {earn_stats['total'] - (earn_stats['older_than_7days'] or 0)}")

        total_to_clean = (user_stats['older_than_7days'] or 0) + (notif_stats['older_than_7days'] or 0) + (earn_stats['older_than_7days'] or 0)
        print(f"\n{Colors.BOLD}{Colors.CYAN}────────────────────────────────────────{Colors.END}")
        print(f"{Colors.BOLD}TOTAL RECORDS TO CLEAN UP:{Colors.END} {Colors.RED if total_to_clean > 0 else Colors.GREEN}{total_to_clean}{Colors.END}")
        print(f"{Colors.BOLD}Cutoff date:{Colors.END} {CUTOFF.strftime('%Y-%m-%d %H:%M:%S UTC')}")

        return {
            'unverified_users': user_stats['older_than_7days'] or 0,
            'old_notifications': notif_stats['older_than_7days'] or 0,
            'old_earn_content': earn_stats['older_than_7days'] or 0,
        }

    finally:
        cursor.close()
        conn.close()


def perform_cleanup(confirm=True):
    """Execute the 7-day cleanup."""
    print_header("🧹 7-DAY DATABASE CLEANUP")

    existing_tables = get_db_tables()
    cutoff_str = CUTOFF.strftime('%Y-%m-%d %H:%M:%S')

    print(f"{Colors.BOLD}Cleanup cutoff:{Colors.END} {cutoff_str} UTC ({CLEANUP_DAYS} days ago)")
    print(f"{Colors.BOLD}Target tables:{Colors.END}")
    print(f"  • users (unverified, {CLEANUP_DAYS}+ days old)")
    print(f"  • notifications ({CLEANUP_DAYS}+ days old)")
    print(f"  • earn_content ({CLEANUP_DAYS}+ days old)")
    print()

    # ── STAGE 1: Delete old notifications ──
    print(f"{Colors.BOLD}{Colors.CYAN}[STAGE 1] Deleting old notifications...{Colors.END}")

    if OLD_NOTIFICATIONS_TABLE in existing_tables:
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(f"""
                DELETE FROM {OLD_NOTIFICATIONS_TABLE}
                WHERE {OLD_NOTIFICATIONS_COLUMN} < %s
            """, (CUTOFF,))
            deleted = cursor.rowcount
            conn.commit()
            print_success(f"  Deleted {Colors.RED}{deleted}{Colors.END} old notifications ({CLEANUP_DAYS}+ days)")
        except Exception as e:
            print_error(f"  Failed to delete notifications: {e}")
            conn.rollback()
        finally:
            cursor.close()
            conn.close()
    else:
        print_info(f"  Skipped: '{OLD_NOTIFICATIONS_TABLE}' table not found")

    # ── STAGE 2: Delete old earn content ──
    print(f"\n{Colors.BOLD}{Colors.CYAN}[STAGE 2] Deleting old earn/watch content...{Colors.END}")

    if OLD_EARN_CONTENT_TABLE in existing_tables:
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(f"""
                DELETE FROM {OLD_EARN_CONTENT_TABLE}
                WHERE {OLD_EARN_CONTENT_COLUMN} < %s
            """, (CUTOFF,))
            deleted = cursor.rowcount
            conn.commit()
            print_success(f"  Deleted {Colors.RED}{deleted}{Colors.END} old earn content ({CLEANUP_DAYS}+ days)")
        except Exception as e:
            print_error(f"  Failed to delete earn content: {e}")
            conn.rollback()
        finally:
            cursor.close()
            conn.close()
    else:
        print_info(f"  Skipped: '{OLD_EARN_CONTENT_TABLE}' table not found")

    # ── STAGE 3: Delete unverified users (7+ days old) ──
    print(f"\n{Colors.BOLD}{Colors.CYAN}[STAGE 3] Deleting unverified users ({CLEANUP_DAYS}+ days old)...{Colors.END}")

    # List users to delete first
    list_conn = get_db_connection()
    list_cursor = list_conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        list_cursor.execute("""
            SELECT
                u.id, u.full_name, u.email, u.phone,
                u.referral_code, u.referred_by,
                u.created_at,
                COUNT(r.id) as referral_count
            FROM users u
            LEFT JOIN referrals r ON r.referrer_id = u.id
            WHERE u.payment_status = 'pending'
              AND u.is_active = true
              AND u.created_at < %s
            GROUP BY u.id, u.full_name, u.email, u.phone,
                     u.referral_code, u.referred_by, u.created_at
            ORDER BY u.created_at ASC
        """, (CUTOFF,))
        to_delete = list_cursor.fetchall()
    finally:
        list_cursor.close()
        list_conn.close()

    if not to_delete:
        print_success(f"  No unverified users older than {CLEANUP_DAYS} days found!")
    else:
        print(f"\n{Colors.RED}⚠️  Users to be DELETED ({len(to_delete)}):{Colors.END}\n")

        table_data = []
        for u in to_delete:
            delta = datetime.now(timezone.utc) - u['created_at']
            table_data.append([
                u['full_name'] or 'N/A',
                u['email'] or 'N/A',
                u['phone'] or 'N/A',
                u['created_at'].strftime('%Y-%m-%d') if u['created_at'] else 'N/A',
                delta.days,
                u['referral_count'] or 0,
            ])
        headers = ['Name', 'Email', 'Phone', 'Joined', 'Days Old', 'Referrals']
        from db_config import display_table
        display_table(table_data, headers)

        # Build the list of user-dependent tables that actually exist
        user_tables_to_delete = []
        for table, column in USER_DEPENDENT_TABLES:
            if table in existing_tables:
                user_tables_to_delete.append((table, column))
            else:
                print_info(f"  Skipping '{table}' (doesn't exist)")

        # Add extra tables that may have FK constraints
        for t in EXTRA_TABLES:
            if t in existing_tables:
                user_tables_to_delete.append((t, 'user_id'))

        if not confirm or input_confirm(f"\nDelete all {len(to_delete)} unverified users and their data?"):
            deleted_count = 0
            failed_count = 0
            failed_users = []

            for idx, u in enumerate(to_delete, 1):
                del_conn = None
                del_cursor = None
                try:
                    del_conn = get_db_connection()
                    del_conn.autocommit = False
                    del_cursor = del_conn.cursor()

                    uid = u['id']

                    # Delete from dependent tables
                    for table, column in user_tables_to_delete:
                        try:
                            del_cursor.execute(f"DELETE FROM {table} WHERE {column} = %s", (uid,))
                        except Exception as e:
                            # Log but continue (table might not exist or different structure)
                            pass

                    # Delete transactions via wallet
                    try:
                        del_cursor.execute("""
                            DELETE FROM transactions
                            WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = %s)
                        """, (uid,))
                    except Exception:
                        pass

                    # Delete withdrawals via wallet
                    try:
                        del_cursor.execute("""
                            DELETE FROM withdrawals
                            WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = %s)
                        """, (uid,))
                    except Exception:
                        pass

                    # Delete referrals (as referrer OR referred)
                    try:
                        del_cursor.execute(
                            "DELETE FROM referrals WHERE referrer_id = %s OR referred_id = %s",
                            (uid, uid)
                        )
                    except Exception:
                        pass

                    # Delete wallet
                    try:
                        del_cursor.execute("DELETE FROM wallets WHERE user_id = %s", (uid,))
                    except Exception:
                        pass

                    # Delete the user
                    del_cursor.execute("DELETE FROM users WHERE id = %s", (uid,))
                    del_conn.commit()
                    deleted_count += 1

                    print_success(f"  [{idx}/{len(to_delete)}] Deleted: {u['full_name']} ({u['email']})")

                except Exception as e:
                    if del_conn:
                        try:
                            del_conn.rollback()
                        except:
                            pass
                    failed_count += 1
                    failed_users.append(f"{u['full_name']} ({u['email']})")
                    print_error(f"  [{idx}/{len(to_delete)}] Failed: {u['full_name']} — {e}")
                finally:
                    if del_cursor:
                        try:
                            del_cursor.close()
                        except:
                            pass
                    if del_conn:
                        try:
                            del_conn.close()
                        except:
                            pass

            print(f"\n{Colors.BOLD}{'='*60}{Colors.END}")
            print(f"{Colors.BOLD}CLEANUP SUMMARY{Colors.END}")
            print(f"  ✅ Users deleted:    {Colors.GREEN}{deleted_count}{Colors.END}")
            print(f"  ❌ Users failed:     {Colors.RED}{failed_count}{Colors.END}")
            if failed_users:
                print(f"\n  Failed users:")
                for fu in failed_users[:10]:
                    print(f"    - {fu}")
            print(f"{'='*60}")

    print(f"\n{Colors.GREEN}✅ 7-Day cleanup complete!{Colors.END}")
    print()


if __name__ == '__main__':
    # Auto-confirm when running from cron (no TTY)
    try:
        is_cron = not os.isatty(sys.stdin.fileno())
    except (AttributeError, OSError):
        is_cron = True
    
    # Check counts first
    counts = check_7day_counts()
    
    if counts['unverified_users'] == 0 and counts['old_notifications'] == 0 and counts['old_earn_content'] == 0:
        print_success("Nothing to clean up!")
        sys.exit(0)
    
    perform_cleanup(confirm=not is_cron)
