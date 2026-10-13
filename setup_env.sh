#!/usr/bin/env bash
# One-shot Python environment setup for the admin/ops tools.
# Creates a virtualenv (.venv) and installs requirements.txt into it.
# Safe to re-run: it reuses an existing .venv and just reinstalls deps.
set -e

cd "$(dirname "$0")"

PYTHON=${PYTHON:-python3}

if ! command -v "$PYTHON" >/dev/null 2>&1; then
    echo "❌ '$PYTHON' not found. Install Python 3 first." >&2
    exit 1
fi

# 1. Create the virtualenv if it doesn't exist yet
if [ ! -d ".venv" ]; then
    echo "🔧 Creating virtual environment at .venv ..."
    "$PYTHON" -m venv .venv
else
    echo "ℹ️  .venv already exists, reusing it."
fi

# 2. Activate it
# shellcheck disable=SC1091
source .venv/bin/activate

# 3. Install the requirements
echo "📦 Installing packages from requirements.txt ..."
pip install --upgrade pip
pip install -r requirements.txt

echo
echo "✅ Environment ready!"
echo "   Activate it in future sessions with:  source .venv/bin/activate"
echo "   Then run a tool, e.g.:                 python3 admin.py"
