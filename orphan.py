#!/usr/bin/env python3
"""
Wisdom Vault - Verified Orphans Checker
Find verified users with no parent (referred_by is NULL or invalid)
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
# COLORS
# ============================================================

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.END}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.END}")

def print_header(title):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{title.center(70)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*70}{Colors.END}\n")

def clear_screen():
    os.system('clear' if os.name == 'posix' else 'cls')

# ============================================================
# MAIN CHECK
# ============================================================

def check_verified_orphans():
    print_header("🔍 VERIFIED ORPHANS CHECKER")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # ============================================================
        # 1. Check verified users with no parent (referred_by is NULL)
        # ============================================================
        print(f"{Colors.BOLD}{Colors.CYAN}1. VERIFIED USERS WITH NO PARENT{Colors.END}")
        print(f"{Colors.DIM}(referred_by is NULL){Colors.END}\n")
        
        cursor.execute("""
            SELECT 
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.referral_code,
                u.referred_by,
                u.created_at,
                u.payment_status,
                w.balance_available,
                w.store_credit,
                w.gross_earnings,
                COUNT(r.id) as referrals_made
            FROM users u
            LEFT JOIN wallets w ON w.user_id = u.id
            LEFT JOIN referrals r ON r.referrer_id = u.id
            WHERE u.payment_status = 'verified'
              AND u.referred_by IS NULL
            GROUP BY u.id, u.full_name, u.email, u.phone, u.referral_code, 
                     u.referred_by, u.created_at, u.payment_status,
                     w.balance_available, w.store_credit, w.gross_earnings
            ORDER BY u.created_at DESC
        """)
        
        orphans = cursor.fetchall()
        
        if orphans:
            print_warning(f"Found {len(orphans)} verified orphans (no parent)")
            print()
            
            table_data = []
            for o in orphans:
                table_data.append([
                    o['full_name'] or 'N/A',
                    o['email'] or 'N/A',
                    o['phone'] or 'N/A',
                    o['referral_code'] or 'N/A',
                    f"MWK {float(o['balance_available'] or 0):,.0f}",
                    o['referrals_made'] or 0,
                    o['created_at'].strftime('%Y-%m-%d') if o['created_at'] else 'N/A'
                ])
            
            headers = ['Name', 'Email', 'Phone', 'Referral Code', 'Balance', 'Referrals', 'Joined']
            print(tabulate(table_data, headers=headers, tablefmt='grid'))
            print()
        else:
            print_success("No verified users without parents found!")
        
        print(f"\n{'='*70}\n")
        
        # ============================================================
        # 2. Check verified users with invalid parent (parent doesn't exist)
        # ============================================================
        print(f"{Colors.BOLD}{Colors.CYAN}2. VERIFIED USERS WITH INVALID PARENT{Colors.END}")
        print(f"{Colors.DIM}(referred_by points to non-existent user){Colors.END}\n")
        
        cursor.execute("""
            SELECT 
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.referral_code,
                u.referred_by,
                u.created_at,
                u.payment_status,
                w.balance_available,
                w.store_credit,
                w.gross_earnings,
                COUNT(r.id) as referrals_made
            FROM users u
            LEFT JOIN wallets w ON w.user_id = u.id
            LEFT JOIN referrals r ON r.referrer_id = u.id
            LEFT JOIN users parent ON parent.id = u.referred_by
            WHERE u.payment_status = 'verified'
              AND u.referred_by IS NOT NULL
              AND parent.id IS NULL
            GROUP BY u.id, u.full_name, u.email, u.phone, u.referral_code, 
                     u.referred_by, u.created_at, u.payment_status,
                     w.balance_available, w.store_credit, w.gross_earnings
            ORDER BY u.created_at DESC
        """)
        
        invalid_parents = cursor.fetchall()
        
        if invalid_parents:
            print_warning(f"Found {len(invalid_parents)} verified users with invalid parents")
            print()
            
            table_data = []
            for o in invalid_parents:
                table_data.append([
                    o['full_name'] or 'N/A',
                    o['email'] or 'N/A',
                    o['phone'] or 'N/A',
                    o['referral_code'] or 'N/A',
                    o['referred_by'] or 'N/A',
                    f"MWK {float(o['balance_available'] or 0):,.0f}",
                    o['referrals_made'] or 0,
                    o['created_at'].strftime('%Y-%m-%d') if o['created_at'] else 'N/A'
                ])
            
            headers = ['Name', 'Email', 'Phone', 'Ref Code', 'Invalid Parent ID', 'Balance', 'Referrals', 'Joined']
            print(tabulate(table_data, headers=headers, tablefmt='grid'))
            print()
        else:
            print_success("No verified users with invalid parents found!")
        
        print(f"\n{'='*70}\n")
        
        # ============================================================
        # 3. Summary Statistics
        # ============================================================
        print(f"{Colors.BOLD}{Colors.CYAN}3. SUMMARY STATISTICS{Colors.END}\n")
        
        # Total verified users
        cursor.execute("""
            SELECT COUNT(*) as total_verified
            FROM users
            WHERE payment_status = 'verified'
        """)
        total_verified = cursor.fetchone()['total_verified'] or 0
        
        # Verified users with parents
        cursor.execute("""
            SELECT COUNT(*) as has_parent
            FROM users
            WHERE payment_status = 'verified'
              AND referred_by IS NOT NULL
              AND EXISTS (SELECT 1 FROM users parent WHERE parent.id = users.referred_by)
        """)
        has_parent = cursor.fetchone()['has_parent'] or 0
        
        # Verified users without parents
        no_parent = len(orphans)
        
        # Verified users with invalid parents
        invalid_parent = len(invalid_parents)
        
        print(f"  Total Verified Users: {total_verified}")
        print(f"  Has Valid Parent: {Colors.GREEN}{has_parent}{Colors.END}")
        print(f"  No Parent (Orphan): {Colors.YELLOW}{no_parent}{Colors.END}")
        print(f"  Invalid Parent: {Colors.RED}{invalid_parent}{Colors.END}")
        print()
        
        # Calculate percentage
        orphan_percentage = (no_parent / total_verified * 100) if total_verified > 0 else 0
        invalid_percentage = (invalid_parent / total_verified * 100) if total_verified > 0 else 0
        
        print(f"  Orphan Rate: {orphan_percentage:.1f}%")
        print(f"  Invalid Parent Rate: {invalid_percentage:.1f}%")
        
        # ============================================================
        # 4. Recommendations
        # ============================================================
        print(f"\n{Colors.BOLD}{Colors.CYAN}4. RECOMMENDATIONS{Colors.END}\n")
        
        if no_parent > 0:
            print(f"{Colors.YELLOW}⚠️  {no_parent} verified users have no parent.{Colors.END}")
            print("  Options:")
            print("  1. These are 'root' users (should exist in the system)")
            print("  2. They may have been manually verified without a referrer")
            print("  3. Consider assigning them to a 'system' or 'admin' parent")
            print("  4. Or leave them as-is (root users)")
        
        if invalid_parent > 0:
            print(f"{Colors.RED}🚨 {invalid_parent} verified users have invalid parents!{Colors.END}")
            print("  This is a data integrity issue:")
            print("  1. The parent user may have been deleted")
            print("  2. The referral link may have been corrupted")
            print("  3. Fix by:") 
            print("     a. Finding the correct parent user")
            print("     b. Updating referred_by to a valid user ID")
            print("     c. Or setting referred_by to NULL (make them root)")
        
        if no_parent == 0 and invalid_parent == 0:
            print_success("✅ All verified users have valid parent relationships!")
        
        print()
        
        # ============================================================
        # 5. Top Orphans (Most Active)
        # ============================================================
        if orphans:
            print(f"{Colors.BOLD}{Colors.CYAN}5. TOP ORPHANS (Most Active){Colors.END}\n")
            
            sorted_orphans = sorted(orphans, key=lambda x: float(x['gross_earnings'] or 0), reverse=True)
            
            table_data = []
            for o in sorted_orphans[:10]:
                table_data.append([
                    o['full_name'] or 'N/A',
                    o['email'] or 'N/A',
                    f"MWK {float(o['gross_earnings'] or 0):,.0f}",
                    f"MWK {float(o['balance_available'] or 0):,.0f}",
                    o['referrals_made'] or 0
                ])
            
            headers = ['Name', 'Email', 'Gross Earnings', 'Balance', 'Referrals']
            print(tabulate(table_data, headers=headers, tablefmt='grid'))
        
    except Exception as e:
        print_error(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        conn.close()

# ============================================================
# FIX ORPHANS (Optional)
# ============================================================

def fix_orphans_interactive():
    """Interactive tool to fix orphans"""
    print_header("🔧 FIX ORPHANS")
    
    print("This tool will help you fix verified orphans.")
    print()
    print("Options:")
    print("  1. Assign a parent to an orphan (set referred_by)")
    print("  2. Make orphan a root user (set referred_by = NULL)")
    print("  0. Cancel")
    print()
    
    choice = input(f"{Colors.BOLD}Choice: {Colors.END}").strip()
    
    if choice == '0':
        return
    elif choice == '1':
        assign_parent_interactive()
    elif choice == '2':
        make_root_interactive()
    else:
        print_error("Invalid choice")

def assign_parent_interactive():
    """Assign a parent to an orphan"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Get orphans
        cursor.execute("""
            SELECT 
                id, full_name, email, phone
            FROM users
            WHERE payment_status = 'verified'
              AND referred_by IS NULL
            ORDER BY full_name
        """)
        orphans = cursor.fetchall()
        
        if not orphans:
            print_info("No orphans found")
            return
        
        print(f"\n{Colors.BOLD}Select orphan to fix:{Colors.END}")
        for i, o in enumerate(orphans, 1):
            print(f"  {i}. {o['full_name']} ({o['email']})")
        
        print("  0. Cancel")
        print()
        
        choice = input(f"{Colors.BOLD}Choice: {Colors.END}").strip()
        if choice == '0':
            return
        
        try:
            idx = int(choice) - 1
            orphan = orphans[idx]
        except:
            print_error("Invalid choice")
            return
        
        # Find parent
        parent_id = input(f"{Colors.BOLD}Enter parent user ID or email: {Colors.END}").strip()
        
        if not parent_id:
            return
        
        cursor.execute("""
            SELECT id, full_name FROM users WHERE id = %s OR email = %s
        """, (parent_id, parent_id))
        parent = cursor.fetchone()
        
        if not parent:
            print_error("Parent not found")
            return
        
        if parent['id'] == orphan['id']:
            print_error("Cannot assign user as their own parent")
            return
        
        confirm = input(f"{Colors.YELLOW}Assign {orphan['full_name']} to parent {parent['full_name']}? (y/n): {Colors.END}")
        if confirm.lower() != 'y':
            return
        
        # Update
        cursor.execute("""
            UPDATE users 
            SET referred_by = %s, updated_at = NOW()
            WHERE id = %s
        """, (parent['id'], orphan['id']))
        conn.commit()
        
        print_success(f"Assigned {orphan['full_name']} to parent {parent['full_name']}")
        
    except Exception as e:
        conn.rollback()
        print_error(f"Error: {e}")
    finally:
        cursor.close()
        conn.close()

def make_root_interactive():
    """Make an orphan a root user"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Get orphans with invalid parents
        cursor.execute("""
            SELECT 
                u.id, u.full_name, u.email, u.phone, u.referred_by
            FROM users u
            LEFT JOIN users parent ON parent.id = u.referred_by
            WHERE u.payment_status = 'verified'
              AND u.referred_by IS NOT NULL
              AND parent.id IS NULL
            ORDER BY u.full_name
        """)
        orphans = cursor.fetchall()
        
        if not orphans:
            print_info("No users with invalid parents found")
            return
        
        print(f"\n{Colors.BOLD}Select user to make root:{Colors.END}")
        for i, o in enumerate(orphans, 1):
            print(f"  {i}. {o['full_name']} ({o['email']}) - Invalid parent: {o['referred_by']}")
        
        print("  0. Cancel")
        print()
        
        choice = input(f"{Colors.BOLD}Choice: {Colors.END}").strip()
        if choice == '0':
            return
        
        try:
            idx = int(choice) - 1
            orphan = orphans[idx]
        except:
            print_error("Invalid choice")
            return
        
        confirm = input(f"{Colors.YELLOW}Make {orphan['full_name']} a root user (set referred_by = NULL)? (y/n): {Colors.END}")
        if confirm.lower() != 'y':
            return
        
        # Update
        cursor.execute("""
            UPDATE users 
            SET referred_by = NULL, updated_at = NOW()
            WHERE id = %s
        """, (orphan['id'],))
        conn.commit()
        
        print_success(f"Made {orphan['full_name']} a root user")
        
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
        print_header("🏛️  VERIFIED ORPHANS CHECKER")
        
        print(f"{Colors.BOLD}{Colors.CYAN}Options:{Colors.END}")
        print("  1.  Check for Verified Orphans")
        print("  2.  Fix Orphans")
        print("  0.  Exit")
        print()
        
        choice = input(f"{Colors.BOLD}{Colors.CYAN}Enter your choice: {Colors.END}").strip()
        
        if choice == '0':
            print_info("Goodbye! 👋")
            break
        elif choice == '1':
            check_verified_orphans()
            input("\nPress Enter to continue...")
        elif choice == '2':
            fix_orphans_interactive()
            input("\nPress Enter to continue...")
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
