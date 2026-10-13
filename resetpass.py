#!/usr/bin/env python3
"""
Wisdom Vault - Password Reset Tool (bcrypt)
Matches production system hashing
"""

import os
import sys
import re
import bcrypt
import psycopg2
import psycopg2.extras
from getpass import getpass
from tabulate import tabulate

from db_config import (
    get_db_connection, Colors, print_success, print_error, print_warning,
    print_info, print_header
)

# ============================================================
# BCRYPT HASHING (Matches Production)
# ============================================================

def hash_password_bcrypt(password):
    """Hash password using bcrypt (matches production)"""
    salt = bcrypt.gensalt(rounds=10)  # Cost factor 10 matches production
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password_bcrypt(password, hashed):
    """Verify bcrypt password"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except:
        return False

# ============================================================
# FIND USER
# ============================================================

def find_user(identifier):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                id, full_name, email, phone, 
                referral_code, payment_status,
                is_active, created_at, password_hash
            FROM users
            WHERE email = %s 
               OR phone = %s
        """, (identifier, identifier))
        user = cursor.fetchone()
        
        if not user:
            cursor.execute("""
                SELECT 
                    id, full_name, email, phone, 
                    referral_code, payment_status,
                    is_active, created_at, password_hash
                FROM users
                WHERE full_name ILIKE %s
                   OR email ILIKE %s
                   OR phone ILIKE %s
                LIMIT 10
            """, (f'%{identifier}%', f'%{identifier}%', f'%{identifier}%'))
            users = cursor.fetchall()
            
            if users:
                if len(users) > 1:
                    print_info(f"Found {len(users)} matching users:")
                    table_data = []
                    for u in users:
                        table_data.append([
                            u['id'][:8] + '...',
                            u['full_name'] or 'N/A',
                            u['email'] or 'N/A',
                            u['phone'] or 'N/A',
                            u['payment_status'] or 'pending'
                        ])
                    headers = ['ID', 'Name', 'Email', 'Phone', 'Status']
                    print(tabulate(table_data, headers=headers, tablefmt='grid'))
                    print()
                    
                    choice = input(f"{Colors.BOLD}Enter the user ID or email to select (or 0 to cancel): {Colors.END}").strip()
                    if choice == '0':
                        return None
                    
                    for u in users:
                        if u['id'].startswith(choice) or u['email'] == choice:
                            return dict(u)
                    
                    return None
                else:
                    return dict(users[0])
        
        return dict(user) if user else None
    finally:
        cursor.close()
        conn.close()

# ============================================================
# VERIFY PASSWORD (bcrypt)
# ============================================================

def verify_password(user_id, password):
    """Verify bcrypt password"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT password_hash FROM users WHERE id = %s", (user_id,))
        result = cursor.fetchone()
        
        if not result:
            return False
        
        hashed = result[0]
        return verify_password_bcrypt(password, hashed)
    finally:
        cursor.close()
        conn.close()

# ============================================================
# RESET PASSWORD (bcrypt)
# ============================================================

def reset_password(user_id, new_password):
    """Reset user password using bcrypt"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Hash with bcrypt (matches production)
        hashed = hash_password_bcrypt(new_password)
        
        cursor.execute("""
            UPDATE users 
            SET password_hash = %s,
                updated_at = NOW()
            WHERE id = %s
            RETURNING full_name
        """, (hashed, user_id))
        
        result = cursor.fetchone()
        if result:
            conn.commit()
            return True, result[0]
        else:
            return False, None
    except Exception as e:
        conn.rollback()
        print_error(f"Failed to reset password: {e}")
        return False, None
    finally:
        cursor.close()
        conn.close()

# ============================================================
# MAIN MENU
# ============================================================

def main_menu():
    while True:
        clear_screen()
        print_header("🔐 PASSWORD RESET TOOL (bcrypt)")
        
        print(f"{Colors.BOLD}{Colors.CYAN}Options:{Colors.END}")
        print("  1.  Reset Password for a User")
        print("  2.  List Users")
        print("  3.  Find User")
        print("  4.  Verify User Password")
        print("  0.  Exit")
        print()
        
        choice = input(f"{Colors.BOLD}{Colors.CYAN}Enter your choice: {Colors.END}").strip()
        
        if choice == '0':
            print_info("Goodbye! 👋")
            break
        elif choice == '1':
            reset_password_interactive()
        elif choice == '2':
            list_users_interactive()
        elif choice == '3':
            find_user_interactive()
        elif choice == '4':
            verify_password_interactive()
        else:
            print_error("Invalid choice")

# ============================================================
# INTERACTIVE FUNCTIONS
# ============================================================

def clear_screen():
    os.system('clear' if os.name == 'posix' else 'cls')

def reset_password_interactive():
    clear_screen()
    print_header("🔑 RESET PASSWORD (bcrypt)")
    
    identifier = input(f"{Colors.BOLD}Enter user email, phone, or name: {Colors.END}").strip()
    
    if not identifier:
        return
    
    user = find_user(identifier)
    
    if not user:
        print_error(f"User not found: {identifier}")
        input("\nPress Enter to continue...")
        return
    
    print(f"\n{Colors.BOLD}User Found:{Colors.END}")
    print(f"  Name: {user['full_name'] or 'N/A'}")
    print(f"  Email: {user['email'] or 'N/A'}")
    print(f"  Phone: {user['phone'] or 'N/A'}")
    print(f"  Status: {user['payment_status'] or 'pending'}")
    print(f"  Active: {'✅' if user['is_active'] else '❌'}")
    
    print(f"\n{Colors.YELLOW}⚠️  You are about to reset the password for this user.{Colors.END}")
    confirm = input(f"{Colors.YELLOW}Continue? (y/n): {Colors.END}").lower()
    
    if confirm != 'y':
        print_info("Cancelled")
        input("\nPress Enter to continue...")
        return
    
    while True:
        new_password = getpass(f"{Colors.BOLD}Enter new password (min 6 characters): {Colors.END}")
        
        if len(new_password) < 6:
            print_error("Password must be at least 6 characters")
            continue
        
        confirm_password = getpass(f"{Colors.BOLD}Confirm new password: {Colors.END}")
        
        if new_password != confirm_password:
            print_error("Passwords do not match")
            continue
        
        break
    
    print(f"\n{Colors.BOLD}Processing...{Colors.END}")
    success, full_name = reset_password(user['id'], new_password)
    
    if success:
        print_success(f"Password reset successfully for {full_name}!")
        
        print(f"\n{Colors.BOLD}Verifying password...{Colors.END}")
        if verify_password(user['id'], new_password):
            print_success("✅ Verification passed! The user can login.")
        else:
            print_error("❌ Verification failed! The password may not work.")
    else:
        print_error("Failed to reset password")
    
    input("\nPress Enter to continue...")

def verify_password_interactive():
    clear_screen()
    print_header("🔍 VERIFY USER PASSWORD")
    
    identifier = input(f"{Colors.BOLD}Enter user email or phone: {Colors.END}").strip()
    
    if not identifier:
        return
    
    user = find_user(identifier)
    
    if not user:
        print_error(f"User not found: {identifier}")
        input("\nPress Enter to continue...")
        return
    
    print(f"\n{Colors.BOLD}User:{Colors.END} {user['full_name']} ({user['email']})")
    
    test_password = getpass(f"{Colors.BOLD}Enter password to test: {Colors.END}")
    
    if verify_password(user['id'], test_password):
        print_success("✅ Password is CORRECT!")
    else:
        print_error("❌ Password is INCORRECT!")
    
    input("\nPress Enter to continue...")

def list_users_interactive():
    clear_screen()
    print_header("👥 LIST USERS")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                id, full_name, email, phone,
                payment_status, is_active,
                created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 30
        """)
        users = cursor.fetchall()
        
        if not users:
            print_info("No users found")
        else:
            table_data = []
            for u in users:
                table_data.append([
                    u['id'][:8] + '...',
                    u['full_name'] or 'N/A',
                    u['email'] or 'N/A',
                    u['phone'] or 'N/A',
                    u['payment_status'] or 'pending',
                    '✅' if u['is_active'] else '❌'
                ])
            
            headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Active']
            print(tabulate(table_data, headers=headers, tablefmt='grid'))
            print(f"\nTotal: {len(users)} users")
            
    finally:
        cursor.close()
        conn.close()
    
    input("\nPress Enter to continue...")

def find_user_interactive():
    clear_screen()
    print_header("🔍 FIND USER")
    
    identifier = input(f"{Colors.BOLD}Enter email, phone, or name: {Colors.END}").strip()
    
    if not identifier:
        return
    
    user = find_user(identifier)
    
    if user:
        print(f"\n{Colors.BOLD}User Found:{Colors.END}")
        print(f"  ID: {user['id']}")
        print(f"  Name: {user['full_name'] or 'N/A'}")
        print(f"  Email: {user['email'] or 'N/A'}")
        print(f"  Phone: {user['phone'] or 'N/A'}")
        print(f"  Status: {user['payment_status'] or 'pending'}")
        print(f"  Active: {'✅' if user['is_active'] else '❌'}")
    else:
        print_error(f"User not found: {identifier}")
    
    input("\nPress Enter to continue...")

# ============================================================
# RUN
# ============================================================

if __name__ == '__main__':
    try:
        # Check if bcrypt is installed
        try:
            import bcrypt
        except ImportError:
            print_error("bcrypt is not installed. Installing...")
            os.system("pip install bcrypt")
            print_success("bcrypt installed. Please run the tool again.")
            sys.exit(0)
        
        main_menu()
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
        sys.exit(0)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)
