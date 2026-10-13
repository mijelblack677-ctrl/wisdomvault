#!/usr/bin/env python3
"""
Wisdom Vault - Bonus Verification & Fix Tool
Check if referral bonuses were paid to the correct person
"""

import os
import sys
import psycopg2
import psycopg2.extras
from datetime import datetime
from tabulate import tabulate

from db_config import (
    get_db_connection, Colors, print_success, print_error, print_warning,
    print_info, print_header, clear_screen
)

# ============================================================
# VERIFICATION FUNCTIONS
# ============================================================

def find_user(identifier):
    """Find a user by email, phone, or name"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                u.id, u.full_name, u.email, u.phone,
                u.referral_code, u.payment_status,
                u.referred_by, u.created_at,
                r.full_name as referrer_name,
                r.email as referrer_email
            FROM users u
            LEFT JOIN users r ON r.id = u.referred_by
            WHERE u.email ILIKE %s 
               OR u.phone ILIKE %s 
               OR u.full_name ILIKE %s
               OR u.referral_code ILIKE %s
            LIMIT 10
        """, (f'%{identifier}%', f'%{identifier}%', f'%{identifier}%', f'%{identifier}%'))
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def check_bonus_for_user(user_id):
    """Check bonus details for a specific user"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                r.id as referral_id,
                r.referrer_id,
                r.referred_id,
                r.bonus_amount,
                r.is_paid,
                r.referral_type,
                r.created_at as referral_date,
                u.full_name as referrer_name,
                u.email as referrer_email,
                u2.full_name as referred_name,
                u2.email as referred_email,
                u2.payment_status as referred_status,
                w.store_credit,
                w.balance_available
            FROM referrals r
            JOIN users u ON u.id = r.referrer_id
            JOIN users u2 ON u2.id = r.referred_id
            LEFT JOIN wallets w ON w.user_id = r.referrer_id
            WHERE r.referred_id = %s
               OR r.referrer_id = %s
            ORDER BY r.created_at DESC
        """, (user_id, user_id))
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def get_all_referrals(limit=100):
    """Get all referrals with status"""
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
                w.store_credit
            FROM referrals r
            JOIN users u1 ON u1.id = r.referrer_id
            JOIN users u2 ON u2.id = r.referred_id
            LEFT JOIN wallets w ON w.user_id = r.referrer_id
            ORDER BY r.created_at DESC
            LIMIT %s
        """, (limit,))
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def get_paid_bonuses_with_wrong_referrer():
    """Find paid bonuses where the referrer doesn't match the current referred_by"""
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
                w.store_credit,
                w.balance_available
            FROM referrals r
            JOIN users u ON u.id = r.referred_id
            JOIN users u1 ON u1.id = r.referrer_id
            LEFT JOIN users u2 ON u2.id = u.referred_by
            LEFT JOIN wallets w ON w.user_id = r.referrer_id
            WHERE r.is_paid = true
              AND r.referrer_id != u.referred_by
              AND u.referred_by IS NOT NULL
            ORDER BY r.created_at DESC
        """)
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def get_unpaid_bonuses_for_verified_referrers():
    """Find unpaid bonuses where the referred user is verified but the bonus
    was not paid to a verified referrer.
    
    This catches the bug where verified client bonuses were not appended
    to the referrer's account.
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                r.id as referral_id,
                r.referrer_id,
                r.referred_id,
                r.bonus_amount,
                r.is_paid,
                r.referral_type,
                r.created_at,
                u1.full_name as referrer_name,
                u1.email as referrer_email,
                u1.payment_status as referrer_status,
                u2.full_name as referred_name,
                u2.email as referred_email,
                u2.payment_status as referred_status,
                w.store_credit,
                w.balance_available
            FROM referrals r
            JOIN users u1 ON u1.id = r.referrer_id
            JOIN users u2 ON u2.id = r.referred_id
            LEFT JOIN wallets w ON w.user_id = r.referrer_id
            WHERE r.is_paid = false
              AND u2.payment_status = 'verified'
              AND u1.payment_status = 'verified'
            ORDER BY r.created_at DESC
        """)
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def get_unpaid_bonuses():
    """Get all unpaid bonuses"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                r.id,
                r.referrer_id,
                r.referred_id,
                r.bonus_amount,
                r.referral_type,
                r.created_at,
                u1.full_name as referrer_name,
                u1.email as referrer_email,
                u2.full_name as referred_name,
                u2.email as referred_email,
                u2.payment_status as referred_status
            FROM referrals r
            JOIN users u1 ON u1.id = r.referrer_id
            JOIN users u2 ON u2.id = r.referred_id
            WHERE r.is_paid = false
            ORDER BY r.created_at DESC
        """)
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

# ============================================================
# FIX FUNCTIONS
# ============================================================

def fix_bonus_referrer(referral_id, new_referrer_id, bonus_amount):
    """Fix a bonus by changing it to the correct referrer"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get old referrer info
        cursor.execute("""
            SELECT referrer_id, referred_id FROM referrals WHERE id = %s
        """, (referral_id,))
        old = cursor.fetchone()
        old_referrer_id = old[0]
        referred_id = old[1]
        
        print(f"\n{Colors.BOLD}Fixing Bonus:{Colors.END}")
        print(f"  Referral ID: {referral_id}")
        print(f"  Old Referrer: {old_referrer_id}")
        print(f"  New Referrer: {new_referrer_id}")
        print(f"  Amount: MWK {bonus_amount:,.2f}")
        print()
        
        confirm = input(f"{Colors.YELLOW}Confirm fix? (y/n): {Colors.END}").lower()
        if confirm != 'y':
            print_info("Cancelled")
            return False
        
        # 1. Remove bonus from old referrer
        cursor.execute("""
            UPDATE wallets 
            SET store_credit = store_credit - %s,
                gross_earnings = gross_earnings - %s
            WHERE user_id = %s
        """, (bonus_amount, bonus_amount, old_referrer_id))
        
        # 2. Add bonus to new referrer
        cursor.execute("""
            UPDATE wallets 
            SET store_credit = store_credit + %s,
                gross_earnings = gross_earnings + %s
            WHERE user_id = %s
        """, (bonus_amount, bonus_amount, new_referrer_id))
        
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
        print_success(f"Bonus fixed successfully!")
        print_info(f"MWK {bonus_amount:,.2f} moved from old referrer to new referrer")
        return True
        
    except Exception as e:
        conn.rollback()
        print_error(f"Failed to fix bonus: {e}")
        return False
    finally:
        cursor.close()
        conn.close()

# ============================================================
# DISPLAY FUNCTIONS
# ============================================================

def display_referral_table(referrals, title="Referrals"):
    """Display referrals in a table"""
    if not referrals:
        print_info("No referrals found")
        return
    
    table_data = []
    for r in referrals:
        status_color = Colors.GREEN if r.get('is_paid') else Colors.YELLOW
        table_data.append([
            r['id'][:8] + '...',
            r.get('referrer_name', 'N/A')[:20],
            r.get('referred_name', 'N/A')[:20],
            f"MWK {float(r['bonus_amount'] or 0):,.0f}",
            r.get('referral_type', 'N/A'),
            f"{status_color}{'✅ Paid' if r.get('is_paid') else '⏳ Pending'}{Colors.END}",
            r.get('created_at').strftime('%Y-%m-%d') if r.get('created_at') else 'N/A'
        ])
    
    headers = ['ID', 'Referrer', 'Referred', 'Amount', 'Type', 'Status', 'Date']
    print(tabulate(table_data, headers=headers, tablefmt='grid'))
    print(f"\nTotal: {len(referrals)} referrals")

def display_mismatched_bonuses(mismatches):
    """Display bonuses paid to wrong referrer"""
    if not mismatches:
        print_success("✅ No mismatched bonuses found!")
        return
    
    print(f"{Colors.RED}{Colors.BOLD}⚠️  Found {len(mismatches)} bonuses paid to wrong referrer!{Colors.END}")
    print()
    
    table_data = []
    for m in mismatches:
        table_data.append([
            m['user_name'] or 'N/A',
            m['user_email'] or 'N/A',
            m['bonus_referrer_name'] or 'N/A',
            m['current_referrer_name'] or 'None',
            f"MWK {float(m['bonus_amount'] or 0):,.0f}",
            m['created_at'].strftime('%Y-%m-%d') if m['created_at'] else 'N/A'
        ])
    
    headers = ['User', 'Email', 'Bonus Paid To', 'Current Referrer', 'Amount', 'Date']
    print(tabulate(table_data, headers=headers, tablefmt='grid'))

# ============================================================
# INTERACTIVE FUNCTIONS
# ============================================================

def check_user_bonus():
    """Check bonus for a specific user"""
    clear_screen()
    print_header("🔍 CHECK USER BONUS")
    
    identifier = input(f"{Colors.BOLD}Enter user email, phone, or name: {Colors.END}").strip()
    if not identifier:
        return
    
    users = find_user(identifier)
    
    if not users:
        print_error("User not found")
        input("\nPress Enter to continue...")
        return
    
    if len(users) > 1:
        print(f"\n{Colors.BOLD}Multiple users found:{Colors.END}")
        table_data = []
        for i, u in enumerate(users, 1):
            table_data.append([
                i,
                u['full_name'] or 'N/A',
                u['email'] or 'N/A',
                u['phone'] or 'N/A',
                u['payment_status'] or 'pending'
            ])
        headers = ['#', 'Name', 'Email', 'Phone', 'Status']
        print(tabulate(table_data, headers=headers, tablefmt='grid'))
        print()
        
        try:
            choice = int(input(f"{Colors.BOLD}Select user (number): {Colors.END}"))
            if choice < 1 or choice > len(users):
                print_error("Invalid selection")
                return
            user = users[choice - 1]
        except:
            print_error("Invalid input")
            return
    else:
        user = users[0]
    
    print(f"\n{Colors.BOLD}Checking bonuses for: {user['full_name']}{Colors.END}")
    print(f"  Current Referrer: {user.get('referrer_name') or 'None (Root)'}")
    print()
    
    bonuses = check_bonus_for_user(user['id'])
    
    if not bonuses:
        print_info("No referral bonuses found for this user")
    else:
        display_referral_table(bonuses, f"Bonuses for {user['full_name']}")
    
    input("\nPress Enter to continue...")

def scan_for_mismatches():
    """Scan for bonuses paid to wrong referrer"""
    clear_screen()
    print_header("🔍 SCAN FOR MISMATCHED BONUSES")
    
    print("Scanning for bonuses paid to wrong referrer...")
    print()
    
    mismatches = get_paid_bonuses_with_wrong_referrer()
    display_mismatched_bonuses(mismatches)
    
    if mismatches:
        print(f"\n{Colors.BOLD}Options:{Colors.END}")
        print("  1. Fix a specific mismatch")
        print("  2. Fix all mismatches")
        print("  0. Back")
        
        choice = input(f"\n{Colors.BOLD}Choice: {Colors.END}").strip()
        
        if choice == '1':
            fix_specific_mismatch(mismatches)
        elif choice == '2':
            fix_all_mismatches(mismatches)
    
    input("\nPress Enter to continue...")

def fix_specific_mismatch(mismatches):
    """Fix a specific mismatch"""
    print(f"\n{Colors.BOLD}Select mismatch to fix:{Colors.END}")
    for i, m in enumerate(mismatches, 1):
        print(f"  {i}. {m['user_name']} - Paid to: {m['bonus_referrer_name']} -> Should be: {m['current_referrer_name'] or 'None'}")
    
    print("  0. Cancel")
    print()
    
    try:
        choice = int(input(f"{Colors.BOLD}Choice: {Colors.END}"))
        if choice == 0:
            return
        if choice < 1 or choice > len(mismatches):
            print_error("Invalid selection")
            return
        
        m = mismatches[choice - 1]
        
        if not m['current_referrer_id']:
            print_warning("This user has no current referrer. Cannot fix.")
            return
        
        fix_bonus_referrer(
            m['referral_id'],
            m['current_referrer_id'],
            float(m['bonus_amount'])
        )
        
    except ValueError:
        print_error("Invalid input")

def fix_all_mismatches(mismatches):
    """Fix all mismatches"""
    print(f"\n{Colors.RED}{Colors.BOLD}⚠️  This will fix ALL {len(mismatches)} mismatches!{Colors.END}")
    confirm = input(f"{Colors.YELLOW}Continue? (y/n): {Colors.END}").lower()
    if confirm != 'y':
        return
    
    fixed = 0
    failed = 0
    
    for m in mismatches:
        if not m['current_referrer_id']:
            print_warning(f"Skipping {m['user_name']} - No current referrer")
            failed += 1
            continue
        
        if fix_bonus_referrer(
            m['referral_id'],
            m['current_referrer_id'],
            float(m['bonus_amount'])
        ):
            fixed += 1
        else:
            failed += 1
    
    print(f"\n{Colors.BOLD}Summary:{Colors.END}")
    print(f"  ✅ Fixed: {fixed}")
    print(f"  ❌ Failed: {failed}")

def view_all_referrals():
    """View all referrals"""
    clear_screen()
    print_header("📤 ALL REFERRALS")
    
    referrals = get_all_referrals(100)
    display_referral_table(referrals)
    
    input("\nPress Enter to continue...")

def view_unpaid_bonuses():
    """View all unpaid bonuses"""
    clear_screen()
    print_header("⏳ UNPAID BONUSES")
    
    unpaid = get_unpaid_bonuses()
    
    if not unpaid:
        print_success("✅ All bonuses are paid!")
    else:
        print_warning(f"Found {len(unpaid)} unpaid bonuses")
        print()
        display_referral_table(unpaid, "Unpaid Bonuses")
    
    input("\nPress Enter to continue...")

def view_unpaid_bonuses_for_verified_referrers():
    """View unpaid bonuses where referred user is verified but bonus not paid
    to verified referrer - this is the bug pattern we're fixing.
    """
    clear_screen()
    print_header("🔍 UNPAID BONUSES FOR VERIFIED REFERRERS")
    
    print("Scanning for bonuses where the referred user is verified but the bonus")
    print("was not paid to the verified referrer...")
    print()
    
    unpaid = get_unpaid_bonuses_for_verified_referrers()
    
    if not unpaid:
        print_success("✅ No unpaid bonuses for verified referrers found!")
        print_info("All verified users' referrals have been properly paid.")
    else:
        print_warning(f"⚠️  Found {len(unpaid)} unpaid bonuses that should have been paid!")
        print()
        print("These are bonuses that should have been appended to the referrer's")
        print("account when their referred client verified, but weren't.")
        print()
        display_referral_table(unpaid, "Missing Bonuses")
        
        print(f"\n{Colors.BOLD}Options:{Colors.END}")
        print("  1. Fix all these missing bonuses")
        print("  0. Back")
        
        choice = input(f"\n{Colors.BOLD}Choice: {Colors.END}").strip()
        
        if choice == '1':
            fix_missing_bonuses(unpaid)
    
    input("\nPress Enter to continue...")

def fix_missing_bonuses(unpaid):
    """Fix all missing bonuses for verified referrers"""
    print(f"\n{Colors.RED}{Colors.BOLD}⚠️  This will fix ALL {len(unpaid)} missing bonuses!{Colors.END}")
    confirm = input(f"{Colors.YELLOW}Continue? (y/n): {Colors.END}").lower()
    if confirm != 'y':
        return
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    fixed = 0
    failed = 0
    
    try:
        for r in unpaid:
            try:
                # Mark as paid
                cursor.execute("""
                    UPDATE referrals SET is_paid = true
                    WHERE id = %s
                """, (r['referral_id'],))
                
                # Add to referrer's wallet
                cursor.execute("""
                    UPDATE wallets 
                    SET store_credit = store_credit + %s,
                        gross_earnings = gross_earnings + %s
                    WHERE user_id = %s
                """, (r['bonus_amount'], r['bonus_amount'], r['referrer_id']))
                
                fixed += 1
            except Exception as e:
                print_error(f"Failed to fix bonus {r['referral_id']}: {e}")
                failed += 1
        
        conn.commit()
        
        print(f"\n{Colors.BOLD}Summary:{Colors.END}")
        print(f"  ✅ Fixed: {fixed}")
        print(f"  ❌ Failed: {failed}")
        
        if fixed > 0:
            print_success(f"Successfully credited MWK {sum(float(r['bonus_amount']) for r in unpaid):,.2f} to referrers!")
            
    except Exception as e:
        conn.rollback()
        print_error(f"Error: {e}")
    finally:
        cursor.close()
        conn.close()

# ============================================================
# MAIN MENU
# ============================================================

def main_menu():
    while True:
        clear_screen()
        print_header("🔍 BONUS VERIFICATION & FIX TOOL")
        
        print(f"{Colors.BOLD}{Colors.CYAN}Verification:{Colors.END}")
        print("  1.  Check bonus for a specific user")
        print("  2.  Scan for mismatched bonuses (paid to wrong referrer)")
        print("  3.  View all referrals")
        print("  4.  View unpaid bonuses")
        print("  5.  View unpaid bonuses for verified referrers (BUG CHECK)")
        print()
        
        print(f"{Colors.BOLD}{Colors.CYAN}Fixes:{Colors.END}")
        print("  6.  Fix a mismatched bonus")
        print("  0.  Exit")
        print()
        
        choice = input(f"{Colors.BOLD}{Colors.CYAN}Enter your choice: {Colors.END}").strip()
        
        if choice == '0':
            print_info("Goodbye! 👋")
            break
        elif choice == '1':
            check_user_bonus()
        elif choice == '2':
            scan_for_mismatches()
        elif choice == '3':
            view_all_referrals()
        elif choice == '4':
            view_unpaid_bonuses()
        elif choice == '5':
            # Fix specific mismatch directly
            scan_for_mismatches()
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
