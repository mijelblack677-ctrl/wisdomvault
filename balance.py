#!/usr/bin/env python3
"""
Wisdom Vault - Wallet & Bonus Management Tool
Add/Subtract funds from any wallet, fix referral bonuses
"""

import os
import sys
import psycopg2
import psycopg2.extras
from datetime import datetime
from tabulate import tabulate
import readline

from db_config import (
    get_db_connection, Colors, print_success, print_error, print_warning,
    print_info, print_header, clear_screen
)

# ============================================================
# SEARCH FUNCTIONS
# ============================================================

def search_users(query):
    """Search for users by name, email, or phone"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                u.id, u.full_name, u.email, u.phone,
                u.referral_code, u.payment_status,
                u.referred_by, u.created_at,
                r.full_name as referrer_name,
                w.balance_available,
                w.store_credit,
                w.gross_earnings,
                w.total_withdrawn,
                (SELECT COUNT(*) FROM users WHERE referred_by = u.id) as referral_count
            FROM users u
            LEFT JOIN users r ON r.id = u.referred_by
            LEFT JOIN wallets w ON w.user_id = u.id
            WHERE u.full_name ILIKE %s 
               OR u.email ILIKE %s 
               OR u.phone ILIKE %s
               OR u.referral_code ILIKE %s
            ORDER BY u.full_name
            LIMIT 20
        """, (f'%{query}%', f'%{query}%', f'%{query}%', f'%{query}%'))
        
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def get_user_by_id(user_id):
    """Get a user by ID with wallet info"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                u.id, u.full_name, u.email, u.phone,
                u.referral_code, u.payment_status,
                u.referred_by, u.created_at,
                r.full_name as referrer_name,
                r.email as referrer_email,
                w.balance_available,
                w.store_credit,
                w.gross_earnings,
                w.total_withdrawn,
                w.fees_paid,
                w.updated_at as wallet_updated
            FROM users u
            LEFT JOIN users r ON r.id = u.referred_by
            LEFT JOIN wallets w ON w.user_id = u.id
            WHERE u.id = %s
        """, (user_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

def get_user_referrals(user_id):
    """Get all users referred by this user"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                u.id, u.full_name, u.email, u.phone,
                u.payment_status, u.created_at,
                r.id as referral_id,
                r.bonus_amount,
                r.is_paid,
                r.referrer_id
            FROM users u
            LEFT JOIN referrals r ON r.referred_id = u.id
            WHERE u.referred_by = %s
            ORDER BY u.created_at DESC
        """, (user_id,))
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

# ============================================================
# WALLET OPERATIONS
# ============================================================

def add_to_wallet(user_id, amount, wallet_type='balance_available', reason='Admin adjustment'):
    """Add funds to a user's wallet"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(f"""
            UPDATE wallets 
            SET {wallet_type} = {wallet_type} + %s,
                updated_at = NOW()
            WHERE user_id = %s
            RETURNING {wallet_type}
        """, (amount, user_id))
        
        new_balance = cursor.fetchone()[0]
        conn.commit()
        return True, new_balance
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        cursor.close()
        conn.close()

def subtract_from_wallet(user_id, amount, wallet_type='balance_available', reason='Admin adjustment'):
    """Subtract funds from a user's wallet"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check current balance
        cursor.execute(f"""
            SELECT {wallet_type} FROM wallets WHERE user_id = %s
        """, (user_id,))
        current = cursor.fetchone()[0]
        
        if current < amount:
            return False, f"Insufficient balance. Available: {current:,.2f}"
        
        cursor.execute(f"""
            UPDATE wallets 
            SET {wallet_type} = {wallet_type} - %s,
                updated_at = NOW()
            WHERE user_id = %s
            RETURNING {wallet_type}
        """, (amount, user_id))
        
        new_balance = cursor.fetchone()[0]
        conn.commit()
        return True, new_balance
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        cursor.close()
        conn.close()

# ============================================================
# BONUS FIX FUNCTIONS
# ============================================================

def get_bonus_details(referral_id):
    """Get bonus details by referral ID"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                r.id,
                r.referrer_id,
                r.referred_id,
                r.bonus_amount,
                r.is_paid,
                r.referral_type,
                r.created_at,
                u1.full_name as referrer_name,
                u1.email as referrer_email,
                u2.full_name as referred_name,
                u2.email as referred_email,
                u2.payment_status as referred_status,
                w.balance_available,
                w.store_credit,
                w.gross_earnings
            FROM referrals r
            JOIN users u1 ON u1.id = r.referrer_id
            JOIN users u2 ON u2.id = r.referred_id
            LEFT JOIN wallets w ON w.user_id = u1.id
            WHERE r.id = %s
        """, (referral_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

def fix_bonus_to_correct_referrer(referral_id, new_referrer_id):
    """Fix a bonus to point to the correct referrer"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get bonus details
        bonus = get_bonus_details(referral_id)
        if not bonus:
            return False, "Bonus not found"
        
        old_referrer_id = bonus['referrer_id']
        amount = float(bonus['bonus_amount'])
        referred_id = bonus['referred_id']
        
        print(f"\n{Colors.BOLD}Fixing Bonus:{Colors.END}")
        print(f"  Referral ID: {referral_id}")
        print(f"  Amount: MWK {amount:,.2f}")
        print(f"  Old Referrer: {bonus['referrer_name']}")
        print(f"  New Referrer: (will be set)")
        print()
        
        # 1. Remove bonus from old referrer's balance_available
        cursor.execute("""
            UPDATE wallets 
            SET balance_available = balance_available - %s,
                gross_earnings = gross_earnings - %s,
                updated_at = NOW()
            WHERE user_id = %s
        """, (amount, amount, old_referrer_id))
        
        # 2. Add bonus to new referrer's balance_available
        cursor.execute("""
            UPDATE wallets 
            SET balance_available = balance_available + %s,
                gross_earnings = gross_earnings + %s,
                updated_at = NOW()
            WHERE user_id = %s
        """, (amount, amount, new_referrer_id))
        
        # 3. Update referral record
        cursor.execute("""
            UPDATE referrals 
            SET referrer_id = %s
            WHERE id = %s
        """, (new_referrer_id, referral_id))
        
        # 4. Update user's referred_by
        cursor.execute("""
            UPDATE users 
            SET referred_by = %s,
                updated_at = NOW()
            WHERE id = %s
        """, (new_referrer_id, referred_id))
        
        conn.commit()
        return True, "Bonus fixed successfully!"
        
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        cursor.close()
        conn.close()

# ============================================================
# DISPLAY FUNCTIONS
# ============================================================

def display_user_card(user):
    """Display user details in a card format"""
    if not user:
        return
    
    print(f"\n{Colors.BOLD}📋 USER PROFILE{Colors.END}")
    print(f"{'─'*50}")
    print(f"  {Colors.BOLD}Name:{Colors.END} {user['full_name'] or 'N/A'}")
    print(f"  {Colors.BOLD}Email:{Colors.END} {user['email'] or 'N/A'}")
    print(f"  {Colors.BOLD}Phone:{Colors.END} {user['phone'] or 'N/A'}")
    print(f"  {Colors.BOLD}Referral Code:{Colors.END} {user['referral_code'] or 'N/A'}")
    print(f"  {Colors.BOLD}Status:{Colors.END} {user['payment_status'] or 'pending'}")
    print(f"  {Colors.BOLD}Joined:{Colors.END} {user['created_at'].strftime('%Y-%m-%d %H:%M') if user['created_at'] else 'N/A'}")
    print()
    print(f"  {Colors.BOLD}💰 Wallet:{Colors.END}")
    print(f"    {Colors.BOLD}Balance Available (Cash):{Colors.END} MWK {float(user.get('balance_available', 0)):,.2f}")
    print(f"    {Colors.BOLD}Store Credit:{Colors.END} MWK {float(user.get('store_credit', 0)):,.2f}")
    print(f"    {Colors.BOLD}Gross Earnings:{Colors.END} MWK {float(user.get('gross_earnings', 0)):,.2f}")
    print(f"    {Colors.BOLD}Total Withdrawn:{Colors.END} MWK {float(user.get('total_withdrawn', 0)):,.2f}")
    print(f"  {Colors.BOLD}Referrals Made:{Colors.END} {user.get('referral_count', 0)}")
    print(f"  {Colors.BOLD}Current Referrer:{Colors.END} {user.get('referrer_name') or Colors.YELLOW + 'None (Root User)' + Colors.END}")
    print(f"{'─'*50}")

# ============================================================
# INTERACTIVE FUNCTIONS
# ============================================================

def select_user_from_results(results, prompt="Select user"):
    """Show search results and let user select one"""
    if not results:
        print_info("No users found")
        return None
    
    print(f"\n{Colors.BOLD}Search Results:{Colors.END}")
    
    table_data = []
    for i, u in enumerate(results, 1):
        table_data.append([
            i,
            u['full_name'] or 'N/A',
            u['email'] or 'N/A',
            u['phone'] or 'N/A',
            u['referral_code'] or 'N/A',
            u['payment_status'] or 'pending',
            f"MWK {float(u.get('balance_available', 0)):,.0f}",
            f"MWK {float(u.get('store_credit', 0)):,.0f}"
        ])
    
    headers = ['#', 'Name', 'Email', 'Phone', 'Ref Code', 'Status', 'Cash', 'Store Credit']
    print(tabulate(table_data, headers=headers, tablefmt='grid'))
    print()
    
    while True:
        try:
            choice = input(f"{Colors.BOLD}Select user (enter number, or 0 to cancel): {Colors.END}").strip()
            if choice == '0':
                return None
            idx = int(choice) - 1
            if 0 <= idx < len(results):
                return results[idx]
            print_error("Invalid selection")
        except ValueError:
            print_error("Please enter a valid number")

def find_user_interactive(prompt="Find user"):
    """Find a user interactively"""
    clear_screen()
    print_header(f"🔍 {prompt}")
    
    query = input(f"{Colors.BOLD}Enter name, email, phone, or referral code: {Colors.END}").strip()
    
    if not query:
        return None
    
    results = search_users(query)
    return select_user_from_results(results)

# ============================================================
# WALLET MANAGEMENT
# ============================================================

def wallet_management_interactive():
    """Interactive wallet management"""
    clear_screen()
    print_header("💰 WALLET MANAGEMENT")
    
    user = find_user_interactive("Find user to manage wallet")
    if not user:
        return
    
    while True:
        clear_screen()
        print_header(f"💰 WALLET MANAGEMENT: {user['full_name']}")
        display_user_card(user)
        
        print(f"\n{Colors.BOLD}{Colors.CYAN}Actions:{Colors.END}")
        print("  1.  Add Funds (Cash Wallet - balance_available)")
        print("  2.  Subtract Funds (Cash Wallet - balance_available)")
        print("  3.  Add Store Credit")
        print("  4.  Subtract Store Credit")
        print("  5.  View Transaction History")
        print("  0.  Back")
        print()
        
        choice = input(f"{Colors.BOLD}{Colors.CYAN}Choice: {Colors.END}").strip()
        
        if choice == '0':
            break
        elif choice == '1':
            add_funds_interactive(user)
            user = get_user_by_id(user['id'])
        elif choice == '2':
            subtract_funds_interactive(user)
            user = get_user_by_id(user['id'])
        elif choice == '3':
            add_store_credit_interactive(user)
            user = get_user_by_id(user['id'])
        elif choice == '4':
            subtract_store_credit_interactive(user)
            user = get_user_by_id(user['id'])
        elif choice == '5':
            view_user_transactions(user['id'])
        else:
            print_error("Invalid choice")

def add_funds_interactive(user):
    """Add funds to cash wallet"""
    clear_screen()
    print_header("💰 ADD FUNDS (Cash Wallet)")
    
    print(f"User: {user['full_name']}")
    print(f"Current Balance: MWK {float(user.get('balance_available', 0)):,.2f}")
    print()
    
    amount = input(f"{Colors.BOLD}Amount to add (MWK): {Colors.END}").strip()
    if not amount:
        return
    
    try:
        amount = float(amount)
        if amount <= 0:
            print_error("Amount must be positive")
            return
    except:
        print_error("Invalid amount")
        return
    
    reason = input_prompt("Reason", "Admin adjustment")
    
    confirm = input_confirm(f"Add MWK {amount:,.2f} to {user['full_name']}'s cash wallet?")
    if not confirm:
        return
    
    success, result = add_to_wallet(user['id'], amount, 'balance_available', reason)
    
    if success:
        print_success(f"Added MWK {amount:,.2f} to {user['full_name']}'s cash wallet!")
        print_info(f"New balance: MWK {result:,.2f}")
    else:
        print_error(f"Failed: {result}")
    
    input("\nPress Enter to continue...")

def subtract_funds_interactive(user):
    """Subtract funds from cash wallet"""
    clear_screen()
    print_header("💰 SUBTRACT FUNDS (Cash Wallet)")
    
    print(f"User: {user['full_name']}")
    print(f"Current Balance: MWK {float(user.get('balance_available', 0)):,.2f}")
    print()
    
    amount = input(f"{Colors.BOLD}Amount to subtract (MWK): {Colors.END}").strip()
    if not amount:
        return
    
    try:
        amount = float(amount)
        if amount <= 0:
            print_error("Amount must be positive")
            return
    except:
        print_error("Invalid amount")
        return
    
    reason = input_prompt("Reason", "Admin adjustment")
    
    confirm = input_confirm(f"Subtract MWK {amount:,.2f} from {user['full_name']}'s cash wallet?")
    if not confirm:
        return
    
    success, result = subtract_from_wallet(user['id'], amount, 'balance_available', reason)
    
    if success:
        print_success(f"Subtracted MWK {amount:,.2f} from {user['full_name']}'s cash wallet!")
        print_info(f"New balance: MWK {result:,.2f}")
    else:
        print_error(f"Failed: {result}")
    
    input("\nPress Enter to continue...")

def add_store_credit_interactive(user):
    """Add store credit"""
    clear_screen()
    print_header("📚 ADD STORE CREDIT")
    
    print(f"User: {user['full_name']}")
    print(f"Current Store Credit: MWK {float(user.get('store_credit', 0)):,.2f}")
    print()
    
    amount = input(f"{Colors.BOLD}Amount to add (MWK): {Colors.END}").strip()
    if not amount:
        return
    
    try:
        amount = float(amount)
        if amount <= 0:
            print_error("Amount must be positive")
            return
    except:
        print_error("Invalid amount")
        return
    
    reason = input_prompt("Reason", "Admin adjustment")
    
    confirm = input_confirm(f"Add MWK {amount:,.2f} store credit to {user['full_name']}?")
    if not confirm:
        return
    
    success, result = add_to_wallet(user['id'], amount, 'store_credit', reason)
    
    if success:
        print_success(f"Added MWK {amount:,.2f} store credit to {user['full_name']}!")
        print_info(f"New store credit: MWK {result:,.2f}")
    else:
        print_error(f"Failed: {result}")
    
    input("\nPress Enter to continue...")

def subtract_store_credit_interactive(user):
    """Subtract store credit"""
    clear_screen()
    print_header("📚 SUBTRACT STORE CREDIT")
    
    print(f"User: {user['full_name']}")
    print(f"Current Store Credit: MWK {float(user.get('store_credit', 0)):,.2f}")
    print()
    
    amount = input(f"{Colors.BOLD}Amount to subtract (MWK): {Colors.END}").strip()
    if not amount:
        return
    
    try:
        amount = float(amount)
        if amount <= 0:
            print_error("Amount must be positive")
            return
    except:
        print_error("Invalid amount")
        return
    
    reason = input_prompt("Reason", "Admin adjustment")
    
    confirm = input_confirm(f"Subtract MWK {amount:,.2f} store credit from {user['full_name']}?")
    if not confirm:
        return
    
    success, result = subtract_from_wallet(user['id'], amount, 'store_credit', reason)
    
    if success:
        print_success(f"Subtracted MWK {amount:,.2f} store credit from {user['full_name']}!")
        print_info(f"New store credit: MWK {result:,.2f}")
    else:
        print_error(f"Failed: {result}")
    
    input("\nPress Enter to continue...")

def view_user_transactions(user_id):
    """View user transactions"""
    clear_screen()
    print_header("💳 TRANSACTION HISTORY")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                id, transaction_type, amount, 
                balance_before, balance_after,
                description, created_at
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
            print(tabulate(table_data, headers=headers, tablefmt='grid'))
        
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

# ============================================================
# BONUS FIXING
# ============================================================

def bonus_fixing_interactive():
    """Interactive bonus fixing"""
    clear_screen()
    print_header("🔧 BONUS FIXING TOOL")
    
    print("This tool helps you fix referral bonuses that were paid to the wrong person.")
    print()
    
    print("Options:")
    print("  1.  Find bonus by user")
    print("  2.  Fix bonus by referral ID")
    print("  3.  Scan for mismatched bonuses")
    print("  0.  Back")
    print()
    
    choice = input(f"{Colors.BOLD}{Colors.CYAN}Choice: {Colors.END}").strip()
    
    if choice == '1':
        find_bonus_by_user()
    elif choice == '2':
        fix_bonus_by_id()
    elif choice == '3':
        scan_mismatched_bonuses()
    else:
        return

def find_bonus_by_user():
    """Find bonuses for a specific user"""
    clear_screen()
    print_header("🔍 FIND BONUS BY USER")
    
    user = find_user_interactive("Find user to check bonuses")
    if not user:
        return
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                r.id,
                r.referrer_id,
                r.referred_id,
                r.bonus_amount,
                r.is_paid,
                r.referral_type,
                r.created_at,
                u1.full_name as referrer_name,
                u1.email as referrer_email,
                u2.full_name as referred_name,
                u2.email as referred_email
            FROM referrals r
            JOIN users u1 ON u1.id = r.referrer_id
            JOIN users u2 ON u2.id = r.referred_id
            WHERE u2.id = %s
               OR u1.id = %s
            ORDER BY r.created_at DESC
        """, (user['id'], user['id']))
        
        bonuses = cursor.fetchall()
        
        if not bonuses:
            print_info(f"No bonuses found for {user['full_name']}")
        else:
            print(f"\n{Colors.BOLD}Bonuses for {user['full_name']}:{Colors.END}")
            table_data = []
            for b in bonuses:
                status = '✅ Paid' if b['is_paid'] else '⏳ Pending'
                table_data.append([
                    b['id'][:8] + '...',
                    b['referrer_name'] or 'N/A',
                    b['referred_name'] or 'N/A',
                    f"MWK {float(b['bonus_amount'] or 0):,.0f}",
                    b['referral_type'] or 'N/A',
                    status,
                    b['created_at'].strftime('%Y-%m-%d') if b['created_at'] else 'N/A'
                ])
            
            headers = ['ID', 'Referrer', 'Referred', 'Amount', 'Type', 'Status', 'Date']
            print(tabulate(table_data, headers=headers, tablefmt='grid'))
            
            print(f"\n{Colors.DIM}To fix a bonus, use option 2 and enter the referral ID{Colors.END}")
        
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

def fix_bonus_by_id():
    """Fix a bonus by referral ID"""
    clear_screen()
    print_header("🔧 FIX BONUS BY REFERRAL ID")
    
    referral_id = input(f"{Colors.BOLD}Enter referral ID (or 0 to cancel): {Colors.END}").strip()
    if not referral_id or referral_id == '0':
        return
    
    # Get bonus details
    bonus = get_bonus_details(referral_id)
    if not bonus:
        print_error("Bonus not found")
        input("\nPress Enter to continue...")
        return
    
    # Display bonus details
    print(f"\n{Colors.BOLD}Bonus Details:{Colors.END}")
    print(f"  ID: {bonus['id']}")
    print(f"  Referrer: {bonus['referrer_name']}")
    print(f"  Referrer ID: {bonus['referrer_id']}")
    print(f"  Referred: {bonus['referred_name']}")
    print(f"  Amount: MWK {float(bonus['bonus_amount']):,.2f}")
    print(f"  Status: {'Paid' if bonus['is_paid'] else 'Pending'}")
    print(f"  Type: {bonus['referral_type']}")
    
    # Find new referrer
    print(f"\n{Colors.BOLD}Find the correct referrer:{Colors.END}")
    new_referrer = find_user_interactive("Find correct referrer")
    if not new_referrer:
        return
    
    if new_referrer['id'] == bonus['referrer_id']:
        print_warning("This is already the referrer. No change needed.")
        input("\nPress Enter to continue...")
        return
    
    print(f"\n{Colors.BOLD}Summary of Change:{Colors.END}")
    print(f"  Bonus: MWK {float(bonus['bonus_amount']):,.2f}")
    print(f"  From: {bonus['referrer_name']} ({bonus['referrer_email']})")
    print(f"  To:   {new_referrer['full_name']} ({new_referrer['email']})")
    print()
    
    confirm = input(f"{Colors.RED}{Colors.BOLD}Type 'YES' to confirm this fix: {Colors.END}").strip().upper()
    if confirm != 'YES':
        print_info("Cancelled")
        input("\nPress Enter to continue...")
        return
    
    success, message = fix_bonus_to_correct_referrer(referral_id, new_referrer['id'])
    
    if success:
        print_success(message)
        
        # Show updated bonus
        updated = get_bonus_details(referral_id)
        print(f"\n{Colors.BOLD}Updated Bonus:{Colors.END}")
        print(f"  Referrer: {updated['referrer_name']}")
        print(f"  Referred: {updated['referred_name']}")
        print(f"  Amount: MWK {float(updated['bonus_amount']):,.2f}")
        print(f"  Status: {'Paid' if updated['is_paid'] else 'Pending'}")
    else:
        print_error(f"Failed: {message}")
    
    input("\nPress Enter to continue...")

def scan_mismatched_bonuses():
    """Scan for mismatched bonuses"""
    clear_screen()
    print_header("🔍 SCAN FOR MISMATCHED BONUSES")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                r.id as referral_id,
                r.referrer_id as bonus_referrer_id,
                u.referred_by as current_referrer_id,
                r.bonus_amount,
                r.is_paid,
                r.referral_type,
                r.created_at,
                u.full_name as user_name,
                u.email as user_email,
                u1.full_name as bonus_referrer_name,
                u2.full_name as current_referrer_name,
                w.balance_available,
                w.store_credit
            FROM referrals r
            JOIN users u ON u.id = r.referred_id
            JOIN users u1 ON u1.id = r.referrer_id
            LEFT JOIN users u2 ON u2.id = u.referred_by
            LEFT JOIN wallets w ON w.user_id = u1.id
            WHERE r.is_paid = true
              AND r.referrer_id != u.referred_by
              AND u.referred_by IS NOT NULL
            ORDER BY r.created_at DESC
        """)
        
        mismatches = cursor.fetchall()
        
        if not mismatches:
            print_success("✅ No mismatched bonuses found!")
        else:
            print_warning(f"Found {len(mismatches)} mismatched bonuses!")
            print()
            
            table_data = []
            for m in mismatches:
                table_data.append([
                    m['referral_id'][:8] + '...',
                    m['user_name'] or 'N/A',
                    m['bonus_referrer_name'] or 'N/A',
                    m['current_referrer_name'] or 'None',
                    f"MWK {float(m['bonus_amount'] or 0):,.0f}",
                    m['created_at'].strftime('%Y-%m-%d') if m['created_at'] else 'N/A'
                ])
            
            headers = ['Ref ID', 'User', 'Paid To', 'Should Be', 'Amount', 'Date']
            print(tabulate(table_data, headers=headers, tablefmt='grid'))
            
            print(f"\n{Colors.DIM}To fix, use option 2 and enter the referral ID{Colors.END}")
        
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

# ============================================================
# INPUT HELPERS
# ============================================================

def input_prompt(prompt, default=""):
    if default:
        prompt = f"{prompt} [{default}]: "
    else:
        prompt = f"{prompt}: "
    result = input(f"{Colors.BOLD}{prompt}{Colors.END}").strip()
    return result if result else default

def input_confirm(prompt):
    return input(f"{Colors.YELLOW}{prompt} (y/n): {Colors.END}").lower() == 'y'

# ============================================================
# MAIN MENU
# ============================================================

def main_menu():
    while True:
        clear_screen()
        print_header("🏦 WALLET & BONUS MANAGEMENT TOOL")
        
        print(f"{Colors.BOLD}{Colors.CYAN}Wallet Management:{Colors.END}")
        print("  1.  Manage User Wallet (Add/Subtract Funds)")
        print("  2.  Add Funds (Quick)")
        print("  3.  Subtract Funds (Quick)")
        print()
        
        print(f"{Colors.BOLD}{Colors.CYAN}Bonus Management:{Colors.END}")
        print("  4.  Fix Referral Bonus")
        print("  5.  Scan for Mismatched Bonuses")
        print("  6.  View User Bonuses")
        print()
        
        print(f"{Colors.BOLD}{Colors.CYAN}Reports:{Colors.END}")
        print("  7.  View User Transactions")
        print()
        
        print("  0.  Exit")
        print()
        
        choice = input(f"{Colors.BOLD}{Colors.CYAN}Enter your choice: {Colors.END}").strip()
        
        if choice == '0':
            print_info("Goodbye! 👋")
            break
        elif choice == '1':
            wallet_management_interactive()
        elif choice == '2':
            user = find_user_interactive("Find user to add funds")
            if user:
                add_funds_interactive(user)
        elif choice == '3':
            user = find_user_interactive("Find user to subtract funds")
            if user:
                subtract_funds_interactive(user)
        elif choice == '4':
            bonus_fixing_interactive()
        elif choice == '5':
            scan_mismatched_bonuses()
        elif choice == '6':
            find_bonus_by_user()
        elif choice == '7':
            user = find_user_interactive("Find user to view transactions")
            if user:
                view_user_transactions(user['id'])
        else:
            print_error("Invalid choice")

# ============================================================
# RUN
# ============================================================

if __name__ == '__main__':
    try:
        main_menu()
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
        sys.exit(0)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)
