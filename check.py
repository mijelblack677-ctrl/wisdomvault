#!/usr/bin/env python3
"""
Wisdom Vault - Database Connection Test
Tests connection to the production PostgreSQL database (VPS).
"""

from db_config import get_db_connection, print_success, print_error, print_info, print_header

def test_connection():
    print_header("🔌 DATABASE CONNECTION TEST (VPS PostgreSQL)")
    
    connections = []
    try:
        print("🔄 Creating 20 connections...")
        for i in range(20):
            conn = get_db_connection()
            connections.append(conn)
            print(f"  ✅ Connection {i+1}/20 created")
        
        print("\n✅ All 20 connections created successfully!")
        print("💡 Database connection pool is working correctly.")
        
    except Exception as e:
        print_error(f"Failed: {e}")
        
    finally:
        for conn in connections:
            conn.close()
        print("\n🔒 All connections closed.")

if __name__ == '__main__':
    test_connection()
