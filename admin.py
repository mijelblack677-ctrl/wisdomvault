#!/usr/bin/env python3
"""
Wisdom Vault Ultimate Admin Tool - Complete Version
All functions defined - No missing references
"""

import os
import sys
import json
import re
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
from tabulate import tabulate
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db_config import (
    get_db_connection, Colors, print_success, print_error, print_warning,
    print_info, print_header, clear_screen, input_prompt, input_confirm,
    display_table
)

# ============================================================
# USER LOOKUP - FIXED
# ============================================================

def find_user(identifier):
    """Find a user by email, phone, referral_code, or id"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # First try exact matches for email, phone, referral_code
        cursor.execute("""
            SELECT 
                u.id, u.full_name, u.email, u.phone, 
                u.referral_code, u.referred_by,
                u.payment_status, u.is_active,
                u.registration_year, u.renewal_due_date,
                u.is_founding_member, u.founding_member_number,
                u.total_gross_earnings, u.total_fees_paid, 
                u.total_net_earnings, u.fee_chunks_count,
                u.created_at, u.updated_at,
                w.balance_available, w.store_credit, 
                w.gross_earnings, w.total_withdrawn, w.fees_paid
            FROM users u
            LEFT JOIN wallets w ON w.user_id = u.id
            WHERE u.email = %s 
               OR u.phone = %s 
               OR u.referral_code = %s
        """, (identifier, identifier, identifier))
        user = cursor.fetchone()
        
        if not user:
            # Try partial match on email, phone, or name
            cursor.execute("""
                SELECT 
                    u.id, u.full_name, u.email, u.phone, 
                    u.referral_code, u.referred_by,
                    u.payment_status, u.is_active,
                    u.registration_year, u.renewal_due_date,
                    u.is_founding_member, u.founding_member_number,
                    u.total_gross_earnings, u.total_fees_paid, 
                    u.total_net_earnings, u.fee_chunks_count,
                    u.created_at, u.updated_at,
                    w.balance_available, w.store_credit, 
                    w.gross_earnings, w.total_withdrawn, w.fees_paid
                FROM users u
                LEFT JOIN wallets w ON w.user_id = u.id
                WHERE u.email ILIKE %s 
                   OR u.phone ILIKE %s
                   OR u.full_name ILIKE %s
            """, (f'%{identifier}%', f'%{identifier}%', f'%{identifier}%'))
            user = cursor.fetchone()
        
        # If still not found, try checking if it's a UUID (for ID lookup)
        if not user:
            uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
            if uuid_pattern.match(identifier):
                cursor.execute("""
                    SELECT 
                        u.id, u.full_name, u.email, u.phone, 
                        u.referral_code, u.referred_by,
                        u.payment_status, u.is_active,
                        u.registration_year, u.renewal_due_date,
                        u.is_founding_member, u.founding_member_number,
                        u.total_gross_earnings, u.total_fees_paid, 
                        u.total_net_earnings, u.fee_chunks_count,
                        u.created_at, u.updated_at,
                        w.balance_available, w.store_credit, 
                        w.gross_earnings, w.total_withdrawn, w.fees_paid
                    FROM users u
                    LEFT JOIN wallets w ON w.user_id = u.id
                    WHERE u.id = %s
                """, (identifier,))
                user = cursor.fetchone()
        
        return dict(user) if user else None
    finally:
        cursor.close()
        conn.close()

def get_all_users(limit=50, status=None):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        query = """
            SELECT 
                u.id, u.full_name, u.email, u.phone, 
                u.referral_code, u.payment_status, u.is_active,
                w.balance_available, w.store_credit,
                u.created_at
            FROM users u
            LEFT JOIN wallets w ON w.user_id = u.id
        """
        params = []
        
        if status:
            query += " WHERE u.payment_status = %s"
            params.append(status)
        
        query += " ORDER BY u.created_at DESC LIMIT %s"
        params.append(limit)
        
        cursor.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]
    finally:
        cursor.close()
        conn.close()

# ============================================================
# USER MANAGEMENT FUNCTIONS
# ============================================================

def list_users_interactive():
    clear_screen()
    print_header("👥 USER LIST")
    
    users = get_all_users(50)
    
    if not users:
        print_info("No users found")
        input("\nPress Enter to continue...")
        return
    
    table_data = []
    for u in users:
        table_data.append([
            u.get('full_name', 'N/A')[:25],
            u.get('email', 'N/A')[:25],
            u.get('phone', 'N/A'),
            u.get('referral_code', 'N/A'),
            u.get('payment_status', 'pending'),
            f"MWK {float(u.get('balance_available', 0)):,.0f}",
            '✅' if u.get('is_active') else '❌'
        ])
    
    headers = ['Name', 'Email', 'Phone', 'Ref Code', 'Status', 'Balance', 'Active']
    display_table(table_data, headers, f"Total: {len(users)} users")
    
    print("\nOptions:")
    print("  1. Select a user to manage")
    print("  0. Back")
    
    choice = input(f"{Colors.BOLD}Choice: {Colors.END}").strip()
    if choice == '1':
        identifier = input_prompt("Enter user email/phone/ref code")
        if identifier:
            user = find_user(identifier)
            if user:
                manage_user_menu(user)

def find_user_interactive():
    clear_screen()
    print_header("🔍 FIND USER")
    
    identifier = input_prompt("Enter email, phone, referral code, or name")
    if not identifier:
        return
    
    user = find_user(identifier)
    if user:
        manage_user_menu(user)
    else:
        print_error(f"User not found: {identifier}")
        input("\nPress Enter to continue...")

def manage_user_menu(user):
    while True:
        clear_screen()
        print_header(f"👤 MANAGE USER: {user.get('full_name', 'Unknown')}")
        
        print(f"{Colors.BOLD}ID:{Colors.END} {user.get('id', 'N/A')}")
        print(f"{Colors.BOLD}Email:{Colors.END} {user.get('email', 'N/A')}")
        print(f"{Colors.BOLD}Phone:{Colors.END} {user.get('phone', 'N/A')}")
        print(f"{Colors.BOLD}Status:{Colors.END} {user.get('payment_status', 'pending')}")
        print(f"{Colors.BOLD}Active:{Colors.END} {'✅' if user.get('is_active') else '❌'}")
        print(f"{Colors.BOLD}Balance Available:{Colors.END} MWK {float(user.get('balance_available', 0)):,.2f}")
        print(f"{Colors.BOLD}Store Credit:{Colors.END} MWK {float(user.get('store_credit', 0)):,.2f}")
        print(f"{Colors.BOLD}Gross Earnings:{Colors.END} MWK {float(user.get('gross_earnings', 0)):,.2f}")
        print(f"{Colors.BOLD}Total Withdrawn:{Colors.END} MWK {float(user.get('total_withdrawn', 0)):,.2f}")
        print(f"{Colors.BOLD}Referral Code:{Colors.END} {user.get('referral_code', 'N/A')}")
        
        print(f"\n{Colors.BOLD}Actions:{Colors.END}")
        print("  1.  Add Funds (balance_available)")
        print("  2.  Add Store Credit")
        print("  3.  View Wallet")
        print("  4.  View Transactions")
        print("  5.  View Referrals")
        print("  6.  Verify User")
        print("  7.  Unverify User")
        print("  8.  Toggle Active/Inactive")
        print("  9.  Send Notification")
        print("  0.  Back")
        
        choice = input(f"{Colors.BOLD}Choice: {Colors.END}").strip()
        
        if choice == '0':
            break
        elif choice == '1':
            add_funds_to_user(user['id'])
            user = find_user(user['email'])
        elif choice == '2':
            add_store_credit_to_user(user['id'])
            user = find_user(user['email'])
        elif choice == '3':
            view_user_wallet(user['id'])
        elif choice == '4':
            view_user_transactions(user['id'])
        elif choice == '5':
            view_user_referrals(user['id'])
        elif choice == '6':
            verify_user_by_id(user['id'])
            user = find_user(user['email'])
        elif choice == '7':
            unverify_user_by_id(user['id'])
            user = find_user(user['email'])
        elif choice == '8':
            toggle_user_active_by_id(user['id'])
            user = find_user(user['email'])
        elif choice == '9':
            send_notification_to_user(user['id'])

def create_user_interactive():
    clear_screen()
    print_header("➕ CREATE NEW USER")
    
    full_name = input_prompt("Full Name")
    if not full_name:
        return
    
    email = input_prompt("Email")
    if not email:
        return
    
    phone = input_prompt("Phone Number")
    if not phone:
        return
    
    password = input_prompt("Password")
    if not password:
        return
    
    referral_code = input_prompt("Referral Code (auto-generate if empty)")
    if not referral_code:
        import random
        import string
        referral_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    confirm = input_confirm(f"Create user: {full_name} ({email})?")
    if not confirm:
        return
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Create user
        cursor.execute("""
            INSERT INTO users (
                full_name, email, phone, password_hash, referral_code,
                payment_status, is_active, registration_year, renewal_due_date,
                created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            RETURNING id
        """, (full_name, email, phone, password, referral_code, 
              'pending', True, datetime.now().year, 
              datetime.now() + timedelta(days=365)))
        
        user_id = cursor.fetchone()[0]
        
        # Create wallet
        cursor.execute("""
            INSERT INTO wallets (user_id, balance_available, store_credit, gross_earnings, total_withdrawn, updated_at)
            VALUES (%s, 0, 0, 0, 0, NOW())
        """, (user_id,))
        
        conn.commit()
        print_success(f"User created! ID: {user_id}")
        print_info(f"Referral Code: {referral_code}")
        
    except Exception as e:
        conn.rollback()
        print_error(f"Failed: {e}")
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

# ============================================================
# WALLET & FINANCIAL FUNCTIONS
# ============================================================

def add_funds_to_user(user_id):
    clear_screen()
    print_header("💰 ADD FUNDS TO WALLET")
    
    amount = input_prompt("Amount (MWK)")
    if not amount:
        return
    
    try:
        amount = float(amount)
    except:
        print_error("Invalid amount")
        return
    
    description = input_prompt("Description", "Admin adjustment")
    
    if not input_confirm(f"Add MWK {amount:,.2f}?"):
        return
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE wallets 
            SET balance_available = balance_available + %s,
                gross_earnings = gross_earnings + %s,
                updated_at = NOW()
            WHERE user_id = %s
            RETURNING balance_available
        """, (amount, amount, user_id))
        
        new_balance = cursor.fetchone()[0]
        conn.commit()
        print_success(f"Added MWK {amount:,.2f}. New balance: MWK {float(new_balance):,.2f}")
        
    except Exception as e:
        conn.rollback()
        print_error(f"Failed: {e}")
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

def add_store_credit_to_user(user_id):
    clear_screen()
    print_header("📚 ADD STORE CREDIT")
    
    amount = input_prompt("Amount (MWK)")
    if not amount:
        return
    
    try:
        amount = float(amount)
    except:
        print_error("Invalid amount")
        return
    
    description = input_prompt("Description", "Admin adjustment")
    
    if not input_confirm(f"Add MWK {amount:,.2f} store credit?"):
        return
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE wallets 
            SET store_credit = store_credit + %s,
                updated_at = NOW()
            WHERE user_id = %s
            RETURNING store_credit
        """, (amount, user_id))
        
        new_credit = cursor.fetchone()[0]
        conn.commit()
        print_success(f"Added MWK {amount:,.2f} store credit. New store credit: MWK {float(new_credit):,.2f}")
        
    except Exception as e:
        conn.rollback()
        print_error(f"Failed: {e}")
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

def add_funds_interactive():
    identifier = input_prompt("User email/phone")
    if not identifier:
        return
    user = find_user(identifier)
    if user:
        add_funds_to_user(user['id'])

def add_store_credit_interactive():
    identifier = input_prompt("User email/phone")
    if not identifier:
        return
    user = find_user(identifier)
    if user:
        add_store_credit_to_user(user['id'])

def view_wallet_interactive():
    identifier = input_prompt("User email/phone")
    if not identifier:
        return
    user = find_user(identifier)
    if user:
        view_user_wallet(user['id'])

def view_user_wallet(user_id):
    clear_screen()
    print_header("💳 USER WALLET")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT * FROM wallets WHERE user_id = %s
        """, (user_id,))
        wallet = cursor.fetchone()
        
        if not wallet:
            print_error("Wallet not found")
        else:
            print(f"{Colors.BOLD}Balance Available:{Colors.END} MWK {float(wallet['balance_available'] or 0):,.2f}")
            print(f"{Colors.BOLD}Store Credit:{Colors.END} MWK {float(wallet['store_credit'] or 0):,.2f}")
            print(f"{Colors.BOLD}Gross Earnings:{Colors.END} MWK {float(wallet['gross_earnings'] or 0):,.2f}")
            print(f"{Colors.BOLD}Total Withdrawn:{Colors.END} MWK {float(wallet['total_withdrawn'] or 0):,.2f}")
            print(f"{Colors.BOLD}Fees Paid:{Colors.END} MWK {float(wallet['fees_paid'] or 0):,.2f}")
        
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")
def view_referral_tree(identifier):
    """View complete referral tree for a user (upline and downline)"""
    clear_screen()
    
    user = find_user(identifier)
    if not user:
        print_error(f"User not found: {identifier}")
        input("\nPress Enter to continue...")
        return
    
    print_header(f"🌳 REFERRAL TREE: {user.get('full_name', 'Unknown')}")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # ============================================================
        # 1. UPLINE (Who referred this user)
        # ============================================================
        print(f"{Colors.BOLD}{Colors.CYAN}⬆️  UPLINE (Who referred {user['full_name']}){Colors.END}\n")
        
        if user.get('referred_by'):
            cursor.execute("""
                SELECT 
                    u.id, u.full_name, u.email, u.phone,
                    u.referral_code, u.payment_status,
                    u.created_at,
                    w.balance_available, w.store_credit
                FROM users u
                LEFT JOIN wallets w ON w.user_id = u.id
                WHERE u.id = %s
            """, (user['referred_by'],))
            upline = cursor.fetchone()
            
            if upline:
                print(f"  {Colors.BOLD}Direct Upline:{Colors.END}")
                print(f"    Name: {upline['full_name']}")
                print(f"    Email: {upline['email']}")
                print(f"    Phone: {upline['phone']}")
                print(f"    Referral Code: {upline['referral_code']}")
                print(f"    Status: {upline['payment_status']}")
                print(f"    Balance: MWK {float(upline['balance_available'] or 0):,.2f}")
                print(f"    Store Credit: MWK {float(upline['store_credit'] or 0):,.2f}")
                
                # Check if upline has an upline (second level)
                if upline.get('referred_by'):
                    cursor.execute("""
                        SELECT full_name, email, referral_code 
                        FROM users 
                        WHERE id = %s
                    """, (upline['referred_by'],))
                    second_upline = cursor.fetchone()
                    if second_upline:
                        print(f"\n  {Colors.BOLD}Second Level Upline:{Colors.END}")
                        print(f"    Name: {second_upline['full_name']}")
                        print(f"    Email: {second_upline['email']}")
                        print(f"    Referral Code: {second_upline['referral_code']}")
            else:
                print_info("No upline found")
        else:
            print_info("This user was not referred by anyone (root user)")
        
        # ============================================================
        # 2. DOWNLINE (Who this user referred)
        # ============================================================
        print(f"\n{Colors.BOLD}{Colors.CYAN}⬇️  DOWNLINE (People {user['full_name']} referred){Colors.END}\n")
        
        cursor.execute("""
            SELECT 
                u.id, u.full_name, u.email, u.phone,
                u.referral_code, u.payment_status,
                u.created_at,
                w.balance_available, w.store_credit
            FROM users u
            LEFT JOIN wallets w ON w.user_id = u.id
            WHERE u.referred_by = %s
            ORDER BY u.created_at DESC
        """, (user['id'],))
        
        downline = cursor.fetchall()
        
        if downline:
            print(f"  {Colors.BOLD}Total Direct Referrals: {len(downline)}{Colors.END}\n")
            
            table_data = []
            for d in downline:
                # Check if they have referrals (second level)
                cursor.execute("""
                    SELECT COUNT(*) as count FROM users WHERE referred_by = %s
                """, (d['id'],))
                second_level_count = cursor.fetchone()['count'] or 0
                
                table_data.append([
                    d['full_name'] or 'N/A',
                    d['email'] or 'N/A',
                    d['phone'] or 'N/A',
                    d['payment_status'] or 'pending',
                    d['created_at'].strftime('%Y-%m-%d') if d['created_at'] else 'N/A',
                    f"MWK {float(d['balance_available'] or 0):,.0f}",
                    second_level_count
                ])
            
            headers = ['Name', 'Email', 'Phone', 'Status', 'Joined', 'Balance', 'Their Referrals']
            display_table(table_data, headers)
            
            # Show second level downline
            print(f"\n  {Colors.BOLD}Second Level Downline (People referred by your referrals){Colors.END}\n")
            
            cursor.execute("""
                SELECT 
                    u1.full_name as referrer,
                    u2.full_name as referred,
                    u2.email as referred_email,
                    u2.payment_status,
                    u2.created_at
                FROM users u1
                JOIN users u2 ON u2.referred_by = u1.id
                WHERE u1.referred_by = %s
                ORDER BY u2.created_at DESC
                LIMIT 20
            """, (user['id'],))
            
            second_level = cursor.fetchall()
            
            if second_level:
                table_data = []
                for s in second_level:
                    table_data.append([
                        s['referrer'] or 'N/A',
                        s['referred'] or 'N/A',
                        s['referred_email'] or 'N/A',
                        s['payment_status'] or 'pending',
                        s['created_at'].strftime('%Y-%m-%d') if s['created_at'] else 'N/A'
                    ])
                
                headers = ['Referrer', 'Referred', 'Email', 'Status', 'Joined']
                display_table(table_data, headers)
            else:
                print_info("No second level referrals yet")
        else:
            print_info("This user has not referred anyone yet")
        
        # ============================================================
        # 3. TREE VISUALIZATION
        # ============================================================
        print(f"\n{Colors.BOLD}{Colors.CYAN}🌳 TREE VISUALIZATION{Colors.END}\n")
        
        # Get the root of the tree
        cursor.execute("""
            WITH RECURSIVE referral_tree AS (
                -- Base case: start from this user
                SELECT 
                    id, full_name, referred_by, 0 as level,
                    ARRAY[id] as path
                FROM users
                WHERE id = %s
                
                UNION ALL
                
                -- Recursive: get all upline (who referred them)
                SELECT 
                    u.id, u.full_name, u.referred_by, 
                    rt.level - 1 as level,
                    u.id || rt.path as path
                FROM users u
                JOIN referral_tree rt ON u.id = rt.referred_by
                WHERE u.referred_by IS NOT NULL
            )
            SELECT 
                id, full_name, level,
                REPEAT('  ', ABS(level)) || '└─ ' || full_name as tree_line
            FROM referral_tree
            ORDER BY level
        """, (user['id'],))
        
        upline_tree = cursor.fetchall()
        
        if upline_tree:
            print(f"{Colors.BOLD}Upline Tree:{Colors.END}")
            for u in upline_tree:
                indent = "  " * (abs(u['level']) + 1)
                level_label = f"(Level {abs(u['level'])})" if u['level'] != 0 else "(You)"
                print(f"  {indent}├─ {u['full_name']} {Colors.DIM}{level_label}{Colors.END}")
        
        # Get downline tree
        cursor.execute("""
            WITH RECURSIVE referral_tree AS (
                -- Base case: start from this user
                SELECT 
                    id, full_name, 0 as level,
                    ARRAY[id] as path
                FROM users
                WHERE id = %s
                
                UNION ALL
                
                -- Recursive: get all downline (who they referred)
                SELECT 
                    u.id, u.full_name, 
                    rt.level + 1 as level,
                    rt.path || u.id as path
                FROM users u
                JOIN referral_tree rt ON u.referred_by = rt.id
            )
            SELECT 
                id, full_name, level,
                REPEAT('  ', level) || '└─ ' || full_name as tree_line
            FROM referral_tree
            WHERE level > 0
            ORDER BY level, full_name
        """, (user['id'],))
        
        downline_tree = cursor.fetchall()
        
        if downline_tree:
            print(f"\n{Colors.BOLD}Downline Tree:{Colors.END}")
            for d in downline_tree:
                indent = "  " * (d['level'])
                level_label = f"(Level {d['level']})"
                print(f"  {indent}├─ {d['full_name']} {Colors.DIM}{level_label}{Colors.END}")
        
        print(f"\n{Colors.DIM}Press Enter to continue...{Colors.END}")
        
    finally:
        cursor.close()
        conn.close()
    
    input()
def delete_unverified_users():
    """Delete users who are 3+ days old and still unverified"""
    clear_screen()
    print_header("🗑️ DELETE UNVERIFIED USERS")
    
    # First, get the list of users to delete using a separate connection
    list_conn = get_db_connection()
    list_cursor = list_conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Count unverified users older than 3 days
        list_cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN created_at < NOW() - INTERVAL '3 days' THEN 1 ELSE 0 END) as older_than_3days,
                SUM(CASE WHEN created_at >= NOW() - INTERVAL '3 days' THEN 1 ELSE 0 END) as newer_than_3days
            FROM users
            WHERE payment_status = 'pending'
              AND is_active = true
        """)
        stats = list_cursor.fetchone()
        
        print(f"{Colors.BOLD}📊 Unverified Users Summary:{Colors.END}")
        print(f"  Total unverified: {stats['total'] or 0}")
        print(f"  Newer than 3 days (keep): {stats['newer_than_3days'] or 0}")
        print(f"  Older than 3 days (delete): {Colors.RED}{stats['older_than_3days'] or 0}{Colors.END}")
        
        if stats['older_than_3days'] == 0:
            print_success("No unverified users older than 3 days to delete!")
            input("\nPress Enter to continue...")
            return
        
        # List users to be deleted
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
              AND u.created_at < NOW() - INTERVAL '3 days'
            GROUP BY u.id, u.full_name, u.email, u.phone, u.referral_code, u.referred_by, u.created_at
            ORDER BY u.created_at ASC
        """)
        to_delete = list_cursor.fetchall()
        
        print(f"\n{Colors.BOLD}{Colors.RED}⚠️  Users to be DELETED:{Colors.END}")
        print(f"{Colors.DIM}These users signed up 3+ days ago and never verified{Colors.END}\n")
        
        # Get current time with timezone awareness
        from datetime import timezone
        now_aware = datetime.now(timezone.utc)
        
        table_data = []
        for u in to_delete:
            days_old = 0
            if u['created_at']:
                delta = now_aware - u['created_at']
                days_old = delta.days
            
            table_data.append([
                u['full_name'] or 'N/A',
                u['email'] or 'N/A',
                u['phone'] or 'N/A',
                u['created_at'].strftime('%Y-%m-%d') if u['created_at'] else 'N/A',
                days_old,
                u['referral_count'] or 0
            ])
        
        headers = ['Name', 'Email', 'Phone', 'Joined', 'Days Old', 'Referrals']
        display_table(table_data, headers)
        
        print(f"\n{Colors.RED}⚠️  WARNING: This will PERMANENTLY delete {len(to_delete)} users!{Colors.END}")
        print(f"{Colors.RED}⚠️  This includes their wallets, referrals, and all data!{Colors.END}")
        
        if not input_confirm(f"\nDelete {len(to_delete)} unverified users (3+ days old)?"):
            print_info("Operation cancelled")
            input("\nPress Enter to continue...")
            return
        
        # Show what will be deleted
        print(f"\n{Colors.BOLD}What will be deleted per user:{Colors.END}")
        print("  - User account")
        print("  - Wallet")
        print("  - Transactions")
        print("  - Referrals (as referrer and referred)")
        print("  - Notifications")
        print("  - Course progress")
        print("  - Sponsored content views")
        print("  - Earn content views")
        print("  - Content purchases")
        print("  - Premium pack purchases")
        print("  - Withdrawals")
        print("  - Audit logs")
        print("  - Referral earnings")
        print("  - Fee chunks")
        print("  - Payment proofs")
        print("  - Password reset tokens")
        
        if not input_confirm("\nAre you absolutely sure?"):
            print_info("Operation cancelled")
            input("\nPress Enter to continue...")
            return
        
        # Close the list connection
        list_cursor.close()
        list_conn.close()
        
        # Get list of existing tables to avoid errors
        check_conn = get_db_connection()
        check_cursor = check_conn.cursor()
        try:
            check_cursor.execute("""
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
            """)
            existing_tables = [row[0] for row in check_cursor.fetchall()]
        finally:
            check_cursor.close()
            check_conn.close()
        
        # Define all tables that need to be cleaned up, in order
        # Only include tables that exist in the database
        table_definitions = [
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
        ]
        
        # Filter to only existing tables
        existing_tables_to_delete = [(table, col) for table, col in table_definitions if table in existing_tables]
        
        # Delete users - EACH IN ITS OWN CONNECTION
        deleted_count = 0
        failed_count = 0
        failed_users = []
        
        total_users = len(to_delete)
        for idx, u in enumerate(to_delete, 1):
            del_conn = None
            del_cursor = None
            
            try:
                del_conn = get_db_connection()
                del_conn.autocommit = False
                del_cursor = del_conn.cursor()
                
                # Show progress
                print(f"\n{Colors.DIM}[{idx}/{total_users}] Processing: {u['full_name']}...{Colors.END}")
                
                # Delete from all existing tables
                for table, column in existing_tables_to_delete:
                    try:
                        del_cursor.execute(f"DELETE FROM {table} WHERE {column} = %s", (u['id'],))
                    except Exception as e:
                        # Table might have different column name or other issue
                        pass
                
                # Delete transactions (via wallet)
                try:
                    del_cursor.execute("""
                        DELETE FROM transactions 
                        WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = %s)
                    """, (u['id'],))
                except Exception:
                    pass
                
                # Delete withdrawals (via wallet)
                try:
                    del_cursor.execute("""
                        DELETE FROM withdrawals 
                        WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = %s)
                    """, (u['id'],))
                except Exception:
                    pass
                
                # Delete referrals (as referrer OR referred)
                try:
                    del_cursor.execute("DELETE FROM referrals WHERE referrer_id = %s OR referred_id = %s", (u['id'], u['id']))
                except Exception:
                    pass
                
                # Delete wallet
                try:
                    del_cursor.execute("DELETE FROM wallets WHERE user_id = %s", (u['id'],))
                except Exception:
                    pass
                
                # Delete from any additional tables that might exist
                additional_tables = ['earn_content_views', 'password_reset_tokens']
                for table in additional_tables:
                    if table in existing_tables:
                        try:
                            del_cursor.execute(f"DELETE FROM {table} WHERE user_id = %s", (u['id'],))
                        except Exception:
                            pass
                
                # Finally, delete the user
                try:
                    del_cursor.execute("DELETE FROM users WHERE id = %s", (u['id'],))
                except Exception as e:
                    print_error(f"Failed to delete user record: {e}")
                    del_conn.rollback()
                    raise
                
                # Commit the transaction
                del_conn.commit()
                deleted_count += 1
                print_success(f"Deleted: {u['full_name']} ({u['email']})")
                
            except Exception as e:
                if del_conn:
                    try:
                        del_conn.rollback()
                    except:
                        pass
                failed_count += 1
                failed_users.append(f"{u['full_name']} ({u['email']})")
                print_error(f"Failed to delete {u['full_name']}: {str(e)}")
            
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
        
        print(f"\n{'='*60}")
        print(f"{Colors.BOLD}📊 DELETE SUMMARY{Colors.END}")
        print(f"  ✅ Successfully deleted: {Colors.GREEN}{deleted_count}{Colors.END} users")
        print(f"  ❌ Failed: {Colors.RED}{failed_count}{Colors.END} users")
        
        if failed_users:
            print(f"\n{Colors.YELLOW}Failed users (first 10):{Colors.END}")
            for user in failed_users[:10]:
                print(f"  - {user}")
            if len(failed_users) > 10:
                print(f"  ... and {len(failed_users) - 10} more")
        print(f"{'='*60}")
        
    except Exception as e:
        print_error(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        try:
            list_cursor.close()
            list_conn.close()
        except:
            pass
    
    input("\nPress Enter to continue...")
def fix_missing_level2_bonuses(cursor, missing_referrals):
    """Fix missing Level 2 bonuses (called from diagnose function)"""
    level2_amount = 1000  # MWK 1,000 for Level 2
    
    fixed = 0
    for m in missing_referrals:
        try:
            # Check if this specific referral already exists
            cursor.execute("""
                SELECT id FROM referrals 
                WHERE referrer_id = %s AND referred_id = %s
                AND referral_type = 'second_level'
            """, (m['original_referrer'], m['level2_user']))
            
            if cursor.fetchone():
                continue  # Already exists
            
            # Add Level 2 referral
            cursor.execute("""
                INSERT INTO referrals (
                    referrer_id, referred_id, referral_type, registration_year,
                    bonus_amount, is_paid, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (m['original_referrer'], m['level2_user'], 'second_level', 
                  datetime.now().year, level2_amount, True, m['level2_date'] or datetime.now()))
            
            referral_id = cursor.fetchone()[0]
            
            # Add bonus to referrer's wallet
            cursor.execute("""
                UPDATE wallets 
                SET store_credit = store_credit + %s,
                    gross_earnings = gross_earnings + %s,
                    updated_at = NOW()
                WHERE user_id = %s
            """, (level2_amount, level2_amount, m['original_referrer']))
            
            # Create transaction record
            cursor.execute("""
                INSERT INTO transactions (
                    wallet_id, transaction_type, amount, 
                    balance_before, balance_after, description, created_at
                )
                SELECT 
                    w.id, 'referral_bonus', %s,
                    w.store_credit - %s, w.store_credit,
                    %s, NOW()
                FROM wallets w
                WHERE w.user_id = %s
            """, (level2_amount, level2_amount, f'Level 2 referral bonus for {m["level2_user"]}', m['original_referrer']))
            
            fixed += 1
            print_success(f"Fixed Level 2 bonus for {m['referrer']} → {m['level2_user']}")
            
        except Exception as e:
            print_error(f"Failed to fix referral: {e}")
    
    return fixed
def diagnose_referral_system():
    """Complete diagnostic for referral system - especially Level 2 bonuses"""
    clear_screen()
    print_header("🔍 REFERRAL SYSTEM DIAGNOSTIC")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        print(f"{Colors.BOLD}{Colors.CYAN}📊 REFERRAL OVERVIEW{Colors.END}\n")
        
        # 1. Total referrals by type
        cursor.execute("""
            SELECT 
                referral_type,
                COUNT(*) as count,
                SUM(CASE WHEN is_paid THEN 1 ELSE 0 END) as paid,
                SUM(bonus_amount) as total_bonus
            FROM referrals
            GROUP BY referral_type
            ORDER BY referral_type
        """)
        by_type = cursor.fetchall()
        
        if by_type:
            print(f"{Colors.BOLD}Referrals by Type:{Colors.END}")
            table_data = []
            for r in by_type:
                table_data.append([
                    r['referral_type'] or 'unknown',
                    r['count'],
                    r['paid'],
                    r['count'] - r['paid'],
                    f"MWK {float(r['total_bonus'] or 0):,.2f}"
                ])
            headers = ['Type', 'Total', 'Paid', 'Unpaid', 'Total Bonus']
            display_table(table_data, headers)
        else:
            print_info("No referrals found in the system")
        
        print("\n" + "="*70 + "\n")
        
        # 2. Check for Level 2 referrals specifically
        print(f"{Colors.BOLD}{Colors.CYAN}🎯 LEVEL 2 REFERRAL CHECK{Colors.END}\n")
        
        cursor.execute("""
            SELECT 
                r.id,
                u1.full_name as referrer,
                u1.email as referrer_email,
                u2.full_name as referred,
                u2.email as referred_email,
                r.referral_type,
                r.bonus_amount,
                r.is_paid,
                r.created_at,
                r.fee_deducted,
                r.net_amount
            FROM referrals r
            JOIN users u1 ON u1.id = r.referrer_id
            JOIN users u2 ON u2.id = r.referred_id
            WHERE r.referral_type = 'second_level'
               OR r.referral_type = '2'                OR r.referral_type = 'second_level'
            ORDER BY r.created_at DESC
        """)
        level2 = cursor.fetchall()
        
        if level2:
            print(f"{Colors.GREEN}✅ Found {len(level2)} Level 2 referrals{Colors.END}")
            table_data = []
            for r in level2:
                table_data.append([
                    r['referrer'][:20] if r['referrer'] else 'N/A',
                    r['referred'][:20] if r['referred'] else 'N/A',
                    r['referral_type'] or 'N/A',
                    f"MWK {float(r['bonus_amount'] or 0):,.0f}",
                    '✅' if r['is_paid'] else '⏳',
                    r['created_at'].strftime('%Y-%m-%d') if r['created_at'] else 'N/A'
                ])
            headers = ['Referrer', 'Referred', 'Type', 'Bonus', 'Paid', 'Date']
            display_table(table_data, headers)
        else:
            print_warning("No Level 2 referrals found in the system!")
            print_info("This could mean:")
            print("  1. No users have reached Level 2 yet")
            print("  2. Level 2 referrals are not being recorded")
            print("  3. The referral_type field is not being set correctly")
        
        print("\n" + "="*70 + "\n")
        
        # 3. Check referral chain depth
        print(f"{Colors.BOLD}{Colors.CYAN}🔗 REFERRAL CHAIN ANALYSIS{Colors.END}\n")
        
        cursor.execute("""
            SELECT 
                u.full_name,
                u.email,
                u.referral_code,
                COUNT(r1.id) as direct_referrals,
                COUNT(r2.id) as level2_referrals
            FROM users u
            LEFT JOIN referrals r1 ON r1.referrer_id = u.id AND r1.referral_type = 'first_level'
            LEFT JOIN referrals r2 ON r2.referrer_id = u.id AND r2.referral_type = 'second_level'
            GROUP BY u.id, u.full_name, u.email, u.referral_code
            HAVING COUNT(r1.id) > 0 OR COUNT(r2.id) > 0
            ORDER BY direct_referrals DESC, level2_referrals DESC
            LIMIT 20
        """)
        chain_data = cursor.fetchall()
        
        if chain_data:
            print(f"{Colors.BOLD}Top Referrers with Level 2 Counts:{Colors.END}")
            table_data = []
            for u in chain_data:
                table_data.append([
                    u['full_name'][:20] if u['full_name'] else 'N/A',
                    u['referral_code'] or 'N/A',
                    u['direct_referrals'] or 0,
                    u['level2_referrals'] or 0
                ])
            headers = ['User', 'Referral Code', 'Direct', 'Level 2']
            display_table(table_data, headers)
        else:
            print_info("No referral chains found")
        
        print("\n" + "="*70 + "\n")
        
        # 4. Check for missing Level 2 bonuses (users who should have them)
        print(f"{Colors.BOLD}{Colors.CYAN}⚠️  POTENTIAL MISSING LEVEL 2 BONUSES{Colors.END}\n")
        
        cursor.execute("""
            WITH direct_referrals AS (
                SELECT 
                    referrer_id,
                    referred_id,
                    created_at
                FROM referrals
                WHERE referral_type = 'first_level' OR referral_type IS NULL
            ),
            level2_potential AS (
                SELECT 
                    d1.referrer_id as original_referrer,
                    d2.referred_id as level2_user,
                    d2.created_at as level2_date
                FROM direct_referrals d1
                JOIN direct_referrals d2 ON d2.referrer_id = d1.referred_id
                WHERE NOT EXISTS (
                    SELECT 1 FROM referrals r
                    WHERE r.referrer_id = d1.referrer_id 
                    AND r.referred_id = d2.referred_id
                    AND r.referral_type = 'second_level'
                )
            )
            SELECT 
                u1.full_name as referrer,
                u1.email as referrer_email,
                u2.full_name as level2_user,
                u2.email as level2_email,
                lp.level2_date
            FROM level2_potential lp
            JOIN users u1 ON u1.id = lp.original_referrer
            JOIN users u2 ON u2.id = lp.level2_user
            ORDER BY lp.level2_date DESC
            LIMIT 20
        """)
        missing = cursor.fetchall()
        
        if missing:
            print_warning(f"Found {len(missing)} potential missing Level 2 bonuses!")
            print_info("These users referred someone who referred someone else,")
            print_info("but the Level 2 bonus hasn't been recorded yet.")
            print("")
            
            table_data = []
            for m in missing:
                table_data.append([
                    m['referrer'][:20] if m['referrer'] else 'N/A',
                    m['level2_user'][:20] if m['level2_user'] else 'N/A',
                    m['level2_date'].strftime('%Y-%m-%d') if m['level2_date'] else 'N/A'
                ])
            headers = ['Referrer', 'Level 2 User', 'Date']
            display_table(table_data, headers)
        else:
            print_success("No missing Level 2 bonuses detected!")
            print_info("All direct referrals that should have Level 2 bonuses appear to be recorded.")
        
        print("\n" + "="*70 + "\n")
        
        # 5. Referral bonus amounts
        print(f"{Colors.BOLD}{Colors.CYAN}💰 BONUS DISTRIBUTION{Colors.END}\n")
        
        cursor.execute("""
            SELECT 
                referral_type,
                COUNT(*) as count,
                AVG(bonus_amount) as avg_bonus,
                MIN(bonus_amount) as min_bonus,
                MAX(bonus_amount) as max_bonus
            FROM referrals
            GROUP BY referral_type
            ORDER BY referral_type
        """)
        bonus_stats = cursor.fetchall()
        
        if bonus_stats:
            table_data = []
            for b in bonus_stats:
                table_data.append([
                    b['referral_type'] or 'unknown',
                    b['count'],
                    f"MWK {float(b['avg_bonus'] or 0):,.0f}",
                    f"MWK {float(b['min_bonus'] or 0):,.0f}",
                    f"MWK {float(b['max_bonus'] or 0):,.0f}"
                ])
            headers = ['Type', 'Count', 'Average', 'Min', 'Max']
            display_table(table_data, headers, "Bonus Statistics by Type")
        
        print("\n" + "="*70 + "\n")
        
        # 6. Check for referral fee deductions
        print(f"{Colors.BOLD}{Colors.CYAN}💸 FEE DEDUCTIONS{Colors.END}\n")
        
        cursor.execute("""
            SELECT 
                COUNT(*) as total_with_fees,
                AVG(fee_deducted) as avg_fee,
                SUM(fee_deducted) as total_fees
            FROM referrals
            WHERE fee_deducted > 0
        """)
        fee_stats = cursor.fetchone()
        
        if fee_stats and fee_stats['total_with_fees'] > 0:
            print(f"  Referrals with fees: {fee_stats['total_with_fees']}")
            print(f"  Average fee: MWK {float(fee_stats['avg_fee'] or 0):,.2f}")
            print(f"  Total fees: MWK {float(fee_stats['total_fees'] or 0):,.2f}")
        else:
            print_info("No fees have been deducted from referrals yet")
        
        print("\n" + "="*70 + "\n")
        
        # 7. Recent referral activity
        print(f"{Colors.BOLD}{Colors.CYAN}📈 RECENT REFERRAL ACTIVITY (Last 30 days){Colors.END}\n")
        
        cursor.execute("""
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                SUM(CASE WHEN referral_type = 'first_level' THEN 1 ELSE 0 END) as direct,
                SUM(CASE WHEN referral_type = 'second_level' THEN 1 ELSE 0 END) as level2,
                SUM(bonus_amount) as total_bonus
            FROM referrals
            WHERE created_at > NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 20
        """)
        recent = cursor.fetchall()
        
        if recent:
            table_data = []
            for r in recent:
                table_data.append([
                    r['date'].strftime('%Y-%m-%d') if r['date'] else 'N/A',
                    r['total'] or 0,
                    r['direct'] or 0,
                    r['level2'] or 0,
                    f"MWK {float(r['total_bonus'] or 0):,.0f}"
                ])
            headers = ['Date', 'Total', 'Direct', 'Level 2', 'Total Bonus']
            display_table(table_data, headers)
        else:
            print_info("No referral activity in the last 30 days")
        
        print("\n" + "="*70 + "\n")
        
        # 8. Summary and recommendations
        print(f"{Colors.BOLD}{Colors.HEADER}📋 SUMMARY & RECOMMENDATIONS{Colors.END}\n")
        
        # Check if Level 2 exists
        cursor.execute("SELECT COUNT(*) FROM referrals WHERE referral_type = 'second_level'")
        level2_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM referrals WHERE referral_type = 'first_level' OR referral_type IS NULL")
        direct_count = cursor.fetchone()[0]
        
        if direct_count > 0 and level2_count == 0:
            print_warning("⚠️  You have direct referrals but NO Level 2 referrals!")
            print_info("This suggests the Level 2 bonus system may not be working.")
            print_info("Check that:")
            print("  1. The referral_type is being set correctly when creating referrals")
            print("  2. The Level 2 bonus trigger is working when a referral refers someone")
            print("  3. The bonus amounts are being calculated correctly")
        elif level2_count > 0:
            ratio = level2_count / direct_count if direct_count > 0 else 0
            print_success(f"✅ Level 2 referrals exist: {level2_count} Level 2 / {direct_count} Direct")
            if ratio < 0.1:
                print_warning(f"⚠️  Level 2 ratio is low ({ratio:.1%}). This could indicate:")
                print("  1. Most users aren't referring others yet")
                print("  2. The Level 2 trigger is only working sometimes")
                print("  3. Users are being referred but not completing registration")
            else:
                print_success(f"✅ Good Level 2 ratio: {ratio:.1%}")
        
        # Check bonus amounts
        cursor.execute("""
            SELECT 
                referral_type,
                AVG(bonus_amount) as avg_bonus
            FROM referrals
            GROUP BY referral_type
        """)
        bonus_by_type = cursor.fetchall()
        
        if bonus_by_type:
            print("\n📊 Average Bonuses:")
            for b in bonus_by_type:
                print(f"  {b['referral_type'] or 'unknown'}: MWK {float(b['avg_bonus'] or 0):,.2f}")
        
        print(f"\n{Colors.DIM}Press Enter to continue...{Colors.END}")
        
    finally:
        cursor.close()
        conn.close()
    
    input()    

def view_user_transactions(user_id):
    clear_screen()
    print_header("💳 TRANSACTION HISTORY")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                id, transaction_type, amount, balance_before, balance_after,
                description, created_at, fee_deducted, net_amount
            FROM transactions
            WHERE wallet_id = (SELECT id FROM wallets WHERE user_id = %s)
            ORDER BY created_at DESC
            LIMIT 30
        """, (user_id,))
        
        transactions = cursor.fetchall()
        
        if not transactions:
            print_info("No transactions found")
        else:
            table_data = []
            for t in transactions:
                table_data.append([
                    t['created_at'].strftime('%Y-%m-%d %H:%M') if t['created_at'] else 'N/A',
                    t['transaction_type'] or 'N/A',
                    f"MWK {float(t['amount'] or 0):,.2f}",
                    f"MWK {float(t['balance_before'] or 0):,.2f}",
                    f"MWK {float(t['balance_after'] or 0):,.2f}",
                    (t['description'] or 'N/A')[:25]
                ])
            
            headers = ['Date', 'Type', 'Amount', 'Before', 'After', 'Description']
            display_table(table_data, headers)
        
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

def view_user_referrals(user_id):
    clear_screen()
    print_header("📤 USER REFERRALS")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                r.id, r.referred_id, r.referral_type,
                u.full_name, u.email, u.phone,
                u.payment_status,
                r.bonus_amount, r.is_paid,
                r.created_at
            FROM referrals r
            JOIN users u ON u.id = r.referred_id
            WHERE r.referrer_id = %s
            ORDER BY r.created_at DESC
        """, (user_id,))
        
        referrals = cursor.fetchall()
        
        if not referrals:
            print_info("No referrals found for this user")
        else:
            table_data = []
            for r in referrals:
                table_data.append([
                    r['referral_type'] or 'first_level',
                    r['full_name'] or 'N/A',
                    r['email'] or 'N/A',
                    r['payment_status'] or 'pending',
                    f"MWK {float(r['bonus_amount'] or 0):,.0f}",
                    '✅' if r['is_paid'] else '⏳',
                    r['created_at'].strftime('%Y-%m-%d') if r['created_at'] else 'N/A'
                ])
            
            headers = ['Type', 'Name', 'Email', 'Status', 'Bonus', 'Paid', 'Date']
            display_table(table_data, headers, f"Total: {len(referrals)} referrals")
        
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")
# ============================================================
# WITHDRAWAL FUNCTIONS
# ============================================================

def view_all_withdrawals():
    clear_screen()
    print_header("💳 ALL WITHDRAWALS")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                w.id, u.full_name, u.email,
                w.amount_requested, w.withdrawal_fee, w.amount_paid,
                w.status, w.requested_at, w.processed_at
            FROM withdrawals w
            JOIN wallets wl ON wl.id = w.wallet_id
            JOIN users u ON u.id = wl.user_id
            ORDER BY w.requested_at DESC
            LIMIT 30
        """)
        withdrawals = cursor.fetchall()
        
        if not withdrawals:
            print_info("No withdrawals found")
        else:
            table_data = []
            for w in withdrawals:
                status_color = Colors.GREEN if w['status'] == 'completed' else Colors.YELLOW if w['status'] == 'pending' else Colors.RED
                table_data.append([
                    w['full_name'] or 'N/A',
                    f"MWK {float(w['amount_requested'] or 0):,.0f}",
                    f"MWK {float(w['amount_paid'] or 0):,.0f}",
                    f"{status_color}{w['status'] or 'pending'}{Colors.END}",
                    w['requested_at'].strftime('%Y-%m-%d') if w['requested_at'] else 'N/A'
                ])
            
            headers = ['User', 'Requested', 'Paid', 'Status', 'Date']
            display_table(table_data, headers)
        
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

def process_withdrawals_interactive():
    clear_screen()
    print_header("💳 PROCESS WITHDRAWALS")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                w.id, wl.user_id, u.full_name, u.email,
                w.amount_requested, w.withdrawal_fee, w.amount_paid,
                w.requested_at
            FROM withdrawals w
            JOIN wallets wl ON wl.id = w.wallet_id
            JOIN users u ON u.id = wl.user_id
            WHERE w.status = 'pending'
            ORDER BY w.requested_at ASC
        """)
        pending = cursor.fetchall()
        
        if not pending:
            print_info("No pending withdrawals")
            input("\nPress Enter to continue...")
            return
        
        table_data = []
        for w in pending:
            table_data.append([
                w['id'][:8] + '...',
                w['full_name'] or 'N/A',
                f"MWK {float(w['amount_requested'] or 0):,.0f}",
                f"MWK {float(w['amount_paid'] or 0):,.0f}",
                w['requested_at'].strftime('%Y-%m-%d') if w['requested_at'] else 'N/A'
            ])
        
        headers = ['ID', 'User', 'Gross', 'Net', 'Requested']
        display_table(table_data, headers, f"Pending: {len(pending)} withdrawals")
        
        withdrawal_id = input_prompt("Enter withdrawal ID to process (or 0 to cancel)")
        if withdrawal_id == '0' or not withdrawal_id:
            return
        
        selected = None
        for w in pending:
            if w['id'].startswith(withdrawal_id):
                selected = w
                break
        
        if not selected:
            print_error("Withdrawal not found")
            input("\nPress Enter to continue...")
            return
        
        print(f"\n{Colors.BOLD}Withdrawal Details:{Colors.END}")
        print(f"  User: {selected['full_name']}")
        print(f"  Amount: MWK {float(selected['amount_requested']):,.2f}")
        print(f"  Fee: MWK {float(selected['withdrawal_fee']):,.2f}")
        print(f"  Net: MWK {float(selected['amount_paid']):,.2f}")
        
        print("\n  1. Approve")
        print("  2. Reject")
        print("  0. Cancel")
        
        action = input(f"{Colors.BOLD}Choice: {Colors.END}").strip()
        
        if action == '1':
            if input_confirm("Approve this withdrawal?"):
                cursor.execute("""
                    UPDATE withdrawals 
                    SET status = 'completed', processed_at = NOW()
                    WHERE id = %s
                """, (selected['id'],))
                conn.commit()
                print_success("Withdrawal approved!")
        elif action == '2':
            notes = input_prompt("Rejection reason", "Withdrawal rejected by admin")
            if input_confirm("Reject this withdrawal?"):
                cursor.execute("""
                    UPDATE withdrawals 
                    SET status = 'rejected', processed_at = NOW(), notes = %s
                    WHERE id = %s
                """, (notes, selected['id']))
                
                cursor.execute("""
                    UPDATE wallets 
                    SET balance_available = balance_available + %s
                    WHERE id = %s
                """, (selected['amount_requested'], selected['wallet_id']))
                
                conn.commit()
                print_success("Withdrawal rejected and funds refunded!")
        
    except Exception as e:
        conn.rollback()
        print_error(f"Error: {e}")
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

# ============================================================
# REFERRAL FUNCTIONS
# ============================================================

def fix_referral_interactive():
    clear_screen()
    print_header("📤 FIX REFERRAL BONUS")
    
    user_identifier = input_prompt("User email/phone who signed up")
    if not user_identifier:
        return
    
    user = find_user(user_identifier)
    if not user:
        print_error("User not found")
        input("\nPress Enter to continue...")
        return
    
    referrer_identifier = input_prompt("Referrer email/phone who should get bonus")
    if not referrer_identifier:
        return
    
    referrer = find_user(referrer_identifier)
    if not referrer:
        print_error("Referrer not found")
        input("\nPress Enter to continue...")
        return
    
    amount = input_prompt("Bonus Amount (MWK)", "7000")
    try:
        amount = float(amount)
    except:
        amount = 7000
    
    print(f"\n{Colors.BOLD}Summary:{Colors.END}")
    print(f"  User: {user['full_name']} ({user['email']})")
    print(f"  Referrer: {referrer['full_name']} ({referrer['email']})")
    print(f"  Bonus: MWK {amount:,.2f}")
    
    if not input_confirm("Add this referral bonus?"):
        return
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if referral already exists
        cursor.execute("""
            SELECT id FROM referrals 
            WHERE referrer_id = %s AND referred_id = %s
        """, (referrer['id'], user['id']))
        existing = cursor.fetchone()
        
        if existing:
            cursor.execute("""
                UPDATE referrals 
                SET bonus_amount = %s, is_paid = true, updated_at = NOW()
                WHERE referrer_id = %s AND referred_id = %s
            """, (amount, referrer['id'], user['id']))
        else:
            cursor.execute("""
                INSERT INTO referrals (
                    referrer_id, referred_id, referral_type, registration_year,
                    bonus_amount, is_paid, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, NOW())
            """, (referrer['id'], user['id'], 'first_level', datetime.now().year, amount, True))
        
        # Add bonus to referrer's store_credit
        cursor.execute("""
            UPDATE wallets 
            SET store_credit = store_credit + %s,
                gross_earnings = gross_earnings + %s,
                updated_at = NOW()
            WHERE user_id = %s
        """, (amount, amount, referrer['id']))
        
        conn.commit()
        print_success(f"Added MWK {amount:,.2f} referral bonus to {referrer['full_name']}")
        
    except Exception as e:
        conn.rollback()
        print_error(f"Failed: {e}")
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")
def view_all_referrals():
    clear_screen()
    print_header("📤 ALL REFERRALS")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                r.id, r.referral_type,
                u1.full_name as referrer_name,
                u2.full_name as referred_name,
                r.bonus_amount, r.is_paid,
                r.created_at
            FROM referrals r
            JOIN users u1 ON u1.id = r.referrer_id
            JOIN users u2 ON u2.id = r.referred_id
            ORDER BY r.created_at DESC
            LIMIT 30
        """)
        referrals = cursor.fetchall()
        
        if not referrals:
            print_info("No referrals found")
        else:
            table_data = []
            for r in referrals:
                table_data.append([
                    r['referral_type'] or 'first_level',
                    r['referrer_name'] or 'N/A',
                    r['referred_name'] or 'N/A',
                    f"MWK {float(r['bonus_amount'] or 0):,.0f}",
                    '✅' if r['is_paid'] else '⏳',
                    r['created_at'].strftime('%Y-%m-%d') if r['created_at'] else 'N/A'
                ])
            
            headers = ['Type', 'Referrer', 'Referred', 'Bonus', 'Paid', 'Date']
            display_table(table_data, headers)
        
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")
def show_referral_stats():
    clear_screen()
    print_header("📊 REFERRAL STATISTICS")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Top referrers
        cursor.execute("""
            SELECT 
                u.full_name, u.email,
                COUNT(r.id) as referral_count,
                COALESCE(SUM(r.bonus_amount), 0) as total_bonus
            FROM users u
            LEFT JOIN referrals r ON r.referrer_id = u.id
            GROUP BY u.id, u.full_name, u.email
            HAVING COUNT(r.id) > 0
            ORDER BY referral_count DESC
            LIMIT 10
        """)
        top_referrers = cursor.fetchall()
        
        if top_referrers:
            table_data = []
            for r in top_referrers:
                table_data.append([
                    r['full_name'] or 'N/A',
                    r['email'] or 'N/A',
                    r['referral_count'],
                    f"MWK {float(r['total_bonus'] or 0):,.0f}"
                ])
            
            display_table(table_data, ['Name', 'Email', 'Referrals', 'Total Bonus'], "🏆 Top Referrers")
        else:
            print_info("No referrals yet")
        
        # Total stats
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_paid THEN 1 ELSE 0 END) as paid,
                SUM(bonus_amount) as total_bonus,
                SUM(fee_deducted) as total_fees
            FROM referrals
        """)
        stats = cursor.fetchone()
        
        if stats and stats['total'] > 0:
            print(f"\n{Colors.BOLD}📊 Overall Referral Stats{Colors.END}")
            print(f"  Total Referrals: {stats['total']}")
            print(f"  Paid: {stats['paid']}")
            print(f"  Unpaid: {stats['total'] - stats['paid']}")
            print(f"  Total Bonus Paid: MWK {float(stats['total_bonus'] or 0):,.2f}")
            print(f"  Total Fees Deducted: MWK {float(stats['total_fees'] or 0):,.2f}")
        
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")
# ============================================================
# USER VERIFICATION FUNCTIONS
# ============================================================

def verify_user_interactive():
    identifier = input_prompt("User email/phone")
    if not identifier:
        return
    user = find_user(identifier)
    if user:
        verify_user_by_id(user['id'])

def verify_user_by_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE users 
            SET payment_status = 'verified', updated_at = NOW()
            WHERE id = %s
        """, (user_id,))
        conn.commit()
        print_success("User verified!")
    except Exception as e:
        conn.rollback()
        print_error(f"Failed: {e}")
    finally:
        cursor.close()
        conn.close()
    input("\nPress Enter to continue...")

def unverify_user_by_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE users 
            SET payment_status = 'pending', updated_at = NOW()
            WHERE id = %s
        """, (user_id,))
        conn.commit()
        print_success("User unverified!")
    except Exception as e:
        conn.rollback()
        print_error(f"Failed: {e}")
    finally:
        cursor.close()
        conn.close()
    input("\nPress Enter to continue...")

def toggle_user_active_interactive():
    identifier = input_prompt("User email/phone")
    if not identifier:
        return
    user = find_user(identifier)
    if user:
        toggle_user_active_by_id(user['id'])

def toggle_user_active_by_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("SELECT is_active FROM users WHERE id = %s", (user_id,))
        current = cursor.fetchone()
        if not current:
            print_error("User not found")
            return
        
        new_status = not current['is_active']
        cursor.execute("""
            UPDATE users 
            SET is_active = %s, updated_at = NOW()
            WHERE id = %s
        """, (new_status, user_id))
        conn.commit()
        print_success(f"User {'activated' if new_status else 'deactivated'}!")
    except Exception as e:
        conn.rollback()
        print_error(f"Failed: {e}")
    finally:
        cursor.close()
        conn.close()
    input("\nPress Enter to continue...")

# ============================================================
# NOTIFICATION FUNCTIONS
# ============================================================

def send_notification_interactive():
    clear_screen()
    print_header("📨 SEND NOTIFICATION")
    
    print("Send to:")
    print("  1. All users")
    print("  2. Verified users only")
    print("  3. Pending users only")
    print("  4. Specific user")
    print("  0. Cancel")
    
    choice = input(f"{Colors.BOLD}Choice: {Colors.END}").strip()
    
    if choice == '0':
        return
    elif choice == '4':
        identifier = input_prompt("User email/phone")
        if identifier:
            user = find_user(identifier)
            if user:
                send_notification_to_user(user['id'])
        return
    
    if choice not in ['1', '2', '3']:
        return
    
    status_filter = None
    if choice == '2':
        status_filter = 'verified'
    elif choice == '3':
        status_filter = 'pending'
    
    title = input_prompt("Notification Title")
    message = input_prompt("Notification Message")
    link = input_prompt("Link (optional)")
    
    if not title or not message:
        print_error("Title and message are required")
        return
    
    confirm = input_confirm(f"Send to {choice} users?")
    if not confirm:
        return
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if status_filter:
            cursor.execute("""
                INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
                SELECT id, 'system', %s, %s, %s, false, NOW()
                FROM users
                WHERE payment_status = %s
            """, (title, message, link, status_filter))
        else:
            cursor.execute("""
                INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
                SELECT id, 'system', %s, %s, %s, false, NOW()
                FROM users
            """, (title, message, link))
        
        count = cursor.rowcount
        conn.commit()
        print_success(f"Notification sent to {count} users!")
        
    except Exception as e:
        conn.rollback()
        print_error(f"Failed: {e}")
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

def send_notification_to_user(user_id):
    title = input_prompt("Title")
    message = input_prompt("Message")
    link = input_prompt("Link (optional)")
    
    if not title or not message:
        print_error("Title and message are required")
        return
    
    confirm = input_confirm("Send this notification?")
    if not confirm:
        return
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
            VALUES (%s, 'system', %s, %s, %s, false, NOW())
        """, (user_id, title, message, link))
        conn.commit()
        print_success("Notification sent!")
        
    except Exception as e:
        conn.rollback()
        print_error(f"Failed: {e}")
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

# ============================================================
# CONTENT MANAGEMENT FUNCTIONS
# ============================================================

def manage_content_interactive():
    clear_screen()
    print_header("📚 CONTENT MANAGEMENT")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                id, title, content_type, link_type,
                is_published, is_premium, price,
                created_at
            FROM content_items
            ORDER BY created_at DESC
            LIMIT 20
        """)
        items = cursor.fetchall()
        
        if not items:
            print_info("No content found")
        else:
            table_data = []
            for i in items:
                table_data.append([
                    i['id'][:8] + '...',
                    (i['title'] or 'N/A')[:25],
                    i['content_type'] or 'N/A',
                    '✅' if i['is_published'] else '❌',
                    '⭐' if i['is_premium'] else 'Free',
                    f"MWK {float(i['price'] or 0):,.0f}",
                    i['created_at'].strftime('%Y-%m-%d') if i['created_at'] else 'N/A'
                ])
            
            headers = ['ID', 'Title', 'Type', 'Published', 'Premium', 'Price', 'Date']
            display_table(table_data, headers)
        
        print(f"\n{Colors.BOLD}Actions:{Colors.END}")
        print("  1. Add Content")
        print("  2. Delete Content")
        print("  3. Toggle Published")
        print("  0. Back")
        
        choice = input(f"{Colors.BOLD}Choice: {Colors.END}").strip()
        
        if choice == '1':
            add_content_interactive()
        elif choice == '2':
            delete_content_interactive()
        elif choice == '3':
            toggle_published_interactive()
            
    finally:
        cursor.close()
        conn.close()

def add_content_interactive():
    clear_screen()
    print_header("➕ ADD CONTENT")
    
    title = input_prompt("Title")
    if not title:
        return
    
    content_type = input_prompt("Content Type (book, teaching, guide, article)")
    link_type = input_prompt("Link Type (youtube, vimeo, pdf, audio, url)")
    file_url = input_prompt("File URL")
    author = input_prompt("Author", "Wisdom Vault")
    description = input_prompt("Description")
    
    is_premium = input_confirm("Is premium?")
    price = 0
    if is_premium:
        price = input_prompt("Price (MWK)", "25000")
        try:
            price = float(price)
        except:
            price = 25000
    
    is_published = input_confirm("Publish immediately?")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO content_items (
                title, content_type, link_type, file_url,
                author, description, is_premium, price, is_published,
                created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            RETURNING id
        """, (title, content_type, link_type, file_url,
              author, description, is_premium, price, is_published))
        
        content_id = cursor.fetchone()[0]
        conn.commit()
        print_success(f"Content created! ID: {content_id}")
        
    except Exception as e:
        conn.rollback()
        print_error(f"Failed: {e}")
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

def delete_content_interactive():
    content_id = input_prompt("Content ID")
    if not content_id:
        return
    
    if input_confirm("PERMANENTLY delete this content?"):
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM content_items WHERE id = %s", (content_id,))
            conn.commit()
            print_success("Content deleted!")
        except Exception as e:
            conn.rollback()
            print_error(f"Failed: {e}")
        finally:
            cursor.close()
            conn.close()
    
    input("\nPress Enter to continue...")

def toggle_published_interactive():
    content_id = input_prompt("Content ID")
    if not content_id:
        return
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE content_items 
            SET is_published = NOT is_published,
                updated_at = NOW()
            WHERE id = %s
        """, (content_id,))
        conn.commit()
        print_success("Content toggled!")
    except Exception as e:
        conn.rollback()
        print_error(f"Failed: {e}")
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

# ============================================================
# CATEGORY MANAGEMENT
# ============================================================

def manage_categories_interactive():
    clear_screen()
    print_header("📂 CATEGORY MANAGEMENT")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                id, name, slug, description,
                is_active, display_order,
                created_at
            FROM content_categories
            ORDER BY display_order, name
        """)
        categories = cursor.fetchall()
        
        if not categories:
            print_info("No categories found")
        else:
            table_data = []
            for c in categories:
                table_data.append([
                    c['id'][:8] + '...',
                    c['name'] or 'N/A',
                    c['slug'] or 'N/A',
                    (c['description'] or 'N/A')[:30],
                    '✅' if c['is_active'] else '❌',
                    c['display_order'] or 0
                ])
            
            headers = ['ID', 'Name', 'Slug', 'Description', 'Active', 'Order']
            display_table(table_data, headers)
        
        print(f"\n{Colors.BOLD}Actions:{Colors.END}")
        print("  1. Add Category")
        print("  0. Back")
        
        choice = input(f"{Colors.BOLD}Choice: {Colors.END}").strip()
        
        if choice == '1':
            add_category_interactive()
            
    finally:
        cursor.close()
        conn.close()

def add_category_interactive():
    clear_screen()
    print_header("➕ ADD CATEGORY")
    
    name = input_prompt("Category Name")
    if not name:
        return
    
    slug = input_prompt("Slug (auto-generate if empty)")
    if not slug:
        slug = name.lower().replace(' ', '-')
    
    description = input_prompt("Description")
    is_active = input_confirm("Active?")
    display_order = input_prompt("Display Order", "0")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO content_categories (
                name, slug, description, is_active, display_order,
                created_at
            ) VALUES (%s, %s, %s, %s, %s, NOW())
            RETURNING id
        """, (name, slug, description, is_active, int(display_order or 0)))
        
        category_id = cursor.fetchone()[0]
        conn.commit()
        print_success(f"Category created! ID: {category_id}")
        
    except Exception as e:
        conn.rollback()
        print_error(f"Failed: {e}")
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

# ============================================================
# PACK (COURSE) MANAGEMENT
# ============================================================

def manage_packs_interactive():
    clear_screen()
    print_header("🎓 PREMIUM PACK MANAGEMENT")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                id, name, category, price, is_free,
                is_active, display_order,
                created_at
            FROM premium_packs
            ORDER BY created_at DESC
            LIMIT 20
        """)
        packs = cursor.fetchall()
        
        if not packs:
            print_info("No packs found")
        else:
            table_data = []
            for p in packs:
                table_data.append([
                    p['id'][:8] + '...',
                    (p['name'] or 'N/A')[:25],
                    p['category'] or 'N/A',
                    f"MWK {float(p['price'] or 0):,.0f}",
                    '✅' if p['is_free'] else '❌',
                    '✅' if p['is_active'] else '❌'
                ])
            
            headers = ['ID', 'Name', 'Category', 'Price', 'Free', 'Active']
            display_table(table_data, headers)
        
        print(f"\n{Colors.BOLD}Actions:{Colors.END}")
        print("  1. Create Pack")
        print("  2. Delete Pack")
        print("  0. Back")
        
        choice = input(f"{Colors.BOLD}Choice: {Colors.END}").strip()
        
        if choice == '1':
            create_pack_interactive()
        elif choice == '2':
            delete_pack_interactive()
            
    finally:
        cursor.close()
        conn.close()

def create_pack_interactive():
    clear_screen()
    print_header("➕ CREATE PREMIUM PACK")
    
    name = input_prompt("Pack Name")
    if not name:
        return
    
    slug = input_prompt("Slug (auto-generate if empty)")
    if not slug:
        slug = name.lower().replace(' ', '-')
    
    category = input_prompt("Category")
    description = input_prompt("Description")
    long_description = input_prompt("Long Description", description)
    
    is_free = input_confirm("Free?")
    price = 0
    if not is_free:
        price = input_prompt("Price (MWK)", "25000")
        try:
            price = float(price)
        except:
            price = 25000
    
    is_active = input_confirm("Active?")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO premium_packs (
                name, slug, category, description, long_description,
                price, is_free, is_active, display_order,
                created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id
        """, (name, slug, category, description, long_description,
              price, is_free, is_active, 0))
        
        pack_id = cursor.fetchone()[0]
        conn.commit()
        print_success(f"Pack created! ID: {pack_id}")
        
    except Exception as e:
        conn.rollback()
        print_error(f"Failed: {e}")
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

def delete_pack_interactive():
    pack_id = input_prompt("Pack ID")
    if not pack_id:
        return
    
    if input_confirm("PERMANENTLY delete this pack and all items?"):
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM premium_content_items WHERE pack_id = %s", (pack_id,))
            cursor.execute("DELETE FROM premium_packs WHERE id = %s", (pack_id,))
            conn.commit()
            print_success("Pack deleted!")
        except Exception as e:
            conn.rollback()
            print_error(f"Failed: {e}")
        finally:
            cursor.close()
            conn.close()
    
    input("\nPress Enter to continue...")

# ============================================================
# PACK ITEMS (LESSONS) MANAGEMENT
# ============================================================

def manage_pack_items_interactive():
    clear_screen()
    print_header("📚 PACK ITEMS (LESSONS)")
    
    pack_id = input_prompt("Pack ID")
    if not pack_id:
        return
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                id, title, content_type, link_type,
                file_url, display_order,
                created_at
            FROM premium_content_items
            WHERE pack_id = %s
            ORDER BY display_order
        """, (pack_id,))
        items = cursor.fetchall()
        
        if not items:
            print_info("No items found for this pack")
        else:
            table_data = []
            for i in items:
                table_data.append([
                    i['id'][:8] + '...',
                    (i['title'] or 'N/A')[:25],
                    i['content_type'] or 'N/A',
                    i['link_type'] or 'N/A',
                    i['display_order'] or 0
                ])
            
            headers = ['ID', 'Title', 'Type', 'Link Type', 'Order']
            display_table(table_data, headers)
        
        print(f"\n{Colors.BOLD}Actions:{Colors.END}")
        print("  1. Add Item")
        print("  2. Delete Item")
        print("  0. Back")
        
        choice = input(f"{Colors.BOLD}Choice: {Colors.END}").strip()
        
        if choice == '1':
            add_pack_item_interactive(pack_id)
        elif choice == '2':
            delete_pack_item_interactive()
            
    finally:
        cursor.close()
        conn.close()

def add_pack_item_interactive(pack_id):
    title = input_prompt("Item Title")
    if not title:
        return
    
    content_type = input_prompt("Content Type (pdf, video, audio, course, tool, ebook, guide)")
    link_type = input_prompt("Link Type (youtube, vimeo, pdf, audio, url)")
    file_url = input_prompt("File URL")
    display_order = input_prompt("Display Order", "0")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO premium_content_items (
                pack_id, title, content_type, link_type, file_url, display_order,
                created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, NOW())
            RETURNING id
        """, (pack_id, title, content_type, link_type, file_url, int(display_order or 0)))
        
        item_id = cursor.fetchone()[0]
        conn.commit()
        print_success(f"Item added! ID: {item_id}")
        
    except Exception as e:
        conn.rollback()
        print_error(f"Failed: {e}")
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

def delete_pack_item_interactive():
    item_id = input_prompt("Item ID")
    if not item_id:
        return
    
    if input_confirm("Delete this item?"):
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM premium_content_items WHERE id = %s", (item_id,))
            conn.commit()
            print_success("Item deleted!")
        except Exception as e:
            conn.rollback()
            print_error(f"Failed: {e}")
        finally:
            cursor.close()
            conn.close()
    
    input("\nPress Enter to continue...")

# ============================================================
# EARN CONTENT MANAGEMENT
# ============================================================

def manage_earn_content_interactive():
    clear_screen()
    print_header("📢 EARN CONTENT MANAGEMENT")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                id, title, content_type,
                reward_amount, duration_seconds, is_active,
                created_at
            FROM earn_content
            ORDER BY created_at DESC
            LIMIT 20
        """)
        items = cursor.fetchall()
        
        if not items:
            print_info("No earn content found")
        else:
            table_data = []
            for i in items:
                table_data.append([
                    i['id'][:8] + '...',
                    (i['title'] or 'N/A')[:25],
                    i['content_type'] or 'N/A',
                    f"MWK {float(i['reward_amount'] or 0):,.0f}",
                    f"{i['duration_seconds'] or 90}s",
                    '✅' if i['is_active'] else '❌'
                ])
            
            headers = ['ID', 'Title', 'Type', 'Reward', 'Duration', 'Active']
            display_table(table_data, headers)
        
        print(f"\n{Colors.BOLD}Actions:{Colors.END}")
        print("  1. Create Earn Content")
        print("  2. Toggle Active")
        print("  3. Delete")
        print("  0. Back")
        
        choice = input(f"{Colors.BOLD}Choice: {Colors.END}").strip()
        
        if choice == '1':
            create_earn_content_interactive()
        elif choice == '2':
            toggle_earn_content_active()
        elif choice == '3':
            delete_earn_content()
            
    finally:
        cursor.close()
        conn.close()

def create_earn_content_interactive():
    clear_screen()
    print_header("➕ CREATE EARN CONTENT")
    
    title = input_prompt("Title")
    if not title:
        return
    
    content_type = input_prompt("Content Type (video, audio, article)")
    external_link = input_prompt("External Link (URL)")
    file_url = input_prompt("File URL (optional)")
    thumbnail_url = input_prompt("Thumbnail URL (optional)")
    
    reward = input_prompt("Reward Amount (MWK)", "50")
    try:
        reward = float(reward)
    except:
        reward = 50
    
    duration = input_prompt("Duration (seconds)", "90")
    try:
        duration = int(duration)
    except:
        duration = 90
    
    sponsor = input_prompt("Sponsor Name", "Wisdom Vault")
    description = input_prompt("Description", title)
    is_active = input_confirm("Active immediately?")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO earn_content (
                title, content_type, external_link, file_url, thumbnail_url,
                reward_amount, duration_seconds, sponsor_name, description,
                is_active, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id
        """, (title, content_type, external_link, file_url, thumbnail_url,
              reward, duration, sponsor, description, is_active))
        
        content_id = cursor.fetchone()[0]
        conn.commit()
        print_success(f"Earn content created! ID: {content_id}")
        
    except Exception as e:
        conn.rollback()
        print_error(f"Failed: {e}")
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

def toggle_earn_content_active():
    content_id = input_prompt("Content ID")
    if not content_id:
        return
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE earn_content 
            SET is_active = NOT is_active
            WHERE id = %s
        """, (content_id,))
        conn.commit()
        print_success("Content toggled!")
    except Exception as e:
        conn.rollback()
        print_error(f"Failed: {e}")
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

def delete_earn_content():
    content_id = input_prompt("Content ID")
    if not content_id:
        return
    
    if input_confirm("Delete this content?"):
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM earn_content WHERE id = %s", (content_id,))
            conn.commit()
            print_success("Content deleted!")
        except Exception as e:
            conn.rollback()
            print_error(f"Failed: {e}")
        finally:
            cursor.close()
            conn.close()
    
    input("\nPress Enter to continue...")

# ============================================================
# SPONSORED CONTENT MANAGEMENT
# ============================================================

def manage_sponsored_content_interactive():
    clear_screen()
    print_header("📢 SPONSORED CONTENT MANAGEMENT")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                id, title, content_type,
                reward_amount, duration_seconds, is_active,
                created_at
            FROM sponsored_content
            ORDER BY created_at DESC
            LIMIT 20
        """)
        items = cursor.fetchall()
        
        if not items:
            print_info("No sponsored content found")
        else:
            table_data = []
            for i in items:
                table_data.append([
                    i['id'][:8] + '...',
                    (i['title'] or 'N/A')[:25],
                    i['content_type'] or 'N/A',
                    f"MWK {float(i['reward_amount'] or 0):,.0f}",
                    f"{i['duration_seconds'] or 30}s",
                    '✅' if i['is_active'] else '❌'
                ])
            
            headers = ['ID', 'Title', 'Type', 'Reward', 'Duration', 'Active']
            display_table(table_data, headers)
        
        print(f"\n{Colors.BOLD}Actions:{Colors.END}")
        print("  1. Create Sponsored Content")
        print("  2. Toggle Active")
        print("  3. Delete")
        print("  0. Back")
        
        choice = input(f"{Colors.BOLD}Choice: {Colors.END}").strip()
        
        if choice == '1':
            create_sponsored_content_interactive()
        elif choice == '2':
            toggle_sponsored_content_active()
        elif choice == '3':
            delete_sponsored_content()
            
    finally:
        cursor.close()
        conn.close()

def create_sponsored_content_interactive():
    clear_screen()
    print_header("➕ CREATE SPONSORED CONTENT")
    
    title = input_prompt("Title")
    if not title:
        return
    
    content_type = input_prompt("Content Type (video, audio)")
    external_link = input_prompt("External Link (URL)")
    file_url = input_prompt("File URL (optional)")
    thumbnail_url = input_prompt("Thumbnail URL (optional)")
    
    reward = input_prompt("Reward Amount (MWK)", "50")
    try:
        reward = float(reward)
    except:
        reward = 50
    
    duration = input_prompt("Duration (seconds)", "30")
    try:
        duration = int(duration)
    except:
        duration = 30
    
    sponsor = input_prompt("Sponsor Name", "Wisdom Vault")
    description = input_prompt("Description", title)
    video_platform = input_prompt("Video Platform (youtube, vimeo)", "youtube")
    is_active = input_confirm("Active immediately?")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO sponsored_content (
                title, content_type, external_link, file_url, thumbnail_url,
                reward_amount, duration_seconds, sponsor_name, description,
                video_platform, is_active, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id
        """, (title, content_type, external_link, file_url, thumbnail_url,
              reward, duration, sponsor, description, video_platform, is_active))
        
        content_id = cursor.fetchone()[0]
        conn.commit()
        print_success(f"Sponsored content created! ID: {content_id}")
        
    except Exception as e:
        conn.rollback()
        print_error(f"Failed: {e}")
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

def toggle_sponsored_content_active():
    content_id = input_prompt("Content ID")
    if not content_id:
        return
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE sponsored_content 
            SET is_active = NOT is_active
            WHERE id = %s
        """, (content_id,))
        conn.commit()
        print_success("Content toggled!")
    except Exception as e:
        conn.rollback()
        print_error(f"Failed: {e}")
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

def delete_sponsored_content():
    content_id = input_prompt("Content ID")
    if not content_id:
        return
    
    if input_confirm("Delete this content?"):
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM sponsored_content WHERE id = %s", (content_id,))
            conn.commit()
            print_success("Content deleted!")
        except Exception as e:
            conn.rollback()
            print_error(f"Failed: {e}")
        finally:
            cursor.close()
            conn.close()
    
    input("\nPress Enter to continue...")

# ============================================================
# STATISTICS & RECENT ACTIVITY
# ============================================================

def show_stats():
    clear_screen()
    print_header("📊 SYSTEM STATISTICS")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # User stats
        cursor.execute("""
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN payment_status = 'verified' THEN 1 ELSE 0 END) as verified,
                SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active
            FROM users
        """)
        users = cursor.fetchone()
        
        # Wallet stats
        cursor.execute("""
            SELECT 
                SUM(balance_available) as total_balance,
                SUM(store_credit) as total_store_credit,
                SUM(gross_earnings) as total_gross_earnings
            FROM wallets
        """)
        wallets = cursor.fetchone()
        
        # Content stats
        cursor.execute("""
            SELECT COUNT(*) as total FROM content_items
        """)
        content = cursor.fetchone()
        
        # Referral stats
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_paid THEN 1 ELSE 0 END) as paid,
                SUM(bonus_amount) as total_bonus
            FROM referrals
        """)
        referrals = cursor.fetchone()
        
        print(f"{Colors.BOLD}👥 USERS{Colors.END}")
        print(f"  Total: {users['total_users']:,}")
        print(f"  Verified: {Colors.GREEN}{users['verified']:,}{Colors.END}")
        print(f"  Pending: {Colors.YELLOW}{users['pending']:,}{Colors.END}")
        print(f"  Active: {Colors.CYAN}{users['active']:,}{Colors.END}")
        
        print(f"\n{Colors.BOLD}💰 FINANCES{Colors.END}")
        print(f"  Total Cash Balance: MWK {float(wallets['total_balance'] or 0):,.2f}")
        print(f"  Total Store Credit: MWK {float(wallets['total_store_credit'] or 0):,.2f}")
        print(f"  Total Gross Earnings: MWK {float(wallets['total_gross_earnings'] or 0):,.2f}")
        
        print(f"\n{Colors.BOLD}📚 CONTENT{Colors.END}")
        print(f"  Total Content Items: {content['total'] or 0}")
        
        print(f"\n{Colors.BOLD}📤 REFERRALS{Colors.END}")
        print(f"  Total: {referrals['total'] or 0}")
        print(f"  Paid: {Colors.GREEN}{referrals['paid'] or 0}{Colors.END}")
        print(f"  Total Bonus: MWK {float(referrals['total_bonus'] or 0):,.2f}")
        
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

def show_recent_activity():
    clear_screen()
    print_header("🔄 RECENT ACTIVITY")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Recent users
        cursor.execute("""
            SELECT full_name, email, created_at 
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 10
        """)
        recent_users = cursor.fetchall()
        
        print(f"{Colors.BOLD}📝 Recent Users{Colors.END}")
        for u in recent_users:
            print(f"  {u['created_at'].strftime('%Y-%m-%d %H:%M') if u['created_at'] else 'N/A'} - {u['full_name']} ({u['email']})")
        
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

# ============================================================
# CUSTOM SQL
# ============================================================

def run_custom_query():
    clear_screen()
    print_header("📝 CUSTOM SQL QUERY")
    
    print("Enter your SQL query (type 'exit' to cancel, '\\q' to finish):")
    print(f"{Colors.DIM}Example: SELECT * FROM users LIMIT 10{Colors.END}")
    
    lines = []
    while True:
        line = input("SQL> ")
        if line.lower() == 'exit':
            return
        if line == '\\q':
            break
        lines.append(line)
    
    query = ' '.join(lines)
    if not query.strip():
        return
    
    confirm = input_confirm("Execute this query?")
    if not confirm:
        return
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute(query)
        
        if cursor.description:
            results = cursor.fetchall()
            if results:
                headers = [desc[0] for desc in cursor.description]
                table_data = [[str(col) for col in row] for row in results]
                display_table(table_data, headers, f"Results: {len(results)} rows")
            else:
                print_info("Query executed successfully, no results returned")
        else:
            conn.commit()
            print_success(f"Query executed successfully. {cursor.rowcount} rows affected.")
        
    except Exception as e:
        conn.rollback()
        print_error(f"Query failed: {e}")
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

# ============================================================
# MAIN MENU
# ============================================================

def show_main_menu():
    while True:
        clear_screen()
        print_header("🏛️  WISDOM VAULT ULTIMATE ADMIN", "Complete Version - All Functions Defined")
        
        print(f"{Colors.BOLD}{Colors.CYAN}📊 DASHBOARD{Colors.END}")
        print("  1.  View Statistics")
        print("  2.  View Recent Activity")
        print()
        
        print(f"{Colors.BOLD}{Colors.CYAN}👥 USER MANAGEMENT{Colors.END}")
        print("  3.  List All Users")
        print("  4.  Find & Manage User")
        print("  5.  Create New User")
        print("  6.  🌳 View Referral Tree (Upline & Downline)")  # ← NEW
        print("  7.  🗑️ Delete Unverified Users (3+ days old)")   # ← NEW
        print()
        
        print(f"{Colors.BOLD}{Colors.CYAN}💰 FINANCIAL CONTROLS{Colors.END}")
        print("  8.  Add Funds to Wallet (balance_available)")
        print("  9.  Add Store Credit (store_credit)")
        print("  10. View User Wallet")
        print("  11. Process Withdrawals")
        print("  12. View All Withdrawals")
        print()
        
        print(f"{Colors.BOLD}{Colors.CYAN}📤 REFERRAL MANAGEMENT{Colors.END}")
        print("  13. Fix Referral Bonus")
        print("  14. View All Referrals")
        print("  15. View Referral Stats")
        print("  16. 🔍 Diagnose Referral System (Check Level 2 Bonuses)")
        print()
        
        print(f"{Colors.BOLD}{Colors.CYAN}📚 CONTENT MANAGEMENT{Colors.END}")
        print("  17. Manage Content Items")
        print("  18. Manage Categories")
        print()
        
        print(f"{Colors.BOLD}{Colors.CYAN}🎓 COURSE MANAGEMENT{Colors.END}")
        print("  19. Manage Premium Packs")
        print("  20. Manage Pack Items (Lessons)")
        print()
        
        print(f"{Colors.BOLD}{Colors.CYAN}📢 EARN & WATCH{Colors.END}")
        print("  21. Manage Earn Content")
        print("  22. Manage Sponsored Content")
        print()
        
        print(f"{Colors.BOLD}{Colors.CYAN}⚙️  SYSTEM{Colors.END}")
        print("  23. Verify User")
        print("  24. Toggle User Active")
        print("  25. Send Notification")
        print("  26. Run Custom SQL")
        print()
        
        print(f"{Colors.BOLD}{Colors.CYAN}🧹 MAINTENANCE{Colors.END}")
        print("  27. 🧹 7-Day Database Cleanup (users, notifications, earn content)")
        print()
        
        print(f"{Colors.BOLD}{Colors.CYAN}🚪 EXIT{Colors.END}")
        print("  0. Exit")
        print()
        
        choice = input(f"{Colors.BOLD}{Colors.CYAN}Enter your choice: {Colors.END}").strip()
        
        if choice == '0':
            print_info("Goodbye! 👋")
            break
        elif choice == '1':
            show_stats()
        elif choice == '2':
            show_recent_activity()
        elif choice == '3':
            list_users_interactive()
        elif choice == '4':
            find_user_interactive()
        elif choice == '5':
            create_user_interactive()
        elif choice == '6':
            identifier = input_prompt("User email/phone/ID to view referral tree")
            if identifier:
                view_referral_tree(identifier)
        elif choice == '7':
            delete_unverified_users()
        elif choice == '8':
            add_funds_interactive()
        elif choice == '9':
            add_store_credit_interactive()
        elif choice == '10':
            view_wallet_interactive()
        elif choice == '11':
            process_withdrawals_interactive()
        elif choice == '12':
            view_all_withdrawals()
        elif choice == '13':
            fix_referral_interactive()
        elif choice == '14':
            view_all_referrals()
        elif choice == '15':
            show_referral_stats()
        elif choice == '16':
            diagnose_referral_system()
        elif choice == '17':
            manage_content_interactive()
        elif choice == '18':
            manage_categories_interactive()
        elif choice == '19':
            manage_packs_interactive()
        elif choice == '20':
            manage_pack_items_interactive()
        elif choice == '21':
            manage_earn_content_interactive()
        elif choice == '22':
            manage_sponsored_content_interactive()
        elif choice == '23':
            verify_user_interactive()
        elif choice == '24':
            toggle_user_active_interactive()
        elif choice == '25':
            send_notification_interactive()
        elif choice == '26':
            run_custom_query()
        elif choice == '27':
            import subprocess
            print_info("Running 7-Day Cleanup Tool...")
            result = subprocess.run(['python3', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cleanup_7days.py')], capture_output=True, text=True)
            print(result.stdout)
            if result.stderr:
                print_error(result.stderr)
        else:
            print_error("Invalid choice")
# ============================================================
# MAIN ENTRY
# ============================================================

if __name__ == '__main__':
    try:
        show_main_menu()
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
        sys.exit(0)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)
