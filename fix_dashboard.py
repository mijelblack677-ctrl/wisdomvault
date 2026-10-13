import re

with open('src/pages/dashboard.astro', 'r') as f:
    content = f.read()

# 1. Remove Uploads sidebar button
content = re.sub(
    r'<button class="sidebar__link" data-panel="uploads">.*?</button>',
    '',
    content,
    flags=re.DOTALL
)

# 2. Remove uploads case from renderPanel
content = re.sub(
    r"case 'uploads':.*?break;",
    '',
    content,
    flags=re.DOTALL
)

# 3. Remove the Uploads section label from sidebar
content = content.replace(
    '''<div class="sidebar__section">Content</div>''',
    '''<div class="sidebar__section">Content</div>'''
)

# 4. Replace emoji boxes with SVG icons in getPackEmoji
old_emoji_func = r"function getPackEmoji\(slug: string\): string \{[^}]*return map\[slug\] \|\| '📦';[^}]*\}"
new_svg_func = '''function getPackEmoji(slug: string): string {
    const svgs: Record<string, string> = {
      'secret-library': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1" opacity="0.6"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
      'cybersecurity-mastery': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="1" opacity="0.6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>',
      'wealth-architecture': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1" opacity="0.6"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      'relationship-mastery': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="1" opacity="0.6"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
      'survival-self-reliance': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="1" opacity="0.6"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>'
    };
    return svgs[slug] || '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1" opacity="0.6"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>';
  }'''

content = re.sub(old_emoji_func, new_svg_func, content, flags=re.DOTALL)

# 5. Replace quick-stat emoji icons with clean text/SVGs
# The quick stats use raw emojis like 📊 👥 📚 ⭐ - let's remove those boxes
content = content.replace("📊", '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.7"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>')
content = content.replace("👥", '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.7"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>')
content = content.replace("📚", '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.7"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>')
content = content.replace("⭐", '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.7"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>')

# 6. Replace not-logged icon emoji
content = content.replace("🔐", '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>')

# 7. Replace library empty state emoji
content = content.replace("📚", '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.5" opacity="0.3"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>', 1)  # Only first occurrence

# 8. Replace uploads empty state emoji
content = content.replace("📤", '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.5" opacity="0.3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>')

with open('src/pages/dashboard.astro', 'w') as f:
    f.write(content)

print("✅ Dashboard fixed:")
print("  - Removed Uploads tab from user sidebar")
print("  - Replaced all emoji boxes with clean SVG icons")
print("  - Pack icons now use themed SVGs per category")
print("  - Quick stats use proper icons")
