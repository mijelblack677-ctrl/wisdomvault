#!/usr/bin/env python3
"""
Check Password Hash Formats in Database
"""

import os
import sys
import psycopg2
import psycopg2.extras
from tabulate import tabulate

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db_config import DATABASE_URL  # single source of truth (see db_config.py)

def detect_hash_format(hash_string):
    """Detect what type of hash this is"""
    if not hash_string:
        return "Empty"
    
    # Check for bcrypt
    if hash_string.startswith('$2a$') or hash_string.startswith('$2b$') or hash_string.startswith('$2y$'):
        return "bcrypt"
    
    # Check for SHA-256 (64 hex characters)
    if len(hash_string) == 64 and all(c in '0123456789abcdefABCDEF' for c in hash_string):
        return "SHA-256"
    
    # Check for MD5 (32 hex characters)
    if len(hash_string) == 32 and all(c in '0123456789abcdefABCDEF' for c in hash_string):
        return "MD5"
    
    # Check for Argon2
    if hash_string.startswith('$argon2id$') or hash_string.startswith('$argon2i$'):
        return "Argon2"
    
    # Check for SHA-1 (40 hex characters)
    if len(hash_string) == 40 and all(c in '0123456789abcdefABCDEF' for c in hash_string):
        return "SHA-1"
    
    # Check if it looks like a bcrypt hash (starts with $ and has .)
    if hash_string.startswith('$') and '.' in hash_string:
        return "bcrypt (likely)"
    
    return "Unknown"

def check_password_hashes():
    """Check password hashes from the database"""
    print(f"\n{'='*70}")
    print(f"🔍 PASSWORD HASH INSPECTION")
    print(f"{'='*70}\n")
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Get sample of user passwords
        cursor.execute("""
            SELECT 
                id,
                full_name,
                email,
                password_hash,
                LENGTH(password_hash) as hash_length,
                created_at
            FROM users
            WHERE password_hash IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 20
        """)
        
        users = cursor.fetchall()
        
        if not users:
            print("❌ No users found with passwords")
            return
        
        print(f"{'='*70}")
        print(f"📊 SAMPLE PASSWORD HASHES")
        print(f"{'='*70}\n")
        
        table_data = []
        hash_types = {}
        
        for u in users:
            hash_type = detect_hash_format(u['password_hash'])
            hash_types[hash_type] = hash_types.get(hash_type, 0) + 1
            
            table_data.append([
                u['full_name'][:20] if u['full_name'] else 'N/A',
                u['email'][:25] if u['email'] else 'N/A',
                hash_type,
                u['hash_length'],
                u['password_hash'][:30] + '...' if u['password_hash'] else 'NULL'
            ])
        
        headers = ['Name', 'Email', 'Hash Type', 'Length', 'Hash Preview']
        print(tabulate(table_data, headers=headers, tablefmt='grid'))
        
        # Summary
        print(f"\n{'='*70}")
        print(f"📊 SUMMARY")
        print(f"{'='*70}\n")
        
        print(f"Total Users Checked: {len(users)}")
        print(f"\nHash Types Found:")
        for hash_type, count in hash_types.items():
            percentage = (count / len(users)) * 100
            print(f"  {hash_type}: {count} ({percentage:.1f}%)")
        
        # Check a few specific hashes in detail
        print(f"\n{'='*70}")
        print(f"🔬 DETAILED HASH ANALYSIS")
        print(f"{'='*70}\n")
        
        cursor.execute("""
            SELECT 
                full_name,
                email,
                password_hash
            FROM users
            WHERE password_hash IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 3
        """)
        
        sample_users = cursor.fetchall()
        
        for i, u in enumerate(sample_users, 1):
            hash_val = u['password_hash']
            print(f"{i}. {u['full_name']} ({u['email']})")
            print(f"   Hash: {hash_val}")
            print(f"   Length: {len(hash_val)}")
            print(f"   Format: {detect_hash_format(hash_val)}")
            
            # Show hex/ascii representation
            if len(hash_val) == 64:
                print(f"   Hex digits: {all(c in '0123456789abcdefABCDEF' for c in hash_val)}")
                print(f"   SHA-256: {'✅ YES' if all(c in '0123456789abcdefABCDEF' for c in hash_val) else '❌ NO'}")
            elif hash_val.startswith('$2'):
                print(f"   bcrypt: ✅ YES")
                print(f"   Cost Factor: {hash_val[4:6] if len(hash_val) > 6 else 'Unknown'}")
            print()
        
        # Check if there's a mix of hash types
        if len(hash_types) > 1:
            print(f"\n{'='*70}")
            print(f"⚠️  WARNING: MIXED HASH TYPES FOUND!")
            print(f"{'='*70}")
            print(f"\nYour database contains {len(hash_types)} different hash types.")
            print(f"This means users registered at different times may have different hashing methods.")
            print(f"\nRecommended Action:")
            print(f"1. Check when each hash type was introduced")
            print(f"2. Update your login code to handle all hash types")
            print(f"3. Or migrate all users to a single hash type")
        
        # Check the newest user's hash
        print(f"\n{'='*70}")
        print(f"📝 NEWEST USER HASH")
        print(f"{'='*70}\n")
        
        cursor.execute("""
            SELECT 
                full_name,
                email,
                password_hash,
                created_at
            FROM users
            WHERE password_hash IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 1
        """)
        
        newest = cursor.fetchone()
        if newest:
            print(f"User: {newest['full_name']} ({newest['email']})")
            print(f"Created: {newest['created_at']}")
            print(f"Hash: {newest['password_hash']}")
            print(f"Hash Type: {detect_hash_format(newest['password_hash'])}")
        
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    try:
        check_password_hashes()
        print(f"\nPress Enter to exit...")
        input()
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Error: {e}")
