// public/earn-watch.js
// Earn & Watch functionality for Wisdom Vault dashboard

function loadEarnWatch() {
  var user = JSON.parse(localStorage.getItem("wisdom_vault_user") || "{}");
  if (!user.id) {
    var ec = document.getElementById("earn-content");
    if (ec) ec.innerHTML = '<p style="color:var(--muted);">Please sign in to earn rewards.</p>';
    return;
  }

  fetch("/api/earn/watch?userId=" + user.id)
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var ec = document.getElementById("earn-content");
      if (!ec) return;

      var items = [];
      var totalEarned = 0;

      if (d.success && d.content && d.content.length > 0) {
        items = d.content;
        totalEarned = d.totalEarned || 0;
      }

      if (items.length === 0) {
        items = [
          { id: 'sys-1', title: 'Daily Wisdom Minute', description: 'Listen to today\'s message.', content_type: 'audio', sponsor_name: 'Wisdom Vault', reward_amount: 25, duration_seconds: 30, watchedToday: false, external_link: null },
          { id: 'sys-2', title: 'Quick Tech Update', description: 'Latest tech news.', content_type: 'video', sponsor_name: 'Wisdom Vault', reward_amount: 35, duration_seconds: 45, watchedToday: false, external_link: null },
          { id: 'sys-3', title: 'Relaxation Sounds', description: 'Calming music.', content_type: 'audio', sponsor_name: 'Wisdom Vault', reward_amount: 20, duration_seconds: 60, watchedToday: false, external_link: null }
        ];
      }

      // Filter out already watched items - only show available ones
      var availableItems = items.filter(function(i) { return !i.watchedToday; });
      var watchedCount = items.length - availableItems.length;

      var html = "";
      html += '<div style="margin-bottom:20px;display:flex;gap:20px;flex-wrap:wrap;">';
      html += '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px 20px;text-align:center;"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;">Earned Total</div><div style="font-size:28px;font-weight:800;color:var(--gold);">' + totalEarned.toLocaleString() + '</div></div>';
      html += '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px 20px;text-align:center;"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;">Available Now</div><div style="font-size:28px;font-weight:800;color:var(--green);">' + availableItems.length + '</div></div>';
      html += '</div>';

      if (watchedCount > 0) {
        html += '<p style="color:var(--muted);font-size:12px;margin-bottom:16px;text-align:center;">' + watchedCount + ' item' + (watchedCount > 1 ? 's' : '') + ' completed today. Come back tomorrow for more!</p>';
      }

      if (availableItems.length === 0) {
        html += '<div style="text-align:center;padding:50px 20px;color:var(--muted);"><div style="margin-bottom:12px;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D4A853" stroke-width="1.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></div><p style="font-size:16px;font-weight:600;color:var(--text);">All caught up!</p><p style="margin-top:4px;">You\'ve completed all available content for today. Check back tomorrow for new earning opportunities.</p></div>';
      } else {
        availableItems.forEach(function(item) {
          var isVideo = item.content_type === "video";
          var icon = isVideo
            ? '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4A853" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>'
            : '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4A853" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
          
          var isSystem = item.id && item.id.toString().startsWith('sys-');
          var hasLink = item.external_link && item.external_link !== 'null' && item.external_link !== '';
          
          var btn;
          if (hasLink) {
            btn = '<button class="pack-card__btn" onclick="window.openSponsored(\'' + item.id + '\', ' + item.reward_amount + ', \'' + item.external_link.replace(/'/g, "\\'") + '\', this)" style="color:var(--green);border-color:var(--green);">Open & Earn +' + item.reward_amount + '</button>';
          } else if (isSystem) {
            btn = '<button class="pack-card__btn" onclick="window.watchContent(\'' + item.id + '\', ' + item.reward_amount + ')" style="color:var(--gold);border-color:var(--gold);">Claim +' + item.reward_amount + '</button>';
          } else {
            btn = '<button class="pack-card__btn" onclick="window.watchContent(\'' + item.id + '\', ' + item.reward_amount + ')" style="color:var(--green);border-color:var(--green);">Claim +' + item.reward_amount + '</button>';
          }
          
          html += '<div class="pack-card" style="margin-bottom:16px;animation:fadeUp 0.3s ease-out;"><div class="pack-card__cover" style="height:100px;background:linear-gradient(135deg,#1a0f1f,#2d1f35);display:flex;align-items:center;justify-content:center;">' + icon + '</div><div class="pack-card__body"><div class="pack-card__name">' + item.title + '</div><div class="pack-card__desc">' + (item.description || "") + '</div><div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:11px;color:var(--muted);">' + (item.sponsor_name || "Wisdom Vault") + ' - ' + item.duration_seconds + 's</span><span style="font-size:18px;font-weight:800;color:var(--green);">+' + item.reward_amount + '</span></div>' + btn + '</div></div>';
        });
      }
      
      ec.innerHTML = html;
    })
    .catch(function(err) {
      console.error('Earn watch error:', err);
      var ec = document.getElementById("earn-content");
      if (ec) ec.innerHTML = '<p style="color:var(--red);">Failed to load earning content. Please refresh.</p>';
    });
}

window.watchContent = function(contentId, reward) {
  var user = JSON.parse(localStorage.getItem("wisdom_vault_user") || "{}");
  if (!user.id) {
    alert("Please sign in first.");
    return;
  }
  
  var isSystem = contentId && contentId.toString().startsWith('sys-');
  if (isSystem) {
    alert("System content! You earned " + reward + "! (Demo mode)");
    // Simulate earning
    var btn = document.querySelector('.pack-card__btn[onclick*="' + contentId + '"]');
    if (btn) {
      btn.textContent = 'Completed!';
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'default';
      btn.style.borderColor = 'var(--green)';
      btn.style.color = 'var(--green)';
    }
    // Refresh the earn watch stats after a moment
    setTimeout(loadEarnWatch, 1000);
    return;
  }
  
  if (!confirm("Watch this content to earn " + reward + "? Make sure to watch the full content.")) return;
  
  fetch("/api/earn/watch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user.id, contentId: contentId })
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    if (d.success) {
      alert("Earned " + d.reward + "! Your wallet has been credited.");
      loadEarnWatch();
    } else {
      alert(d.message || "Already claimed today or content not available.");
    }
  })
  .catch(function() {
    alert("Network error. Please try again.");
  });
};

window.openSponsored = function(contentId, reward, externalLink, btnElement) {
  var user = JSON.parse(localStorage.getItem("wisdom_vault_user") || "{}");
  if (!user.id) {
    alert("Please sign in first.");
    return;
  }
  
  window.open(externalLink, '_blank');
  
  var secondsLeft = 90;
  var originalHTML = btnElement.innerHTML;
  btnElement.innerHTML = 'Wait ' + secondsLeft + 's...';
  btnElement.disabled = true;
  btnElement.style.opacity = '0.6';
  btnElement.style.cursor = 'wait';
  
  var countdown = setInterval(function() {
    secondsLeft--;
    btnElement.innerHTML = 'Wait ' + secondsLeft + 's...';
    if (secondsLeft <= 0) {
      clearInterval(countdown);
      fetch("/api/earn/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, contentId: contentId })
      })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success) {
          // Remove the card with animation
          var card = btnElement.closest('.pack-card');
          if (card) {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '0';
            card.style.transform = 'translateX(30px)';
            setTimeout(function() {
              card.remove();
              // Update the available count - reload earn watch
              var ec = document.getElementById('earn-content');
              if (ec) {
                // Check if any cards remain
                var remainingCards = document.querySelectorAll('.pack-card');
                if (remainingCards.length === 0) {
                  var statsHTML = ec.querySelector('div')?.outerHTML || '';
                  ec.innerHTML = statsHTML + '<div style="text-align:center;padding:50px 20px;color:var(--muted);"><div style="margin-bottom:12px;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D4A853" stroke-width="1.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></div><p style="font-size:16px;font-weight:600;color:var(--text);">All caught up!</p><p style="margin-top:4px;">You\'ve completed all available content for today. Check back tomorrow!</p></div>';
                } else {
                  // Update the available count
                  var availEl = document.querySelector('.quick-stat__value');
                  if (availEl) {
                    var count = document.querySelectorAll('.pack-card').length;
                    availEl.textContent = count;
                  }
                }
              }
            }, 400);
          }
        } else {
          btnElement.innerHTML = originalHTML;
          btnElement.disabled = false;
          btnElement.style.opacity = '1';
          btnElement.style.cursor = 'pointer';
          alert(d.message || 'Failed to claim reward.');
        }
      })
      .catch(function() {
        btnElement.innerHTML = originalHTML;
        btnElement.disabled = false;
        btnElement.style.opacity = '1';
        btnElement.style.cursor = 'pointer';
        alert('Network error. Please try again.');
      });
    }
  }, 1000);
};
