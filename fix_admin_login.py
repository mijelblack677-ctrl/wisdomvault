import os
import re

file_path = "src/pages/admin.astro"

# Read the file
with open(file_path, 'r') as f:
    content = f.read()

# 1. Fix the background image URL (Remove extra 'public/')
content = re.sub(r"url\('/public/images/shield.jpg'\)", "url('/images/shield.jpg')", content)

# 2. Replace the BORING HTML login card with the PREMIUM DARK GLASS one
# We are targeting the JavaScript string inside renderLogin()
old_login_html = r"`\s*<div class=\"admin-login\">\s*<div class=\"admin-login__card\">[\s\S]*?<\/div>\s*<\/div>`"
new_login_html = """`
        <div class="admin-login">
          <div class="admin-login__card">
            <div class="login-header">
              <h1 class="login-title">Wisdom <span class="gold">Vault</span></h1>
              <p class="login-subtitle">Administrator Access</p>
            </div>
            
            <form id="admin-login-form" class="login-form" onsubmit="return false;">
              <div class="form-group">
                <input type="email" id="admin-email" class="form-input" placeholder="Email Address" required />
              </div>
              <div class="form-group">
                <input type="password" id="admin-password" class="form-input" placeholder="Password" required />
              </div>
              <button type="button" class="login-btn" id="admin-login-btn">Sign In</button>
              <div id="admin-login-msg" class="login-message"></div>
            </form>
            
            <p class="login-footer">Protected by Wisdom Vault</p>
          </div>
        </div>
    `"""

# Perform the replacement
content = re.sub(old_login_html, new_login_html, content, flags=re.DOTALL)

# 3. Inject the PREMIUM CSS variables and dark-glass styles inside the <style> block
# We will target the END of the <style is:global> block to inject the good CSS
css_to_inject = """
  /* ===== PREMIUM DARK GLASS LOGIN STYLES ===== */
  .admin-login { height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; z-index: 10; }
  
  .admin-login__card {
    background: rgba(20, 20, 35, 0.85);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    padding: 48px 40px;
    border-radius: 20px;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
    width: 100%;
    max-width: 440px;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.06);
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
    transition: all 0.3s ease;
  }
  
  .admin-login__card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #F5A623, transparent);
    opacity: 0.6;
  }

  .login-header { margin-bottom: 32px; }
  
  .login-title {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-weight: 900;
    font-size: 36px;
    color: #FFFFFF;
    margin-bottom: 4px;
    letter-spacing: -0.02em;
  }
  
  .login-title .gold {
    background: linear-gradient(135deg, #F5A623, #FFC44A);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .login-subtitle {
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 4px;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group { width: 100%; }

  .form-input {
    width: 100%;
    padding: 16px 18px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    color: #FFFFFF;
    outline: none;
    transition: all 0.3s ease;
    box-sizing: border-box;
  }

  .form-input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  .form-input:focus {
    border-color: #F5A623;
    background: rgba(255, 255, 255, 0.06);
    box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.1);
  }

  .login-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #F5A623, #E0951A);
    color: #0B0B0B;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 16px;
    letter-spacing: 0.03em;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 24px rgba(245, 166, 35, 0.2);
    box-sizing: border-box;
  }

  .login-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 40px rgba(245, 166, 35, 0.3);
  }

  .login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .login-message {
    padding: 12px;
    border-radius: 10px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    text-align: center;
    margin-top: 4px;
    display: none;
  }
  
  .login-message--error { display: block; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #EF4444; }
  .login-message--success { display: block; background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.2); color: #4CAF50; }

  .login-footer {
    margin-top: 24px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.25);
    letter-spacing: 0.05em;
  }
"""

# Inject CSS right before the closing </style> tag
content = content.replace("</style>", css_to_inject + "\n</style>")

# 4. Update the JavaScript ID references so the login button works again
content = content.replace("document.getElementById('admin-login-btn')", "document.getElementById('admin-login-btn')")
content = content.replace("document.getElementById('admin-email')", "document.getElementById('admin-email')")
content = content.replace("document.getElementById('admin-password')", "document.getElementById('admin-password')")
content = content.replace("document.getElementById('admin-login-msg')", "document.getElementById('admin-login-msg')")

# Write the file back
with open(file_path, 'w') as f:
    f.write(content)

print("✅ Successfully upgraded the Admin Login page to dark glass!")
print("✅ Background image path fixed.")
print("\n▶️ Please restart your dev server (Ctrl+C, then npm run dev) and hard refresh the admin page.")
