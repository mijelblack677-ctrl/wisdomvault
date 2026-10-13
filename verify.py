#!/usr/bin/env python3
"""
Wisdom Vault - Manual User Verification Tool
For users who paid via agent codes before PayChangu was implemented.

This tool:
1. Verifies the user (payment_status = 'verified')
2. Processes Level 1 and Level 2 referral bonuses
3. Creates notifications for the user and referrers
4. Creates transaction records

Usage:
  python verify.py                    # Interactive mode
  python verify.py <email_or_phone>   # Direct verify
"""

import os
import sys
import psycopg2
import psycopg2.extras
from datetime import datetime
from tabulate import tabulate

from db_config import (
    get_db_connection, Colors, print_success, print_error, print_warning,
    print_info, print_header, clear_screen, input_prompt, input_confirm,
    display_table, FIRST_LEVEL_BONUS, SECOND_LEVEL_BONUS, REGISTRATION_FEE
)

# ── FIND USER ───────────────────────────────────────────────────────────────

def find_user(identifier):
    """Find a user by email, phone, or name."""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Try exact match first
        cursor.execute("""
            SELECT 
                u.id, u.full_name, u.email, u.phone,
                u.referral_code, u.payment_status,
                u.referred_by, u.created_at, u.is_active,
                r.full_name as referrer_name,
                r.email as referrer_email,
                r.id as referrer_uid,
                w.balance_available, w.store_credit, w.gross_earnings
            FROM users u
            LEFT JOIN users r ON r.id = u.referred_by
            LEFT JOIN wallets w ON w.user_id = u.id
            WHERE u.email = %s OR u.phone = %s
        """, (identifier, identifier))
        user = cursor.fetchone()
        
        if not user:
            # Try partial match
            cursor.execute("""
                SELECT 
                    u.id, u.full_name, u.email, u.phone,
                    u.referral_code, u.payment_status,
                    u.referred_by, u.created_at, u.is_active,
                    r.full_name as referrer_name,
                    r.email as referrer_email,
                    r.id as referrer_uid,
                    w.balance_available, w.store_credit, w.gross_earnings
                FROM users u
                LEFT JOIN users r ON r.id = u.referred_by
                LEFT JOIN wallets w ON w.user_id = u.id
                WHERE u.full_name ILIKE %s
                   OR u.email ILIKE %s
                   OR u.phone ILIKE %s
                   OR u.referral_code ILIKE %s
                ORDER BY u.full_name
                LIMIT 20
            """, (f'%{identifier}%', f'%{identifier}%', f'%{identifier}%', f'%{identifier}%'))
            users = cursor.fetchall()
            
            if len(users) == 0:
                return None
            elif len(users) == 1:
                return dict(users[0])
            else:
                # Show selection
                print(f"\n{Colors.BOLD}Multiple users found:{Colors.END}")
                table_data = []
                for i, u in enumerate(users, 1):
                    status_color = Colors.GREEN if u['payment_status'] == 'verified' else Colors.YELLOW
                    table_data.append([
                        i,
                        u['full_name'] or 'N/A',
                        u['email'] or 'N/A',
                        u['phone'] or 'N/A',
                        f"{status_color}{u['payment_status'] or 'pending'}{Colors.END}",
                        '✅' if u.get('is_active') else '❌'
                    ])
                headers = ['#', 'Name', 'Email', 'Phone', 'Status', 'Active']
                display_table(table_data, headers)
                
                try:
                    choice = int(input(f"\n{Colors.BOLD}Select user (number, 0 to cancel): {Colors.END}"))
                    if choice == 0:
                        return None
                    return dict(users[choice - 1])
                except (ValueError, IndexError):
                    return None
        
        return dict(user) if user else None
    finally:
        cursor.close()
        conn.close()

def get_user_referrals(user_id):
    """Get pending referrals for this user (where they are the referrer)."""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                r.id, r.referrer_id, r.referred_id,
                r.bonus_amount, r.is_paid, r.referral_type,
                u.full_name as referred_name,
                u.email as referred_email,
                u.payment_status as referred_status
            FROM referrals r
            JOIN users u ON u.id = r.referred_id
            WHERE r.referrer_id = %s
            ORDER BY r.created_at DESC
        """, (user_id,))
        return [dict(r) for r in cursor.fetchall()]
    finally:
        cursor.close()
        conn.close()

def get_level2_referrer(user_id):
    """Get the Level 2 referrer (referrer's referrer)."""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Step 1: Get the L1 referrer (who referred this user)
        cursor.execute("SELECT referred_by FROM users WHERE id = %s", (user_id,))
        l1_row = cursor.fetchone()
        if not l1_row or not l1_row['referred_by']:
            return None
        
        # Step 2: Get the L1 referrer's referrer (that's the L2 referrer)
        cursor.execute("""
            SELECT u.id, u.full_name, u.email, u.payment_status
            FROM users u
            WHERE u.id = (SELECT referred_by FROM users WHERE id = %s)
        """, (l1_row['referred_by'],))
        result = cursor.fetchone()
        return dict(result) if result else None
    finally:
        cursor.close()
        conn.close()

# ── DISPLAY ─────────────────────────────────────────────────────────────────

def display_user_card(user):
    """Display user details."""
    if not user:
        return
    
    status = user.get('payment_status', 'pending')
    status_color = Colors.GREEN if status == 'verified' else Colors.YELLOW
    
    print(f"\n{Colors.BOLD}📋 USER PROFILE{Colors.END}")
    print(f"{'─'*55}")
    print(f"  {Colors.BOLD}Name:{Colors.END} {user.get('full_name', 'N/A')}")
    print(f"  {Colors.BOLD}Email:{Colors.END} {user.get('email', 'N/A')}")
    print(f"  {Colors.BOLD}Phone:{Colors.END} {user.get('phone', 'N/A')}")
    print(f"  {Colors.BOLD}Referral Code:{Colors.END} {user.get('referral_code', 'N/A')}")
    print(f"  {Colors.BOLD}Status:{Colors.END} {status_color}{status}{Colors.END}")
    print(f"  {Colors.BOLD}Active:{Colors.END} {'✅' if user.get('is_active') else '❌'}")
    print(f"  {Colors.BOLD}Joined:{Colors.END} {user.get('created_at', 'N/A')}")
    print()
    print(f"  {Colors.BOLD}💰 Wallet:{Colors.END}")
    print(f"    Balance: MWK {float(user.get('balance_available') or 0):,.2f}")
    print(f"    Store Credit: MWK {float(user.get('store_credit') or 0):,.2f}")
    print(f"    Gross Earnings: MWK {float(user.get('gross_earnings') or 0):,.2f}")
    print()
    referrer = user.get('referrer_name') or 'None (Root User)'
    print(f"  {Colors.BOLD}Referred by:{Colors.END} {referrer}")
    print(f"{'─'*55}")

def display_verification_plan(user, l1_referrer, l2_referrer, pending_bonuses):
    """Display what will happen during verification."""
    print(f"\n{Colors.BOLD}{Colors.CYAN}📋 VERIFICATION PLAN{Colors.END}")
    print(f"{'─'*55}")
    
    print(f"\n  {Colors.BOLD}1. Account Status:{Colors.END}")
    print(f"     payment_status: pending → {Colors.GREEN}verified{Colors.END}")
    
    print(f"\n  {Colors.BOLD}2. Registration Fee:{Colors.END}")
    print(f"     MWK {REGISTRATION_FEE:,.0f} collected")
    
    print(f"\n  {Colors.BOLD}3. Referral Bonuses:{Colors.END}")
    
    if l1_referrer and l1_referrer.get('payment_status') == 'verified':
        print(f"     Level 1 → {l1_referrer['full_name']}: {Colors.GREEN}MWK {FIRST_LEVEL_BONUS:,.0f}{Colors.END}")
    elif l1_referrer:
        print(f"     Level 1 → {l1_referrer['full_name']}: {Colors.YELLOW}Skipped (referrer not verified){Colors.END}")
    else:
        print(f"     Level 1: {Colors.DIM}No referrer{Colors.END}")
    
    if l2_referrer and l2_referrer.get('payment_status') == 'verified':
        print(f"     Level 2 → {l2_referrer['full_name']}: {Colors.GREEN}MWK {SECOND_LEVEL_BONUS:,.0f}{Colors.END}")
    elif l2_referrer:
        print(f"     Level 2 → {l2_referrer['full_name']}: {Colors.YELLOW}Skipped (referrer not verified){Colors.END}")
    else:
        print(f"     Level 2: {Colors.DIM}No second-level referrer{Colors.END}")
    
    if pending_bonuses:
        print(f"\n  {Colors.BOLD}4. Pending Referral Bonuses (this user earned from referring):{Colors.END}")
        for b in pending_bonuses:
            if b['is_paid']:
                print(f"     ✅ Already paid: MWK {float(b['bonus_amount']):,.0f} from {b['referred_name']}")
            else:
                print(f"     ⏳ Pending: MWK {float(b['bonus_amount']):,.0f} from {b['referred_name']} ({b['referral_type']})")
    
    # Show bonuses this user will earn from their already-verified referrals
    earned_bonuses = [
        b for b in pending_bonuses
        if not b['is_paid'] and b.get('referred_status') == 'verified'
    ]
    if earned_bonuses:
        print(f"\n  {Colors.BOLD}5. Bonuses you'll earn (your referrals who are already verified):{Colors.END}")
        for b in earned_bonuses:
            print(f"     🎯 MWK {float(b['bonus_amount']):,.0f} from {b['referred_name']} ({b['referral_type']})")
    
    print(f"\n{'─'*55}")

# ── VERIFY ──────────────────────────────────────────────────────────────────

def verify_user(user_id, admin_name="Admin"):
    """
    Verify a user and process referral bonuses.
    Returns (success, message).
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Check if already verified
        cursor.execute("SELECT payment_status FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return False, "User not found"
        if user['payment_status'] == 'verified':
            return False, "User is already verified"
        
        # Start transaction
        cursor.execute("BEGIN")
        
        # 1. Verify the user
        cursor.execute("""
            UPDATE users 
            SET payment_status = 'verified',
                updated_at = NOW()
            WHERE id = %s
            RETURNING full_name, email, referred_by
        """, (user_id,))
        verified_user = cursor.fetchone()
        
        print(f"\n  {Colors.GREEN}✅ Verified: {verified_user['full_name']}{Colors.END}")
        
        # 2. Process Level 1 referral bonus (for the referrer who referred this user)
        l1_paid = False
        if verified_user['referred_by']:
            cursor.execute("""
                SELECT id, full_name, email, payment_status
                FROM users WHERE id = %s
            """, (verified_user['referred_by'],))
            l1_referrer = cursor.fetchone()
            
            if l1_referrer and l1_referrer['payment_status'] == 'verified':
                # Credit the Level 1 referrer
                cursor.execute("""
                    UPDATE wallets 
                    SET balance_available = balance_available + %s,
                        gross_earnings = gross_earnings + %s,
                        updated_at = NOW()
                    WHERE user_id = %s
                    RETURNING balance_available
                """, (FIRST_LEVEL_BONUS, FIRST_LEVEL_BONUS, l1_referrer['id']))
                new_balance = cursor.fetchone()['balance_available']
                
                # Mark referral as paid
                cursor.execute("""
                    UPDATE referrals 
                    SET is_paid = true
                    WHERE referrer_id = %s AND referred_id = %s 
                      AND referral_type = 'first_level' AND is_paid = false
                """, (l1_referrer['id'], user_id))
                
                # Record transaction
                cursor.execute("""
                    INSERT INTO transactions (
                        wallet_id, transaction_type, amount, net_amount,
                        balance_before, balance_after, description
                    ) VALUES (
                        (SELECT id FROM wallets WHERE user_id = %s),
                        'referral_bonus', %s, %s,
                        %s - %s, %s,
                        %s
                    )
                """, (
                    l1_referrer['id'], FIRST_LEVEL_BONUS, FIRST_LEVEL_BONUS,
                    new_balance, FIRST_LEVEL_BONUS, new_balance,
                    f'Level 1 referral bonus for verifying {verified_user["full_name"]}'
                ))
                
                # Notify referrer
                cursor.execute("""
                    INSERT INTO notifications (user_id, type, title, message, link)
                    VALUES (%s, 'referral_bonus', '🎉 Referral Bonus Credited!',
                        %s, '/dashboard/wallet')
                """, (
                    l1_referrer['id'],
                    f'{verified_user["full_name"]} verified their account! MWK {FIRST_LEVEL_BONUS:,.0f} Level 1 bonus credited to your wallet.'
                ))
                
                print(f"  {Colors.GREEN}✅ Level 1 bonus: MWK {FIRST_LEVEL_BONUS:,.0f} → {l1_referrer['full_name']}{Colors.END}")
                l1_paid = True
            else:
                reason = "no referrer" if not l1_referrer else f"referrer not verified ({l1_referrer['payment_status']})"
                print(f"  {Colors.YELLOW}⚠️  Level 1 bonus skipped: {reason}{Colors.END}")
        
        # 3. Process Level 2 referral bonus (for the referrer's referrer)
        l2_paid = False
        if verified_user['referred_by']:
            # Get the Level 2 referrer (referrer's referrer)
            cursor.execute("""
                SELECT u.id, u.full_name, u.email, u.payment_status, u.referred_by
                FROM users u
                WHERE u.id = (SELECT referred_by FROM users WHERE id = %s)
            """, (verified_user['referred_by'],))
            l2_referrer = cursor.fetchone()
            
            if l2_referrer and l2_referrer['payment_status'] == 'verified':
                # Credit the Level 2 referrer
                cursor.execute("""
                    UPDATE wallets 
                    SET balance_available = balance_available + %s,
                        gross_earnings = gross_earnings + %s,
                        updated_at = NOW()
                    WHERE user_id = %s
                    RETURNING balance_available
                """, (SECOND_LEVEL_BONUS, SECOND_LEVEL_BONUS, l2_referrer['id']))
                new_balance = cursor.fetchone()['balance_available']
                
                # Record as second_level referral
                # First check if a second_level referral record exists
                cursor.execute("""
                    SELECT id FROM referrals 
                    WHERE referrer_id = %s AND referred_id = %s 
                      AND referral_type = 'second_level'
                """, (l2_referrer['id'], user_id))
                existing = cursor.fetchone()
                
                if not existing:
                    # Create the referral record
                    cursor.execute("""
                        INSERT INTO referrals (referrer_id, referred_id, bonus_amount, is_paid, referral_type)
                        VALUES (%s, %s, %s, true, 'second_level')
                    """, (l2_referrer['id'], user_id, SECOND_LEVEL_BONUS))
                else:
                    cursor.execute("""
                        UPDATE referrals SET is_paid = true
                        WHERE id = %s
                    """, (existing['id'],))
                
                # Record transaction
                cursor.execute("""
                    INSERT INTO transactions (
                        wallet_id, transaction_type, amount, net_amount,
                        balance_before, balance_after, description
                    ) VALUES (
                        (SELECT id FROM wallets WHERE user_id = %s),
                        'referral_bonus', %s, %s,
                        %s - %s, %s,
                        %s
                    )
                """, (
                    l2_referrer['id'], SECOND_LEVEL_BONUS, SECOND_LEVEL_BONUS,
                    new_balance, SECOND_LEVEL_BONUS, new_balance,
                    f'Level 2 referral bonus for verifying {verified_user["full_name"]}'
                ))
                
                # Notify referrer
                cursor.execute("""
                    INSERT INTO notifications (user_id, type, title, message, link)
                    VALUES (%s, 'referral_bonus', '🎉 Referral Bonus Credited!',
                        %s, '/dashboard/wallet')
                """, (
                    l2_referrer['id'],
                    f'A user in your network ({verified_user["full_name"]}) verified! MWK {SECOND_LEVEL_BONUS:,.0f} Level 2 bonus credited.'
                ))
                
                print(f"  {Colors.GREEN}✅ Level 2 bonus: MWK {SECOND_LEVEL_BONUS:,.0f} → {l2_referrer['full_name']}{Colors.END}")
                l2_paid = True
            else:
                reason = "no second-level referrer" if not l2_referrer else f"referrer not verified ({l2_referrer['payment_status']})"
                print(f"  {Colors.YELLOW}⚠️  Level 2 bonus skipped: {reason}{Colors.END}")
        
        # 4. Process bonuses the verified user earns for their own referrals
        # (where this user is the referrer and the referred person has verified)
        cursor.execute("""
            SELECT r.id, r.referred_id, r.bonus_amount, r.referral_type,
                   u.full_name as referred_name, u.payment_status as referred_status
            FROM referrals r
            JOIN users u ON u.id = r.referred_id
            WHERE r.referrer_id = %s
              AND r.is_paid = false
              AND u.payment_status = 'verified'
            ORDER BY r.created_at ASC
        """, (user_id,))
        earned_referrals = cursor.fetchall()
        
        for earned in earned_referrals:
            # Credit the newly verified user for their successful referrals
            cursor.execute("""
                UPDATE wallets 
                SET balance_available = balance_available + %s,
                    gross_earnings = gross_earnings + %s,
                    updated_at = NOW()
                WHERE user_id = %s
                RETURNING balance_available
            """, (earned['bonus_amount'], earned['bonus_amount'], user_id))
            new_balance = cursor.fetchone()['balance_available']
            
            # Mark referral as paid
            cursor.execute("""
                UPDATE referrals 
                SET is_paid = true
                WHERE id = %s
            """, (earned['id'],))
            
            # Record transaction
            cursor.execute("""
                INSERT INTO transactions (
                    wallet_id, transaction_type, amount, net_amount,
                    balance_before, balance_after, description
                ) VALUES (
                    (SELECT id FROM wallets WHERE user_id = %s),
                    'referral_bonus', %s, %s,
                    %s - %s, %s,
                    %s
                )
            """, (
                user_id, earned['bonus_amount'], earned['bonus_amount'],
                new_balance, earned['bonus_amount'], new_balance,
                f'Referral bonus for {earned["referred_name"]} verifying - {earned["referral_type"]}'
            ))
            
            # Notify the verified user
            cursor.execute("""
                INSERT INTO notifications (user_id, type, title, message, link)
                VALUES (%s, 'referral_bonus', '🎉 Referral Bonus Credited!',
                    %s, '/dashboard/wallet')
            """, (
                user_id,
                f'{earned["referred_name"]} verified! MWK {earned["bonus_amount"]:,.0f} {earned["referral_type"]} bonus credited to your wallet.'
            ))
            
            print(f"  {Colors.GREEN}✅ Referral bonus earned: MWK {earned['bonus_amount']:,.0f} → {verified_user['full_name']} (for {earned['referred_name']}){Colors.END}")
        
        # 4. Notify the verified user
        cursor.execute("""
            INSERT INTO notifications (user_id, type, title, message, link)
            VALUES (%s, 'account_verified', '✅ Account Verified!',
                'Your account has been verified! You can now access all features and withdraw earnings.', '/dashboard')
        """, (user_id,))
        
        # Commit
        cursor.execute("COMMIT")
        
        total_bonuses = (FIRST_LEVEL_BONUS if l1_paid else 0) + (SECOND_LEVEL_BONUS if l2_paid else 0)
        
        return True, f"User verified successfully. {total_bonuses:,.0f} MWK in referral bonuses processed."
        
    except Exception as e:
        cursor.execute("ROLLBACK")
        return False, f"Error: {str(e)}"
    finally:
        cursor.close()
        conn.close()

# ── INTERACTIVE MODE ────────────────────────────────────────────────────────

def interactive_mode():
    """Interactive verification flow."""
    clear_screen()
    print_header("✅ MANUAL USER VERIFICATION", "For users who paid via agent codes before PayChangu")
    
    identifier = input(f"{Colors.BOLD}Enter user email, phone, or name: {Colors.END}").strip()
    if not identifier:
        return
    
    user = find_user(identifier)
    if not user:
        print_error(f"User not found: {identifier}")
        input("\nPress Enter to continue...")
        return
    
    # Display user
    display_user_card(user)
    
    # Check if already verified
    if user.get('payment_status') == 'verified':
        print_warning("This user is ALREADY verified.")
        input("\nPress Enter to continue...")
        return
    
    # Get referrer info
    l1_referrer = None
    if user.get('referred_by'):
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        try:
            cursor.execute("""
                SELECT id, full_name, email, payment_status
                FROM users WHERE id = %s
            """, (user['referred_by'],))
            result = cursor.fetchone()
            if result:
                l1_referrer = dict(result)
        finally:
            cursor.close()
            conn.close()
    
    l2_referrer = get_level2_referrer(user['id'])
    
    # Get pending bonuses this user earned
    pending_bonuses = get_user_referrals(user['id'])
    
    # Show verification plan
    display_verification_plan(user, l1_referrer, l2_referrer, pending_bonuses)
    
    # Confirm
    print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠️  This will verify the account and process referral bonuses.{Colors.END}")
    print(f"{Colors.YELLOW}   Registration fee: MWK {REGISTRATION_FEE:,.0f}{Colors.END}")
    print()
    
    confirm = input(f"{Colors.RED}{Colors.BOLD}Type 'VERIFY' to confirm: {Colors.END}").strip().upper()
    if confirm != 'VERIFY':
        print_info("Verification cancelled")
        input("\nPress Enter to continue...")
        return
    
    # Verify
    print(f"\n{Colors.BOLD}Processing...{Colors.END}")
    success, message = verify_user(user['id'])
    
    if success:
        print_success(message)
    else:
        print_error(message)
    
    input("\nPress Enter to continue...")

def direct_verify(identifier):
    """Direct verification by email/phone."""
    print_header("✅ DIRECT USER VERIFICATION")
    
    user = find_user(identifier)
    if not user:
        print_error(f"User not found: {identifier}")
        return
    
    if user.get('payment_status') == 'verified':
        print_warning(f"{user['full_name']} is already verified.")
        return
    
    print(f"Verifying: {user['full_name']} ({user['email']})")
    success, message = verify_user(user['id'])
    
    if success:
        print_success(message)
    else:
        print_error(message)

# ── MAIN ────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    try:
        if len(sys.argv) > 1:
            direct_verify(sys.argv[1])
        else:
            interactive_mode()
    except KeyboardInterrupt:
        print("\n\n👋 Cancelled")
        sys.exit(0)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
