import re

with open('src/pages/dashboard.astro', 'r') as f:
    content = f.read()

# Find the corrupted getPackEmoji function (starts with "function getPackEmoji" and ends before "function getPackDetail")
# Replace the entire broken function with a clean one

old_func = r'function getPackEmoji\(slug: string\): string \{.*?(?=function getPackDetail)'
new_func = '''function getPackEmoji(slug: string): string {
    const svgs: Record<string, string> = {
      'secret-library': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1" opacity="0.6"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
      'cybersecurity-mastery': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="1" opacity="0.6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>',
      'wealth-architecture': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1" opacity="0.6"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      'relationship-mastery': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="1" opacity="0.6"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
      'survival-self-reliance': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="1" opacity="0.6"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>'
    };
    return svgs[slug] || '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1" opacity="0.6"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>';
  }

'''

content = re.sub(old_func, new_func, content, flags=re.DOTALL)

with open('src/pages/dashboard.astro', 'w') as f:
    f.write(content)

print("Fixed getPackEmoji function - removed corrupted duplicate and Unicode emojis")
