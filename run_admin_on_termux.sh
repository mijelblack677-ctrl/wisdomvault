#!/data/data/com.termux/files/usr/bin/bash
# ============================================================================
# Wisdom Vault Admin - Termux One-Click Runner
# ============================================================================
# This script sets up everything needed to run admin.py on Termux and then
# launches it.  Designed for non-technical users: just copy this file to
# Termux and run:  bash run_admin_on_termux.sh
#
# What it does:
#  1. Installs required Termux system packages (Python, build tools, libpq)
#  2. Creates a virtual environment
#  3. Installs Python dependencies from requirements.txt
#  4. Copies db_config.py and admin.py into the venv
#  5. Launches admin.py
# ============================================================================

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${CYAN}${BOLD}======================================================================${NC}"
    echo -e "${CYAN}${BOLD}$1${NC}"
    echo -e "${CYAN}${BOLD}======================================================================${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}▶${NC} $1"
}

print_error() {
    echo -e "${RED}✖${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Determine script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

print_header "🏛️  WISDOM VAULT ADMIN — TERMUX SETUP"
echo -e "${BOLD}This will set up everything and launch the admin tool.${NC}"
echo -e "It only needs to run once.${NC}"
echo ""

# ── Step 1: Update Termux packages ────────────────────────────────────────
print_step "Updating Termux packages..."
pkg update -y 2>&1 | tail -3

# ── Step 2: Install required system packages ──────────────────────────────
print_step "Installing system packages (Python, libpq, gcc)..."
pkg install -y python libpq openssl-tool build-essential clang 2>&1 | tail -5

# ── Step 3: Verify Python ─────────────────────────────────────────────────
if ! command -v python3 >/dev/null 2>&1; then
    print_error "Python3 not found after install. Termux may need a reinstall."
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1)
echo -e "  ${GREEN}✓${NC} $PYTHON_VERSION"

# ── Step 4: Create virtual environment ────────────────────────────────────
VENV_DIR="$SCRIPT_DIR/.venv"

if [ -d "$VENV_DIR" ]; then
    echo -e "  ${YELLOW}ℹ${NC}  Virtualenv already exists at $VENV_DIR — reusing it."
else
    print_step "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
    echo -e "  ${GREEN}✓${NC}  Virtualenv created."
fi

# Activate
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

# Upgrade pip
print_step "Upgrading pip..."
pip install --upgrade pip 2>&1 | tail -2

# ── Step 5: Install Python dependencies ───────────────────────────────────
print_step "Installing Python dependencies (this may take a couple minutes)..."

# Install libpq-dev equivalent for psycopg2-binary
# psycopg2-binary has pre-built wheels but on ARM/Termux it may need libpq
# Install deps — try psycopg2-binary first (pre-built wheel), fall back to source if needed
pip install psycopg2-binary==2.9.12 tabulate==0.9.0 bcrypt==5.0.0 2>&1 | tail -10 || {
    echo -e "  ${YELLOW}⚠${NC}  psycopg2-binary wheel failed, trying source install..."
    pip install psycopg2==2.9.12 tabulate==0.9.0 bcrypt==5.0.0 2>&1 | tail -10
}

echo ""
echo -e "  ${GREEN}✓${NC}  All dependencies installed."

# ── Step 6: Verify imports ─────────────────────────────────────────────────
print_step "Verifying everything works..."
python3 -c "import psycopg2; import tabulate; import bcrypt; print('  ${GREEN}✓${NC}  All imports OK')" 2>&1

# ── Step 7: Launch admin.py ────────────────────────────────────────────────
echo ""
print_header "🚀 READY TO LAUNCH"
echo -e "${GREEN}Starting Wisdom Vault Admin...${NC}"
echo ""
echo -e "${YELLOW}Tip:${NC}  Next time just run:  source $VENV_DIR/bin/activate && python3 admin.py"
echo ""

# Make sure the terminal is big enough (Termux sometimes starts small)
stty cols 80 2>/dev/null || true

exec python3 admin.py
