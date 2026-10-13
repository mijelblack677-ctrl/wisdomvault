#!/usr/bin/env python3
"""
Shared database configuration for all Wisdom Vault admin tools.
Uses the production database: PostgreSQL 18 on the VPS (the Vercel app and
wisdomvault.online both read/write this same database).
"""

import os
import sys
import psycopg2
import psycopg2.extras

# ── PRODUCTION DATABASE (VPS PostgreSQL, TLS over the internet) ────────────
# Override with the DATABASE_URL env var to target something else, e.g. when
# running directly on the VPS:
#   export DATABASE_URL='postgresql://wisdom_vault:<pass>@127.0.0.1:5432/wisdom_vault'
DEFAULT_DATABASE_URL = (
    "postgresql://wisdom_vault:ab0968aa54a5690656104ec36076b763"
    "@185.131.54.4:5432/wisdom_vault"
    "?sslmode=require"
)
DATABASE_URL = os.environ.get("DATABASE_URL", DEFAULT_DATABASE_URL)

def get_db_connection():
    """Get a connection to the production database (VPS PostgreSQL)."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = False
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

# ── COLORS ──────────────────────────────────────────────────────────────────
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
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

def print_header(title, sub=""):
    width = 70
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*width}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{title.center(width)}{Colors.END}")
    if sub:
        print(f"{Colors.DIM}{sub.center(width)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*width}{Colors.END}\n")

def clear_screen():
    os.system('clear' if os.name == 'posix' else 'cls')

def input_prompt(prompt, default=""):
    if default:
        prompt = f"{prompt} [{default}]: "
    else:
        prompt = f"{prompt}: "
    result = input(f"{Colors.BOLD}{prompt}{Colors.END}").strip()
    return result if result else default

def input_confirm(prompt):
    return input(f"{Colors.YELLOW}{prompt} (y/n): {Colors.END}").lower() == 'y'

def display_table(data, headers, title=""):
    from tabulate import tabulate
    if not data:
        print_info("No data found")
        return
    if title:
        print(f"\n{Colors.BOLD}{title}{Colors.END}")
    print(tabulate(data, headers=headers, tablefmt='grid'))

# ── REFERRAL BONUS CONFIG ──────────────────────────────────────────────────
# Matches the production system
FIRST_LEVEL_BONUS = 7000.0    # MWK
SECOND_LEVEL_BONUS = 1000.0   # MWK
REGISTRATION_FEE = 10800.0    # MWK (10,000 + 800 agent fee)
