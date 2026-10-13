import re

with open('src/pages/dashboard.astro', 'r') as f:
    content = f.read()

# Find the library case and replace it
old_library = r"case 'library':.*?break;"
new_library = '''case 'library':
          c.innerHTML = `
            <div class="page__section">
              <div class="section-header">
                <div class="section-header__left">
                  <div class="section-header__title">My Library</div>
                  <div class="section-header__sub">Your Vault content</div>
                </div>
              </div>
              <div id="library-content" style="text-align:center;padding:60px;color:var(--muted)">
                <div style="margin-bottom:16px;opacity:.3;">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/>
                  </svg>
                </div>
                <p>Loading your library...</p>
              </div>
            </div>
          `;
          // Fetch library content
          fetch('/api/content/library')
            .then(res => res.json())
            .then(data => {
              if (data.success && data.items.length > 0) {
                const libContent = document.getElementById('library-content');
                if (libContent) {
                  libContent.innerHTML = \`
                    <div class="page__section">
                      <div class="section-header">
                        <div class="section-header__left">
                          <div class="section-header__title">Available Content</div>
                          <div class="section-header__sub">\${data.totalItems} resources in your Vault</div>
                        </div>
                      </div>
                      <div class="packs-grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr));">
                        \${data.items.map((item: any) => \`
                          <div class="pack-card" style="cursor:default;">
                            <div class="pack-card__cover" style="height:120px;background:linear-gradient(135deg,#0f0f1e,#1a1a30);display:flex;align-items:center;justify-content:center;">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.2" opacity="0.5">
                                \${getContentIcon(item.content_type)}
                              </svg>
                            </div>
                            <div class="pack-card__body">
                              <div style="font-size:10px;color:var(--gold);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px;">\${item.category_name}</div>
                              <div class="pack-card__name" style="font-size:15px;">\${item.title}</div>
                              <div class="pack-card__desc">\${item.description}</div>
                              <button class="pack-card__btn" style="margin-top:8px;">Access →</button>
                            </div>
                          </div>
                        \`).join('')}
                      </div>
                    </div>
                  \`;
                }
              } else {
                const libContent = document.getElementById('library-content');
                if (libContent) {
                  libContent.innerHTML = \`
                    <div style="font-size:60px;margin-bottom:16px;opacity:.3;">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.5">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                      </svg>
                    </div>
                    <p style="font-size:16px;font-weight:600;color:var(--text);">Content loading...</p>
                    <p style="font-size:13px;margin-top:8px;">Your Vault resources will appear here</p>
                  \`;
                }
              }
            })
            .catch(() => {
              const libContent = document.getElementById('library-content');
              if (libContent) {
                libContent.innerHTML = \`<p>Failed to load library. Please try again.</p>\`;
              }
            });
          break;'''

content = re.sub(old_library, new_library, content, flags=re.DOTALL)

# Add getContentIcon function before the closing script tag
icon_func = '''
  function getContentIcon(type: string): string {
    const icons: Record<string, string> = {
      'pdf': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
      'video': '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
      'audio': '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
      'course': '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
      'guide': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
      'teaching': '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/>',
      'recipe': '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/>'
    };
    return icons[type] || '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>';
  }'''

content = content.replace('// Global functions', icon_func + '\n\n  // Global functions')

with open('src/pages/dashboard.astro', 'w') as f:
    f.write(content)

print("✅ Library tab updated to show free Vault content!")
print("✅ Content type icons added!")
