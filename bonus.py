#!/usr/bin/env python3
"""
Wisdom Vault - Bonus Fixer Tool
Finds all unpaid bonuses and marks them as paid + adds to wallets
"""

import os
import sys
import psycopg2
import psycopg2.extras
from datetime import datetime
from tabulate import tabulate

from db_config import (
    get_db_connection, Colors, print_success, print_error, print_warning,
    print_info, print_header
)

# ============================================================
# MAIN FUNCTION
# ============================================================

def fix_all_bonuses():
    print_header("💰 BONUS FIXER TOOL")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # ============================================================
        # 1. SCAN FOR UNPAID BONUSES
        # ============================================================
        print(f"{Colors.BOLD}📊 Scanning for unpaid bonuses...{Colors.END}\n")
        
        cursor.execute("""
            SELECT 
                r.id,
                r.referrer_id,
                r.referred_id,
                r.referral_type,
                r.bonus_amount,
                r.is_paid,
                u.full_name as referrer_name,
                u.email as referrer_email,
                u2.full_name as referred_name,
                u2.email as referred_email,
                u2.payment_status as referred_status,
                r.created_at
            FROM referrals r
            JOIN users u ON u.id = r.referrer_id
            JOIN users u2 ON u2.id = r.referred_id
            WHERE r.is_paid = false
            ORDER BY r.created_at DESC
        """)
        
        unpaid = cursor.fetchall()
        
        if not unpaid:
            print_success("✅ No unpaid bonuses found! Everything is paid.")
            conn.close()
            return
        
        # ============================================================
        # 2. SUMMARY
        # ============================================================
        total_unpaid = len(unpaid)
        total_amount = sum(float(r['bonus_amount'] or 0) for r in unpaid)
        
        print(f"{Colors.BOLD}📊 Unpaid Bonuses Summary:{Colors.END}")
        print(f"  Total Unpaid: {total_unpaid}")
        print(f"  Total Amount Owed: MWK {total_amount:,.2f}")
        print()
        
        # Group by type
        first_level = [r for r in unpaid if r['referral_type'] == 'first_level']
        second_level = [r for r in unpaid if r['referral_type'] == 'second_level']
        
        print(f"  First Level: {len(first_level)} (MWK {sum(float(r['bonus_amount'] or 0) for r in first_level):,.2f})")
        print(f"  Second Level: {len(second_level)} (MWK {sum(float(r['bonus_amount'] or 0) for r in second_level):,.2f})")
        print()
        
        # ============================================================
        # 3. BREAKDOWN BY STATUS
        # ============================================================
        cursor.execute("""
            SELECT 
                u2.payment_status,
                COUNT(*) as count,
                SUM(r.bonus_amount) as total
            FROM referrals r
            JOIN users u2 ON u2.id = r.referred_id
            WHERE r.is_paid = false
            GROUP BY u2.payment_status
        """)
        status_breakdown = cursor.fetchall()
        
        print(f"{Colors.BOLD}Breakdown by Referred User Status:{Colors.END}")
        for s in status_breakdown:
            status_label = s['payment_status'] or 'unknown'
            print(f"  {status_label}: {s['count']} referrals (MWK {float(s['total'] or 0):,.2f})")
        print()
        
        # ============================================================
        # 4. SHOW DETAILED LIST
        # ============================================================
        print(f"{Colors.BOLD}📋 Detailed List of Unpaid Bonuses:{Colors.END}\n")
        
        table_data = []
        for r in unpaid:
            status_color = Colors.GREEN if r['referred_status'] == 'verified' else Colors.YELLOW
            table_data.append([
                r['referral_type'] or 'unknown',
                r['referrer_name'][:20] if r['referrer_name'] else 'N/A',
                r['referred_name'][:20] if r['referred_name'] else 'N/A',
                f"{status_color}{r['referred_status'] or 'pending'}{Colors.END}",
                f"MWK {float(r['bonus_amount'] or 0):,.0f}",
                r['created_at'].strftime('%Y-%m-%d') if r['created_at'] else 'N/A'
            ])
        
        headers = ['Type', 'Referrer', 'Referred', 'Status', 'Bonus', 'Date']
        print(tabulate(table_data, headers=headers, tablefmt='grid'))
        print()
        
        # ============================================================
        # 5. SEPARATE: VERIFIED VS PENDING
        # ============================================================
        verified_unpaid = [r for r in unpaid if r['referred_status'] == 'verified']
        pending_unpaid = [r for r in unpaid if r['referred_status'] != 'verified']
        
        # Also check for bonuses where the referrer is verified but hasn't received payment
        # (i.e., the referred user is verified but bonus wasn't paid to referrer)
        cursor.execute("""
            SELECT r.id, r.referrer_id, r.referred_id, r.bonus_amount, r.referral_type,
                   r.is_paid, u.full_name as referrer_name, u.email as referrer_email,
                   u2.full_name as referred_name, u2.email as referred_email,
                   u2.payment_status as referred_status
            FROM referrals r
            JOIN users u ON u.id = r.referrer_id
            JOIN users u2 ON u2.id = r.referred_id
            WHERE r.is_paid = false
              AND u2.payment_status = 'verified'
              AND r.referrer_id IN (SELECT id FROM users WHERE payment_status = 'verified')
            ORDER BY r.created_at DESC
        """)
        referrer_verified_unpaid = cursor.fetchall()
        
        print(f"{Colors.BOLD}Summary:{Colors.END}")
        print(f"  ✅ Verified users with unpaid bonuses: {len(verified_unpaid)} (SHOULD BE PAID)")
        print(f"  ⏳ Pending users with unpaid bonuses: {len(pending_unpaid)} (WAIT FOR VERIFICATION)")
        print(f"  🎯 Bonuses owed to verified referrers (referred user verified but not paid): {len(referrer_verified_unpaid)}")
        print()
        
        # ============================================================
        # 6. FIX VERIFIED UNPAID BONUSES
        # ============================================================
        total_fixed = 0
        
        if verified_unpaid:
            print(f"{Colors.BOLD}{Colors.GREEN}🔧 Fixing verified users' bonuses...{Colors.END}")
            
            for r in verified_unpaid:
                try:
                    # Mark as paid
                    cursor.execute("""
                        UPDATE referrals 
                        SET is_paid = true
                        WHERE id = %s
                    """, (r['id'],))
                    
                    # Add to wallet
                    cursor.execute("""
                        UPDATE wallets 
                        SET store_credit = store_credit + %s,
                            gross_earnings = gross_earnings + %s
                        WHERE user_id = %s
                    """, (r['bonus_amount'], r['bonus_amount'], r['referrer_id']))
                    
                    print_success(f"Paid {r['referrer_name']} MWK {float(r['bonus_amount']):,.0f} for {r['referral_type']} bonus ({r['referred_name']})")
                    total_fixed += 1
                    
                except Exception as e:
                    print_error(f"Failed to pay {r['referrer_name']}: {e}")
                    conn.rollback()
                    continue
        
        # Fix bonuses where referred user is verified but bonus not paid to referrer
        if referrer_verified_unpaid:
            print(f"{Colors.BOLD}{Colors.GREEN}🔧 Fixing bonuses owed to verified referrers...{Colors.END}")
            
            for r in referrer_verified_unpaid:
                try:
                    # Mark as paid
                    cursor.execute("""
                        UPDATE referrals 
                        SET is_paid = true
                        WHERE id = %s
                    """, (r['id'],))
                    
                    # Add to referrer's wallet
                    cursor.execute("""
                        UPDATE wallets 
                        SET store_credit = store_credit + %s,
                            gross_earnings = gross_earnings + %s
                        WHERE user_id = %s
                    """, (r['bonus_amount'], r['bonus_amount'], r['referrer_id']))
                    
                    print_success(f"Paid {r['referrer_name']} MWK {float(r['bonus_amount']):,.0f} for {r['referral_type']} bonus (referred: {r['referred_name']})")
                    total_fixed += 1
                    
                except Exception as e:
                    print_error(f"Failed to pay {r['referrer_name']}: {e}")
                    conn.rollback()
                    continue
        
        if total_fixed > 0:
            conn.commit()
            print()
            print_success(f"✅ Paid {total_fixed} bonuses!")
            print()
        else:
            print_info("No verified users with unpaid bonuses to fix.")
            print()
        
        # ============================================================
        # 7. PENDING USERS (Information only)
        # ============================================================
        if pending_unpaid:
            print(f"{Colors.BOLD}{Colors.YELLOW}⏳ Pending Users (not paid):{Colors.END}")
            for r in pending_unpaid:
                print(f"  {r['referrer_name']} → {r['referred_name']} (pending verification)")
            print()
            print_info("These will be paid automatically when users verify.")
        
        # ============================================================
        # 8. FINAL SUMMARY
        # ============================================================
        print_header("📊 FINAL SUMMARY")
        
        # Check remaining unpaid
        cursor.execute("""
            SELECT COUNT(*) as count, SUM(bonus_amount) as total
            FROM referrals
            WHERE is_paid = false
        """)
        remaining = cursor.fetchone()
        
        if remaining and remaining['count'] > 0:
            print(f"  ⏳ Remaining Unpaid: {remaining['count']}")
            print(f"  💰 Amount Remaining: MWK {float(remaining['total'] or 0):,.2f}")
            print(f"  ℹ️  These are for pending users who haven't verified yet")
        else:
            print_success("✅ All bonuses are now paid!")
        
    except Exception as e:
        conn.rollback()
        print_error(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        conn.close()

# ============================================================
# RUN
# ============================================================

if __name__ == '__main__':
    try:
        fix_all_bonuses()
    except KeyboardInterrupt:
        print("\n\n👋 Cancelled by user")
        sys.exit(0)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)
