#!/usr/bin/env python3
"""
Wisdom Vault - Referral Changer Tool
Change a user's referrer (referred_by) interactively with full warnings
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

def print_subheader(title):
    print(f"\n{Colors.BOLD}{Colors.YELLOW}{title}{Colors.END}")
    print(f"{Colors.YELLOW}{'-'*50}{Colors.END}")

# ============================================================
# DATABASE FUNCTIONS
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
                r.email as referrer_email,
                (SELECT COUNT(*) FROM users WHERE referred_by = u.id) as referral_count
            FROM users u
            LEFT JOIN users r ON r.id = u.referred_by
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
    """Get a user by ID"""
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
                (SELECT COUNT(*) FROM users WHERE referred_by = u.id) as referral_count
            FROM users u
            LEFT JOIN users r ON r.id = u.referred_by
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
                r.is_paid, r.bonus_amount
            FROM users u
            LEFT JOIN referrals r ON r.referred_id = u.id AND r.referrer_id = %s
            WHERE u.referred_by = %s
            ORDER BY u.created_at DESC
        """, (user_id, user_id))
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def check_bonus_status(user_id):
    """Check if any bonuses have been paid for this user"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                r.id,
                r.bonus_amount,
                r.is_paid,
                r.referrer_id,
                u.full_name as referrer_name,
                r.created_at
            FROM referrals r
            JOIN users u ON u.id = r.referrer_id
            WHERE r.referred_id = %s
            AND r.referral_type = 'first_level'
        """, (user_id,))
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def change_referrer(user_id, new_referrer_id):
    """Change a user's referrer"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE users 
            SET referred_by = %s,
                updated_at = NOW()
            WHERE id = %s
            RETURNING full_name
        """, (new_referrer_id, user_id))
        
        user_name = cursor.fetchone()[0]
        conn.commit()
        return True, user_name
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        cursor.close()
        conn.close()

def make_root_user(user_id):
    """Remove a user's referrer (make root)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE users 
            SET referred_by = NULL,
                updated_at = NOW()
            WHERE id = %s
            RETURNING full_name
        """, (user_id,))
        
        user_name = cursor.fetchone()[0]
        conn.commit()
        return True, user_name
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
    print(f"  {Colors.BOLD}Referrals Made:{Colors.END} {user.get('referral_count', 0)}")
    print(f"  {Colors.BOLD}Current Referrer:{Colors.END} {user.get('referrer_name') or Colors.YELLOW + 'None (Root User)' + Colors.END}")
    print(f"{'─'*50}")

def display_referral_warning(bonus_info, user, current_referrer, new_referrer):
    """Display warning about bonus implications"""
    print(f"\n{Colors.RED}{Colors.BOLD}{'='*70}{Colors.END}")
    print(f"{Colors.RED}{Colors.BOLD}⚠️  BONUS IMPLICATION WARNING ⚠️{Colors.END}")
    print(f"{Colors.RED}{Colors.BOLD}{'='*70}{Colors.END}")
    
    print(f"\n{Colors.YELLOW}This change will affect WHO receives the bonus when {user['full_name']} verifies!{Colors.END}")
    print()
    
    # Show bonus status
    if bonus_info:
        for bonus in bonus_info:
            if bonus['is_paid']:
                print(f"{Colors.RED}⚠️  A bonus of MWK {float(bonus['bonus_amount']):,.2f} has ALREADY BEEN PAID to {bonus['referrer_name']}!{Colors.END}")
                print(f"{Colors.RED}   This bonus will NOT be taken back or transferred.{Colors.END}")
            else:
                print(f"{Colors.YELLOW}⏳  A bonus of MWK {float(bonus['bonus_amount']):,.2f} is PENDING for {bonus['referrer_name']}{Colors.END}")
                print(f"{Colors.YELLOW}   Changing the referrer will transfer this bonus opportunity to the new referrer!{Colors.END}")
    else:
        print(f"{Colors.GREEN}✅ No referral bonus found for this user yet.{Colors.END}")
        print(f"{Colors.GREEN}   The new referrer will receive the bonus when the user verifies.{Colors.END}")
    
    print(f"\n{Colors.BOLD}{'─'*70}{Colors.END}")
    print(f"  {Colors.YELLOW}Current Referrer:{Colors.END} {current_referrer or 'None (Root)'}")
    print(f"  {Colors.GREEN}New Referrer:{Colors.END}     {new_referrer}")
    print(f"{Colors.BOLD}{'─'*70}{Colors.END}")
    
    print(f"\n{Colors.RED}⚠️  CONFIRM:{Colors.END}")
    print(f"  1. Past bonuses will NOT be reversed")
    print(f"  2. Future bonuses will go to the new referrer")
    print(f"  3. Referral counts will transfer to the new referrer")
    print(f"  4. This change is PERMANENT")
    print()

def display_change_summary(user, old_referrer, new_referrer):
    """Display summary after change"""
    print(f"\n{Colors.GREEN}{Colors.BOLD}{'='*70}{Colors.END}")
    print(f"{Colors.GREEN}{Colors.BOLD}✅ REFERRAL CHANGE COMPLETE{Colors.END}")
    print(f"{Colors.GREEN}{Colors.BOLD}{'='*70}{Colors.END}")
    
    print(f"\n{Colors.BOLD}User:{Colors.END} {user['full_name']}")
    print(f"{Colors.BOLD}Old Referrer:{Colors.END} {old_referrer or 'None (Root)'}")
    print(f"{Colors.BOLD}New Referrer:{Colors.END} {new_referrer}")
    print(f"\n{Colors.GREEN}✅ Referrer updated successfully!{Colors.END}")
    print(f"{Colors.YELLOW}⚠️  Remember: Dashboard may need a hard refresh to show the change.{Colors.END}")

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
        referrer = u.get('referrer_name') or 'None (Root)'
        status_color = Colors.GREEN if u['payment_status'] == 'verified' else Colors.YELLOW
        table_data.append([
            i,
            u['full_name'] or 'N/A',
            u['email'] or 'N/A',
            u['phone'] or 'N/A',
            u['referral_code'] or 'N/A',
            f"{status_color}{u['payment_status'] or 'pending'}{Colors.END}",
            referrer,
            u.get('referral_count', 0)
        ])
    
    headers = ['#', 'Name', 'Email', 'Phone', 'Ref Code', 'Status', 'Referrer', 'Refs']
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

def find_new_referrer_interactive(exclude_user_id):
    """Find the new referrer"""
    clear_screen()
    print_header("🔍 FIND NEW REFERRER")
    
    query = input(f"{Colors.BOLD}Enter name, email, or referral code of new referrer: {Colors.END}").strip()
    
    if not query:
        return None
    
    results = search_users(query)
    
    # Filter out the user themselves
    results = [r for r in results if r['id'] != exclude_user_id]
    
    if not results:
        print_info("No other users found")
        return None
    
    return select_user_from_results(results, "Select new referrer")

# ============================================================
# MAIN CHANGE FUNCTION
# ============================================================

def change_referrer_interactive():
    """Interactive flow to change a user's referrer"""
    clear_screen()
    print_header("🔄 CHANGE REFERRER")
    
    # Step 1: Find user
    print("Step 1: Find the user whose referrer you want to change")
    print()
    user = find_user_interactive("Find user to modify")
    if not user:
        return
    
    # Step 2: Get bonus status
    bonus_info = check_bonus_status(user['id'])
    
    # Step 3: Display user info
    clear_screen()
    print_header("👤 USER FOUND")
    display_user_card(user)
    
    # Step 4: Find new referrer
    print(f"\nStep 2: Choose the new referrer")
    print()
    new_referrer = find_new_referrer_interactive(user['id'])
    if not new_referrer:
        return
    
    # Step 5: Display warning
    clear_screen()
    print_header("⚠️ BONUS IMPLICATION WARNING")
    
    current_referrer = user.get('referrer_name') or 'None (Root)'
    new_referrer_name = new_referrer['full_name']
    
    display_referral_warning(bonus_info, user, current_referrer, new_referrer_name)
    
    # Step 6: Final confirmation
    print(f"\n{Colors.RED}{Colors.BOLD}FINAL CONFIRMATION{Colors.END}")
    print(f"  User: {user['full_name']}")
    print(f"  Current Referrer: {current_referrer}")
    print(f"  New Referrer: {new_referrer_name}")
    print()
    
    confirm = input(f"{Colors.RED}{Colors.BOLD}Type 'YES' to confirm this change: {Colors.END}").strip().upper()
    if confirm != 'YES':
        print_info("Change cancelled")
        input("\nPress Enter to continue...")
        return
    
    # Step 7: Apply the change
    success, result = change_referrer(user['id'], new_referrer['id'])
    
    if success:
        # Refresh user data
        updated_user = get_user_by_id(user['id'])
        display_change_summary(updated_user, current_referrer, new_referrer_name)
        
        print(f"\n{Colors.DIM}💡 Tip: Users may need to refresh their dashboard to see the change.{Colors.END}")
    else:
        print_error(f"Failed to change referrer: {result}")
    
    input("\nPress Enter to continue...")

def remove_referrer_interactive():
    """Remove a user's referrer (make root)"""
    clear_screen()
    print_header("🗑️ REMOVE REFERRER")
    
    print("Find the user whose referrer you want to remove")
    print()
    user = find_user_interactive("Find user to make root")
    if not user:
        return
    
    # Get bonus status
    bonus_info = check_bonus_status(user['id'])
    
    clear_screen()
    print_header("👤 USER FOUND")
    display_user_card(user)
    
    print(f"\n{Colors.RED}{Colors.BOLD}⚠️  WARNING: This will make {user['full_name']} a ROOT user (no referrer){Colors.END}")
    print(f"{Colors.YELLOW}   This means NO ONE will receive a bonus when this user verifies!{Colors.END}")
    
    if bonus_info:
        for bonus in bonus_info:
            if bonus['is_paid']:
                print(f"{Colors.RED}   ⚠️  Bonus already paid to {bonus['referrer_name']} - will not be reversed{Colors.END}")
            else:
                print(f"{Colors.YELLOW}   ⚠️  Pending bonus of MWK {float(bonus['bonus_amount']):,.2f} will be LOST!{Colors.END}")
    
    print()
    confirm = input(f"{Colors.RED}{Colors.BOLD}Type 'YES' to confirm: {Colors.END}").strip().upper()
    if confirm != 'YES':
        print_info("Cancelled")
        input("\nPress Enter to continue...")
        return
    
    success, result = make_root_user(user['id'])
    
    if success:
        print_success(f"Referrer removed! {user['full_name']} is now a root user.")
    else:
        print_error(f"Failed: {result}")
    
    input("\nPress Enter to continue...")

def view_user_interactive():
    """View user details"""
    clear_screen()
    print_header("👤 VIEW USER")
    
    user = find_user_interactive("View user details")
    if not user:
        return
    
    clear_screen()
    print_header(f"👤 USER DETAILS")
    display_user_card(user)
    
    # Show referrals
    referrals = get_user_referrals(user['id'])
    if referrals:
        print(f"\n{Colors.BOLD}📤 Users Referred by {user['full_name']}:{Colors.END}")
        table_data = []
        for r in referrals:
            table_data.append([
                r['full_name'] or 'N/A',
                r['email'] or 'N/A',
                r['payment_status'] or 'pending',
                '✅' if r.get('is_paid') else '⏳',
                f"MWK {float(r.get('bonus_amount') or 0):,.0f}" if r.get('bonus_amount') else 'N/A',
                r['created_at'].strftime('%Y-%m-%d') if r['created_at'] else 'N/A'
            ])
        headers = ['Name', 'Email', 'Status', 'Bonus Paid', 'Amount', 'Date']
        print(tabulate(table_data, headers=headers, tablefmt='grid'))
    
    print(f"\n{Colors.DIM}Press Enter to continue...{Colors.END}")
    input()

# ============================================================
# MAIN MENU
# ============================================================

def main_menu():
    while True:
        clear_screen()
        print_header("🔄 REFERRAL CHANGER TOOL")
        
        print(f"{Colors.BOLD}{Colors.CYAN}What would you like to do?{Colors.END}")
        print("  1.  Change a user's referrer (with warnings)")
        print("  2.  Remove a user's referrer (make root)")
        print("  3.  View user details and referrals")
        print("  0.  Exit")
        print()
        
        choice = input(f"{Colors.BOLD}{Colors.CYAN}Enter your choice: {Colors.END}").strip()
        
        if choice == '0':
            print_info("Goodbye! 👋")
            break
        elif choice == '1':
            change_referrer_interactive()
        elif choice == '2':
            remove_referrer_interactive()
        elif choice == '3':
            view_user_interactive()
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
