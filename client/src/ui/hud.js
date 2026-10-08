export class HUD {
  constructor() {
    this.feedContainer = document.getElementById('hud-feed-container');
    this.economyEl = document.getElementById('metric-economy');
    this.leaderboardList = document.getElementById('leaderboard-list');

    this.checkDisplayModes();
    window.addEventListener('resize', () => this.checkDisplayModes());
  }

  checkDisplayModes() {
    const params = new URLSearchParams(window.location.search);
    const isStream = params.get('mode') === 'stream' || params.get('mode') === 'obs';
    const isVertical = params.get('format') === 'vertical' || window.innerHeight > window.innerWidth;

    if (isStream) {
      document.body.classList.add('mode-obs');
    } else {
      document.body.classList.remove('mode-obs');
    }

    if (isVertical) {
      document.body.classList.add('mode-vertical');
    } else {
      document.body.classList.remove('mode-vertical');
    }
  }

  addNotification(event) {
    if (!this.feedContainer) return;

    const card = document.createElement('div');
    card.className = 'feed-card';

    let avatarIcon = '💬';
    let userText = `@${event.user || 'espectador'}`;
    let messageText = '';

    if (event.type === 'gift') {
      avatarIcon = '🎁';
      if (event.tier === 'legendary') {
        card.classList.add('legendary');
        avatarIcon = '☄️';
      } else if (event.tier === 'rare') {
        card.classList.add('highlight');
        avatarIcon = '🔥';
      }
      messageText = `Enviou ${event.gift || 'presente'}! ${event.description || ''}`;
    } else if (event.type === 'follow') {
      avatarIcon = '👤';
      card.classList.add('highlight');
      messageText = 'Agora é um novo morador da cidade!';
    } else if (event.type === 'like') {
      avatarIcon = '❤️';
      messageText = `Curtiu a transmissão (+${event.count || 1} likes)`;
    } else if (event.type === 'comment') {
      avatarIcon = '💬';
      messageText = event.comment || 'Interagiu na live';
    } else {
      avatarIcon = '⚡';
      messageText = `Evento: ${event.type}`;
    }

    card.innerHTML = `
      <div class="feed-avatar">${avatarIcon}</div>
      <div class="feed-content">
        <div class="feed-user">${userText}</div>
        <div class="feed-text">${messageText}</div>
      </div>
    `;

    this.feedContainer.appendChild(card);

    // Limit active notifications to 5
    while (this.feedContainer.children.length > 5) {
      this.feedContainer.removeChild(this.feedContainer.firstChild);
    }

    // Auto-remove card after 7 seconds
    setTimeout(() => {
      if (card.parentNode) {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-30px)';
        setTimeout(() => {
          if (card.parentNode) {
            card.parentNode.removeChild(card);
          }
        }, 300);
      }
    }, 7000);
  }

  updateEconomy(amount) {
    if (this.economyEl) {
      this.economyEl.textContent = `$${Number(amount || 0).toLocaleString('pt-BR')}`;
    }
  }

  updateLeaderboard(viewers) {
    if (!this.leaderboardList || !Array.isArray(viewers) || viewers.length === 0) return;

    this.leaderboardList.innerHTML = viewers.slice(0, 4).map((v, i) => `
      <div class="leaderboard-item">
        <span class="leaderboard-rank">${i + 1}</span>
        <span class="leaderboard-name">@${v.username}</span>
        <span class="leaderboard-val">$${(v.gifts_value * 10 + v.likes_count).toLocaleString('pt-BR')}</span>
      </div>
    `).join('');
  }
}
