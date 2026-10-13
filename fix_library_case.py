with open('src/pages/dashboard.astro', 'r') as f:
    content = f.read()

# The problem is escaped backticks in the library fetch .then() block
# Replace the corrupted library case with a clean one that uses proper string handling

old_library = r"""case 'library':
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
          `;"""

# Find what comes after the library case
import re
match = re.search(r"case 'library':.*?break;", content, re.DOTALL)
if match:
    old_block = match.group()
    
    new_block = """case 'library':
          c.innerHTML = '<div class="page__section"><div class="section-header"><div class="section-header__left"><div class="section-header__title">My Library</div><div class="section-header__sub">Your Vault content</div></div></div><div id="library-content" style="text-align:center;padding:60px;color:var(--muted)"><div style="margin-bottom:16px;opacity:.3;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg></div><p>Loading your library...</p></div></div>';
          fetch("/api/content/library").then(function(res) { return res.json(); }).then(function(data) {
            var libContent = document.getElementById("library-content");
            if (libContent && data.success && data.items.length > 0) {
              var itemsHtml = "";
              data.items.forEach(function(item) {
                var iconSvg = getContentIcon(item.content_type);
                itemsHtml += "<div class=\\"pack-card\\" style=\\"cursor:default;\\"><div class=\\"pack-card__cover\\" style=\\"height:120px;background:linear-gradient(135deg,#0f0f1e,#1a1a30);display:flex;align-items:center;justify-content:center;\\"><svg width=\\"32\\" height=\\"32\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"#C9A84C\\" stroke-width=\\"1.2\\" opacity=\\"0.5\\">" + iconSvg + "</svg></div><div class=\\"pack-card__body\\"><div style=\\"font-size:10px;color:var(--gold);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px;\\">" + item.category_name + "</div><div class=\\"pack-card__name\\" style=\\"font-size:15px;\\">" + item.title + "</div><div class=\\"pack-card__desc\\">" + item.description + "</div><button class=\\"pack-card__btn\\" style=\\"margin-top:8px;\\">Access</button></div></div>";
              });
              libContent.innerHTML = "<div class=\\"page__section\\"><div class=\\"section-header\\"><div class=\\"section-header__left\\"><div class=\\"section-header__title\\">Available Content</div><div class=\\"section-header__sub\\">" + data.totalItems + " resources in your Vault</div></div></div><div class=\\"packs-grid\\" style=\\"grid-template-columns:repeat(auto-fill,minmax(280px,1fr));\\">" + itemsHtml + "</div></div>";
            }
          }).catch(function() {
            var libContent = document.getElementById("library-content");
            if (libContent) libContent.innerHTML = "<p>Failed to load library.</p>";
          });
          break;"""
    
    content = content.replace(old_block, new_block)
    print("Library case replaced successfully")

with open('src/pages/dashboard.astro', 'w') as f:
    f.write(content)

print("Done - library case now uses standard JS strings instead of template literals")
