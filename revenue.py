#!/usr/bin/env python3
"""
Wisdom Vault - Revenue & Analytics Tool
Excludes admin user and all their referrals (testing data)
"""

import os
import sys
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
from tabulate import tabulate

from db_config import (
    get_db_connection, Colors, print_success, print_error, print_warning,
    print_info, print_header, clear_screen
)

# Admin email to exclude (change this to your admin email)
ADMIN_EMAIL = "admin@wisdomvault.com"

def print_subheader(title):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{title}{Colors.END}")
    print(f"{Colors.BLUE}{'-'*50}{Colors.END}")

# ============================================================
# GET EXCLUDED USER IDS (Admin + Entire Tree)
# ============================================================

def get_excluded_user_ids():
    """Get all user IDs to exclude (admin + their entire referral tree)"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # First get the admin user ID
        cursor.execute("""
            SELECT id FROM users WHERE email = %s
        """, (ADMIN_EMAIL,))
        admin_result = cursor.fetchone()
        
        if not admin_result:
            print_warning(f"Admin user {ADMIN_EMAIL} not found, no exclusions applied")
            return []
        
        admin_id = admin_result['id']
        
        # Get all users referred by admin (entire tree)
        cursor.execute("""
            WITH RECURSIVE referral_tree AS (
                -- Start with admin's direct referrals
                SELECT id, referred_by, 1 as level
                FROM users
                WHERE referred_by = %s
                
                UNION ALL
                
                -- Then get their referrals (level 2, 3, etc.)
                SELECT u.id, u.referred_by, rt.level + 1
                FROM users u
                JOIN referral_tree rt ON u.referred_by = rt.id
            )
            SELECT id FROM referral_tree
            UNION
            SELECT %s  -- Include the admin themselves
        """, (admin_id, admin_id))
        
        excluded = [row['id'] for row in cursor.fetchall()]
        
        print_info(f"Excluding {len(excluded)} users (admin + their entire referral tree)")
        return excluded
        
    finally:
        cursor.close()
        conn.close()

# ============================================================
# MAIN REVENUE CALCULATION
# ============================================================

def calculate_revenue():
    print_header("💰 WISDOM VAULT REVENUE & ANALYTICS")
    print_info(f"Excluding admin: {ADMIN_EMAIL} and all their referrals\n")
    
    # Get excluded user IDs
    excluded_ids = get_excluded_user_ids()
    excluded_clause = f"AND u.id NOT IN ({','.join(['%s']*len(excluded_ids))})" if excluded_ids else ""
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # ============================================================
        # 1. USER STATISTICS (Excluding Admin Tree)
        # ============================================================
        print_subheader("👥 USER STATISTICS")
        
        query = """
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN payment_status = 'verified' THEN 1 ELSE 0 END) as verified_users,
                SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_users,
                SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_users
            FROM users u
            WHERE 1=1
        """
        params = []
        if excluded_ids:
            query += f" AND u.id NOT IN ({','.join(['%s']*len(excluded_ids))})"
            params.extend(excluded_ids)
        
        cursor.execute(query, params)
        user_stats = cursor.fetchone()
        
        total_users = user_stats['total_users'] or 0
        verified_users = user_stats['verified_users'] or 0
        pending_users = user_stats['pending_users'] or 0
        active_users = user_stats['active_users'] or 0
        
        print(f"  Total Users: {total_users:,}")
        print(f"  Verified Users: {Colors.GREEN}{verified_users:,}{Colors.END}")
        print(f"  Pending Users: {Colors.YELLOW}{pending_users:,}{Colors.END}")
        print(f"  Active Users: {Colors.CYAN}{active_users:,}{Colors.END}")
        print(f"  Verification Rate: {(verified_users/total_users*100):.1f}%" if total_users > 0 else "  Verification Rate: 0%")
        
        # ============================================================
        # 2. WITHDRAWAL STATISTICS (Excluding Admin Tree)
        # ============================================================
        print_subheader("💳 WITHDRAWAL STATISTICS")
        
        query = """
            SELECT 
                COUNT(w.id) as total_withdrawals,
                COUNT(DISTINCT wl.user_id) as unique_users_withdrawn,
                SUM(w.amount_requested) as total_requested,
                SUM(w.withdrawal_fee) as total_fees,
                SUM(w.amount_paid) as total_paid_out,
                SUM(CASE WHEN w.status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN w.status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN w.status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM withdrawals w
            JOIN wallets wl ON wl.id = w.wallet_id
            JOIN users u ON u.id = wl.user_id
            WHERE 1=1
        """
        params = []
        if excluded_ids:
            query += f" AND u.id NOT IN ({','.join(['%s']*len(excluded_ids))})"
            params.extend(excluded_ids)
        
        cursor.execute(query, params)
        withdrawal_stats = cursor.fetchone()
        
        total_withdrawals = withdrawal_stats['total_withdrawals'] or 0
        unique_withdrawn = withdrawal_stats['unique_users_withdrawn'] or 0
        total_requested = float(withdrawal_stats['total_requested'] or 0)
        total_fees = float(withdrawal_stats['total_fees'] or 0)
        total_paid_out = float(withdrawal_stats['total_paid_out'] or 0)
        pending = withdrawal_stats['pending'] or 0
        completed = withdrawal_stats['completed'] or 0
        rejected = withdrawal_stats['rejected'] or 0
        
        print(f"  Total Withdrawals: {total_withdrawals}")
        print(f"  Users Who Withdrew: {Colors.CYAN}{unique_withdrawn}{Colors.END}")
        print(f"  Total Requested: MWK {total_requested:,.2f}")
        print(f"  Total Fees Collected: MWK {total_fees:,.2f}")
        print(f"  Total Paid Out: MWK {total_paid_out:,.2f}")
        print()
        print(f"  Status Breakdown:")
        print(f"    ✅ Completed: {completed}")
        print(f"    ⏳ Pending: {Colors.YELLOW}{pending}{Colors.END}")
        print(f"    ❌ Rejected: {Colors.RED}{rejected}{Colors.END}")
        
        # ============================================================
        # 3. WALLET BALANCES (Excluding Admin Tree)
        # ============================================================
        print_subheader("💰 WALLET BALANCES (WITHDRAWABLE)")
        
        query = """
            SELECT 
                SUM(wl.balance_available) as total_withdrawable,
                AVG(wl.balance_available) as avg_withdrawable,
                SUM(wl.store_credit) as total_store_credit,
                SUM(wl.gross_earnings) as total_gross_earnings,
                COUNT(CASE WHEN wl.balance_available > 0 THEN 1 END) as users_with_balance
            FROM wallets wl
            JOIN users u ON u.id = wl.user_id
            WHERE 1=1
        """
        params = []
        if excluded_ids:
            query += f" AND u.id NOT IN ({','.join(['%s']*len(excluded_ids))})"
            params.extend(excluded_ids)
        
        cursor.execute(query, params)
        wallet_stats = cursor.fetchone()
        
        total_withdrawable = float(wallet_stats['total_withdrawable'] or 0)
        avg_withdrawable = float(wallet_stats['avg_withdrawable'] or 0)
        total_store_credit = float(wallet_stats['total_store_credit'] or 0)
        total_gross_earnings = float(wallet_stats['total_gross_earnings'] or 0)
        users_with_balance = wallet_stats['users_with_balance'] or 0
        
        print(f"  {Colors.BOLD}Total Withdrawable Balance:{Colors.END} MWK {total_withdrawable:,.2f}")
        print(f"  Average Withdrawable Balance: MWK {avg_withdrawable:,.2f}")
        print(f"  Users With Balance: {users_with_balance}")
        print(f"  Total Store Credit: MWK {total_store_credit:,.2f}")
        print(f"  Total Gross Earnings: MWK {total_gross_earnings:,.2f}")
        
        # ============================================================
        # 4. REGISTRATION FEE REVENUE (Excluding Admin Tree)
        # ============================================================
        print_subheader("📋 REGISTRATION FEE REVENUE (MWK 10,000)")
        
        fee_amount = 10000
        
        query = """
            SELECT 
                COUNT(*) as verified_count,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as last_30_days
            FROM users u
            WHERE payment_status = 'verified'
        """
        params = []
        if excluded_ids:
            query += f" AND u.id NOT IN ({','.join(['%s']*len(excluded_ids))})"
            params.extend(excluded_ids)
        
        cursor.execute(query, params)
        verified_stats = cursor.fetchone()
        
        verified_count = verified_stats['verified_count'] or 0
        last_30_days = verified_stats['last_30_days'] or 0
        
        total_revenue = verified_count * fee_amount
        recent_revenue = last_30_days * fee_amount
        
        print(f"  Registration Fee: MWK {fee_amount:,}")
        print(f"  Verified Users: {verified_count}")
        print(f"  {Colors.BOLD}Total Registration Revenue:{Colors.END} MWK {total_revenue:,.2f}")
        print(f"  New Users (Last 30 Days): {last_30_days}")
        print(f"  Recent Revenue (Last 30 Days): MWK {recent_revenue:,.2f}")
        
        # ============================================================
        # 5. NET REVENUE CALCULATION
        # ============================================================
        print_subheader("📊 NET REVENUE CALCULATION")
        
        net_revenue = total_revenue - total_paid_out
        
        print(f"  {Colors.BOLD}Total Registration Fees:{Colors.END} MWK {total_revenue:,.2f}")
        print(f"  {Colors.BOLD}Total Withdrawn:{Colors.END} MWK {total_paid_out:,.2f}")
        print(f"  {Colors.BOLD}Total Fees Collected (Withdrawals):{Colors.END} MWK {total_fees:,.2f}")
        print()
        print(f"  {Colors.BOLD}{Colors.CYAN}Net Revenue (Fees - Withdrawn):{Colors.END} MWK {net_revenue:,.2f}")
        print(f"  {Colors.BOLD}{Colors.CYAN}Total System Balance (Withdrawable):{Colors.END} MWK {total_withdrawable:,.2f}")
        
        # ============================================================
        # 6. MONTHLY BREAKDOWN (Excluding Admin Tree)
        # ============================================================
        print_subheader("📈 MONTHLY BREAKDOWN (Last 6 Months)")
        
        query = """
            SELECT 
                DATE_TRUNC('month', u.created_at) as month,
                COUNT(DISTINCT u.id) as new_users,
                COUNT(DISTINCT CASE WHEN u.payment_status = 'verified' THEN u.id END) as verified_new,
                COUNT(DISTINCT w.user_id) as users_withdrawn,
                COALESCE(SUM(w2.amount_paid), 0) as amount_withdrawn
            FROM users u
            LEFT JOIN wallets w ON w.user_id = u.id
            LEFT JOIN withdrawals w2 ON w2.wallet_id = w.id AND w2.status = 'completed'
            WHERE u.created_at >= NOW() - INTERVAL '6 months'
        """
        params = []
        if excluded_ids:
            query += f" AND u.id NOT IN ({','.join(['%s']*len(excluded_ids))})"
            params.extend(excluded_ids)
        
        query += " GROUP BY DATE_TRUNC('month', u.created_at) ORDER BY month DESC"
        
        cursor.execute(query, params)
        monthly = cursor.fetchall()
        
        if monthly:
            table_data = []
            for m in monthly:
                table_data.append([
                    m['month'].strftime('%B %Y') if m['month'] else 'N/A',
                    m['new_users'] or 0,
                    m['verified_new'] or 0,
                    m['users_withdrawn'] or 0,
                    f"MWK {float(m['amount_withdrawn'] or 0):,.0f}"
                ])
            
            headers = ['Month', 'New Users', 'Verified', 'Withdrew', 'Amount Withdrawn']
            print(tabulate(table_data, headers=headers, tablefmt='grid'))
        else:
            print_info("No data for last 6 months")
        
        # ============================================================
        # 7. TOP WITHDRAWERS (Excluding Admin Tree)
        # ============================================================
        print_subheader("🏆 TOP WITHDRAWERS (All Time)")
        
        query = """
            SELECT 
                u.full_name,
                u.email,
                COUNT(w.id) as withdrawal_count,
                SUM(w.amount_paid) as total_withdrawn
            FROM users u
            JOIN wallets wl ON wl.user_id = u.id
            JOIN withdrawals w ON w.wallet_id = wl.id
            WHERE w.status = 'completed'
        """
        params = []
        if excluded_ids:
            query += f" AND u.id NOT IN ({','.join(['%s']*len(excluded_ids))})"
            params.extend(excluded_ids)
        
        query += " GROUP BY u.id, u.full_name, u.email ORDER BY total_withdrawn DESC LIMIT 10"
        
        cursor.execute(query, params)
        top_withdrawers = cursor.fetchall()
        
        if top_withdrawers:
            table_data = []
            for tw in top_withdrawers:
                table_data.append([
                    tw['full_name'] or 'N/A',
                    tw['email'] or 'N/A',
                    tw['withdrawal_count'] or 0,
                    f"MWK {float(tw['total_withdrawn'] or 0):,.2f}"
                ])
            
            headers = ['Name', 'Email', 'Withdrawals', 'Total Withdrawn']
            print(tabulate(table_data, headers=headers, tablefmt='grid'))
        else:
            print_info("No withdrawals yet")
        
        # ============================================================
        # 8. SUMMARY DASHBOARD
        # ============================================================
        print_header("📊 EXECUTIVE SUMMARY")
        
        print(f"{Colors.BOLD}{Colors.CYAN}REVENUE OVERVIEW{Colors.END}")
        print(f"  Registration Revenue:        MWK {total_revenue:>12,.2f}")
        print(f"  Withdrawal Fees Collected:   MWK {total_fees:>12,.2f}")
        print(f"  Total Paid Out:              MWK {total_paid_out:>12,.2f}")
        print(f"  {Colors.BOLD}Net Revenue:{Colors.END}                     MWK {net_revenue:>12,.2f}")
        print()
        
        print(f"{Colors.BOLD}{Colors.CYAN}BALANCE OVERVIEW{Colors.END}")
        print(f"  Total Withdrawable Balance:  MWK {total_withdrawable:>12,.2f}")
        print(f"  Total Store Credit:          MWK {total_store_credit:>12,.2f}")
        print(f"  Total Gross Earnings:        MWK {total_gross_earnings:>12,.2f}")
        print()
        
        print(f"{Colors.BOLD}{Colors.CYAN}USER OVERVIEW{Colors.END}")
        print(f"  Total Users:                 {total_users:>12,}")
        print(f"  Verified Users:              {verified_users:>12,}")
        print(f"  Users With Balance:          {users_with_balance:>12,}")
        print(f"  Users Who Withdrew:          {unique_withdrawn:>12,}")
        print()
        
        # Calculate health metrics
        withdrawal_rate = (unique_withdrawn / verified_users * 100) if verified_users > 0 else 0
        avg_balance_per_user = (total_withdrawable / total_users) if total_users > 0 else 0
        
        print(f"{Colors.BOLD}{Colors.CYAN}HEALTH METRICS{Colors.END}")
        print(f"  Withdrawal Rate:             {withdrawal_rate:>11.1f}%")
        print(f"  Avg Balance Per User:        MWK {avg_balance_per_user:>10,.2f}")
        print(f"  Verification Rate:           {(verified_users/total_users*100):>11.1f}%" if total_users > 0 else "  0%")
        
    except Exception as e:
        print_error(f"Error calculating revenue: {e}")
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
        calculate_revenue()
        print("\n" + "="*70)
        print(f"{Colors.DIM}Press Enter to exit...{Colors.END}")
        input()
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
        sys.exit(0)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)
