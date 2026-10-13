import os
import shutil
import re

# ==========================================
# CONFIGURATION
# ==========================================
BASE_DIR = "/home/miracleb/wisdom-vault"
PAGES_DIR = os.path.join(BASE_DIR, "src/pages")
COMPONENTS_DIR = os.path.join(BASE_DIR, "src/components")
SQL_DIR = BASE_DIR  # Assuming SQL files are at root, adjust if needed

# ==========================================
# 1. BACKUP DASHBOARD
# ==========================================
dashboard_path = os.path.join(PAGES_DIR, "dashboard.astro")
if os.path.exists(dashboard_path):
    shutil.copy(dashboard_path, dashboard_path + ".backup")
    print(f"✅ Backed up dashboard.astro to dashboard.astro.backup")
else:
    print(f"⚠️ dashboard.astro not found at {dashboard_path}")

# ==========================================
# 2. DELETE PREMIUM PACK DIRECTORIES & FILES
# ==========================================
dirs_to_delete = [
    os.path.join(PAGES_DIR, "pack"),
    os.path.join(PAGES_DIR, "content"),
]
for d in dirs_to_delete:
    if os.path.exists(d):
        shutil.rmtree(d)
        print(f"✅ Deleted directory: {d}")

files_to_delete = [
    os.path.join(PAGES_DIR, "billing.astro"),
    os.path.join(SQL_DIR, "premium_packs_data.sql"),
    os.path.join(SQL_DIR, "user_premium_packs_data.sql"),
]
for f in files_to_delete:
    if os.path.exists(f):
        os.remove(f)
        print(f"✅ Deleted file: {f}")

# ==========================================
# 3. CLEAN SCHEMA SQL FILES (COMMENT OUT PREMIUM PACK TABLES)
# ==========================================
schema_files = [
    os.path.join(SQL_DIR, "schema_clean.sql"),
    os.path.join(SQL_DIR, "schema_fixed.sql")
]

patterns_to_comment = [
    r"CREATE\s+TABLE\s+premium_packs.*?;",
    r"CREATE\s+TABLE\s+user_premium_packs.*?;"
]

for file_path in schema_files:
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Remove or comment out the table creation blocks
        for pattern in patterns_to_comment:
            content = re.sub(pattern, lambda m: f"-- COMMMENTED OUT BY SCRIPT: {m.group(0)}", content, flags=re.DOTALL | re.IGNORECASE)
        
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"✅ Cleaned schema file: {file_path}")

# ==========================================
# 4. GENERATE THE NEW LIGHTWEIGHT DASHBOARD
# ==========================================
new_dashboard_content = """---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout>
  <div class="dashboard-page">
    <div class="dashboard-container">
      
      <div class="dashboard-header">
        <h1 class="dashboard-title">My <span class="gold">Vault</span></h1>
        <p class="dashboard-subtitle">Track your earnings and withdrawals at a glance.</p>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-label">Total Earned</div>
          <div class="stat-value" id="total-earned">$0.00</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏦</div>
          <div class="stat-label">Current Balance</div>
          <div class="stat-value" id="current-balance">$0.00</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📤</div>
          <div class="stat-label">Total Withdrawn</div>
          <div class="stat-value" id="total-withdrawn">$0.00</div>
        </div>
      </div>

      <!-- Action -->
      <div class="dashboard-actions">
        <a href="/withdraw" class="action-btn">Withdraw Funds →</a>
        <a href="/" class="action-btn secondary">Back to Home</a>
      </div>

    </div>
  </div>
</BaseLayout>

<style>
  .dashboard-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: #0D0D0D;
    position: relative;
  }

  .dashboard-container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 48px 40px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    box-sizing: border-box;
  }

  .dashboard-header {
    text-align: center;
    margin-bottom: 40px;
  }

  .dashboard-title {
    font-size: 36px;
    font-weight: 700;
    color: #FFFFFF;
    margin-bottom: 4px;
    letter-spacing: -0.02em;
  }

  .gold {
    background: linear-gradient(135deg, #F5A623, #FFC44A);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .dashboard-subtitle {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 4px;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 40px;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    padding: 20px 16px;
    text-align: center;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }

  .stat-icon {
    font-size: 28px;
    margin-bottom: 8px;
    display: block;
  }

  .stat-label {
    font-size: 12px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 0.05em;
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 22px;
    font-weight: 700;
    color: #FFFFFF;
  }

  /* Actions */
  .dashboard-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 14px 32px;
    font-weight: 600;
    font-size: 16px;
    text-decoration: none;
    border-radius: 50px;
    transition: all 0.3s ease;
    width: 100%;
    max-width: 280px;
    box-sizing: border-box;
  }

  .action-btn {
    background: linear-gradient(135deg, #F5A623, #E0951A);
    color: #0B0B0B;
    box-shadow: 0 4px 24px rgba(245, 166, 35, 0.2);
  }

  .action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 40px rgba(245, 166, 35, 0.3);
  }

  .action-btn.secondary {
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: none;
  }

  .action-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #FFFFFF;
  }

  /* Responsive */
  @media (max-width: 600px) {
    .dashboard-container { padding: 32px 24px; }
    .dashboard-title { font-size: 28px; }
    .stats-grid { grid-template-columns: 1fr; gap: 12px; }
    .stat-value { font-size: 20px; }
    .action-btn { max-width: 100%; }
  }
</style>

<script>
  // Simple fetch to load wallet data
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const res = await fetch('/api/user/wallet');
      const data = await res.json();
      
      if (data.success) {
        document.getElementById('total-earned').textContent = `$${data.totalEarned.toFixed(2)}`;
        document.getElementById('current-balance').textContent = `$${data.balance.toFixed(2)}`;
        document.getElementById('total-withdrawn').textContent = `$${data.totalWithdrawn.toFixed(2)}`;
      }
    } catch (e) {
      // Fallback to 0.00 if API not ready
      document.getElementById('total-earned').textContent = '$0.00';
      document.getElementById('current-balance').textContent = '$0.00';
      document.getElementById('total-withdrawn').textContent = '$0.00';
    }
  });
</script>
"""

with open(dashboard_path, 'w') as f:
    f.write(new_dashboard_content)
print(f"✅ Rewrote dashboard.astro with new lightweight stats UI")

print("\n🎉 Cleanup complete! Premium packs removed, dashboard updated.")
print("Please restart your dev server: Ctrl+C, then npm run dev")
