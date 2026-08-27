// UI Manager: Input Handling, Categorized Upgrade Modal, HUD, Boosts & Notifications
class UIManager {
  constructor(game) {
    this.game = game;
    this.inputVector = { x: 0, z: 0 };
    this.keys = {};
    this.isTouchActive = false;
    this.joystickCenter = { x: 0, y: 0 };
    this.displayMoney = 0;

    this.initInputs();
    this.initHUD();
  }

  initInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.code) this.keys[e.code.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      if (e.code) this.keys[e.code.toLowerCase()] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.inputVector = { x: 0, z: 0 };
    });

    const joystickZone = document.getElementById('joystick-zone');
    const joystickKnob = document.getElementById('joystick-knob');
    const maxRadius = 50;

    const handleStart = (clientX, clientY) => {
      this.isTouchActive = true;
      this.joystickCenter = { x: clientX, y: clientY };

      if (joystickZone) {
        joystickZone.style.left = `${clientX}px`;
        joystickZone.style.top = `${clientY}px`;
        joystickZone.style.display = 'block';
      }
      if (joystickKnob) {
        joystickKnob.style.transform = `translate(-50%, -50%)`;
      }
      handleMove(clientX, clientY);
    };

    const handleMove = (clientX, clientY) => {
      if (!this.isTouchActive) return;

      const dx = clientX - this.joystickCenter.x;
      const dy = clientY - this.joystickCenter.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist === 0) {
        this.inputVector = { x: 0, z: 0 };
        if (joystickKnob) joystickKnob.style.transform = `translate(-50%, -50%)`;
        return;
      }

      const clampedDist = Math.min(dist, maxRadius);
      const normX = dx / dist;
      const normY = dy / dist;

      if (joystickKnob) {
        joystickKnob.style.transform = `translate(calc(-50% + ${normX * clampedDist}px), calc(-50% + ${normY * clampedDist}px))`;
      }

      this.inputVector = {
        x: normX * (clampedDist / maxRadius),
        z: normY * (clampedDist / maxRadius)
      };
    };

    const handleEnd = () => {
      this.isTouchActive = false;
      this.inputVector = { x: 0, z: 0 };
      if (joystickZone) {
        joystickZone.style.display = 'none';
      }
      if (joystickKnob) {
        joystickKnob.style.transform = `translate(-50%, -50%)`;
      }
    };

    // Fullscreen Dynamic Touch Listeners (Move finger anywhere on screen to steer)
    window.addEventListener('touchstart', (e) => {
      // Don't intercept taps on buttons, modals, or interactive UI elements
      if (e.target.closest('button, .modal-card, .modal-overlay, .top-bar, .side-actions')) {
        return;
      }
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        handleStart(touch.clientX, touch.clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!this.isTouchActive) return;
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchcancel', handleEnd);

    // Fullscreen Mouse Drag for Desktop Testing
    let isMouseDown = false;
    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, .modal-card, .modal-overlay, .top-bar, .side-actions, #ui-layer')) {
        return;
      }
      isMouseDown = true;
      handleStart(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (isMouseDown) handleMove(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      if (isMouseDown) {
        isMouseDown = false;
        handleEnd();
      }
    });
  }

  getInputVector() {
    if (this.isTouchActive || Math.abs(this.inputVector.x) > 0.05 || Math.abs(this.inputVector.z) > 0.05) {
      return this.inputVector;
    }

    let kx = 0;
    let kz = 0;

    // Up / North
    if (this.keys['w'] || this.keys['arrowup'] || this.keys['keyw']) kz -= 1;
    // Down / South
    if (this.keys['s'] || this.keys['arrowdown'] || this.keys['keys']) kz += 1;
    // Left / West
    if (this.keys['a'] || this.keys['arrowleft'] || this.keys['keya']) kx -= 1;
    // Right / East (FIXED: kx += 1)
    if (this.keys['d'] || this.keys['arrowright'] || this.keys['keyd']) kx += 1;

    const len = Math.sqrt(kx * kx + kz * kz);
    if (len > 0) {
      return { x: kx / len, z: kz / len };
    }

    return { x: 0, z: 0 };
  }

  initHUD() {
    const btnSound = document.getElementById('btn-sound');
    const btnSettingsSound = document.getElementById('btn-settings-sound');

    const updateSoundUI = () => {
      const on = sounds.enabled;
      if (btnSound) btnSound.textContent = on ? '🔊' : '🔇';
      if (btnSettingsSound) btnSettingsSound.textContent = on ? 'Sound: ON 🔊' : 'Sound: OFF 🔇';
    };

    if (btnSound) {
      btnSound.addEventListener('click', () => {
        sounds.toggle();
        updateSoundUI();
      });
    }

    if (btnSettingsSound) {
      btnSettingsSound.addEventListener('click', () => {
        sounds.toggle();
        updateSoundUI();
      });
    }

    // Settings Modal
    const modalSettings = document.getElementById('modal-settings');
    const btnSettings = document.getElementById('btn-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');

    if (btnSettings && modalSettings) {
      btnSettings.addEventListener('click', () => {
        updateSoundUI();
        modalSettings.style.display = 'flex';
      });
    }

    if (btnCloseSettings && modalSettings) {
      btnCloseSettings.addEventListener('click', () => {
        modalSettings.style.display = 'none';
      });
    }

    // New Game Warning Modal
    const modalWarning = document.getElementById('modal-warning');
    const btnNewGame = document.getElementById('btn-new-game');
    const btnCloseWarning = document.getElementById('btn-close-warning');
    const btnCancelWarning = document.getElementById('btn-cancel-warning');
    const btnConfirmNewGame = document.getElementById('btn-confirm-new-game');

    if (btnNewGame && modalWarning) {
      btnNewGame.addEventListener('click', () => {
        if (modalSettings) modalSettings.style.display = 'none';
        modalWarning.style.display = 'flex';
      });
    }

    const closeWarning = () => {
      if (modalWarning) modalWarning.style.display = 'none';
    };

    if (btnCloseWarning) btnCloseWarning.addEventListener('click', closeWarning);
    if (btnCancelWarning) btnCancelWarning.addEventListener('click', closeWarning);

    if (btnConfirmNewGame) {
      btnConfirmNewGame.addEventListener('click', () => {
        closeWarning();
        sdk.clearGameState();
        try { localStorage.clear(); } catch (e) {}
        this.showNotification('🔄 RESETTING GAME... STARTING FRESH!');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      });
    }

    // Upgrade Modal & Category Tabs
    this.activeUpgradeTab = 'all';
    const modal = document.getElementById('modal-upgrade');
    const btnUpgrade = document.getElementById('btn-upgrade');
    const btnClose = document.getElementById('btn-close-upgrade');
    const tabButtons = document.querySelectorAll('#upgrade-tabs .tab-btn');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeUpgradeTab = btn.getAttribute('data-tab') || 'all';
        this.renderUpgradeModal();
      });
    });

    if (btnUpgrade && modal) {
      btnUpgrade.addEventListener('click', () => {
        this.renderUpgradeModal();
        modal.style.display = 'flex';
      });
    }

    if (btnClose && modal) {
      btnClose.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    const btnRewardedBoost = document.getElementById('btn-rewarded-boost');
    if (btnRewardedBoost) {
      btnRewardedBoost.addEventListener('click', () => {
        sdk.showRewardedAd('2x_profit', () => {
          sdk.activateBoost(180);
          this.showNotification('⚡ 2X PROFIT BOOST ACTIVATED FOR 3 MIN!');
        });
      });
    }

    const btnInstantHarvest = document.getElementById('btn-instant-restock');
    if (btnInstantHarvest) {
      btnInstantHarvest.addEventListener('click', () => {
        sdk.showRewardedAd('instant_crop', () => {
          this.game.instantHarvestAll();
          this.showNotification('🌾 ALL CROPS & STANDS INSTANTLY HARVESTED!');
        });
      });
    }
  }

  renderUpgradeModal() {
    const list = document.getElementById('upgrade-list');
    if (!list) return;

    list.innerHTML = '';

    const allUpgrades = Object.values(CONFIG.UPGRADES);
    const groups = [
      { id: 'production', title: '🌾 Production Rate (Crops & Animals)' },
      { id: 'quality', title: '✨ Product Quality & Value (Higher Sell Prices)' },
      { id: 'machinery', title: '⚙️ Machinery (Hopper & Shelves)' },
      { id: 'worker_player', title: '👥 Worker + Main Character' }
    ];

    const currentTab = this.activeUpgradeTab || 'all';

    groups.forEach(grp => {
      if (currentTab !== 'all' && currentTab !== grp.id) return;

      const upgradesInGroup = allUpgrades.filter(u => u.group === grp.id);
      if (upgradesInGroup.length === 0) return;

      if (currentTab === 'all') {
        const header = document.createElement('div');
        header.className = 'upgrade-group-header';
        header.textContent = grp.title;
        list.appendChild(header);
      }

      upgradesInGroup.forEach(upg => {
        const isMax = upg.currentLevel >= upg.costs.length;
        const rawCost = upg.costs[upg.currentLevel];
        const formattedCost = isMax 
          ? 'MAX' 
          : (rawCost >= 10000 ? `${(rawCost / 1000).toFixed(1)}K` : (rawCost >= 1000 ? `${rawCost.toLocaleString()}` : `${rawCost}`));

        const canAfford = !isMax && this.game.money >= rawCost;
        const currentVal = `${upg.levels[upg.currentLevel]} ${upg.unit || ''}`;
        const category = upg.category || 'General';

        const itemDiv = document.createElement('div');
        itemDiv.className = 'upgrade-item';
        itemDiv.innerHTML = `
          <div class="upgrade-icon">${upg.icon}</div>
          <div class="upgrade-details">
            <div class="upgrade-title">${upg.title} <span style="font-size:0.75em; opacity:0.7; font-weight:normal;">(${category})</span></div>
            <div class="upgrade-level">Level ${upg.currentLevel + 1} (${currentVal})</div>
          </div>
          <button class="upgrade-buy-btn" ${canAfford ? '' : 'disabled'}>
            ${formattedCost}
          </button>
        `;

        const buyBtn = itemDiv.querySelector('.upgrade-buy-btn');
        if (buyBtn && canAfford) {
          buyBtn.addEventListener('click', () => {
            const cost = upg.costs[upg.currentLevel];
            this.game.money -= cost;
            upg.currentLevel++;
            sounds.playUpgrade();

            // Refresh all game subsystems
            this.game.refreshAllUpgrades();

            this.renderUpgradeModal();
            this.showNotification(`⭐ ${upg.title} Upgraded to Lvl ${upg.currentLevel + 1}! (${upg.levels[upg.currentLevel]} ${upg.unit || ''})`);
          });
        }

        list.appendChild(itemDiv);
      });
    });
  }

  showNotification(msg) {
    const banner = document.getElementById('notification-banner');
    if (!banner) return;

    banner.textContent = msg;
    banner.classList.add('show');
    clearTimeout(this.notifTimeout);
    this.notifTimeout = setTimeout(() => {
      banner.classList.remove('show');
    }, 2800);
  }

  spawnFloatingText(text, screenX, screenY, isMoney = false) {
    const container = document.getElementById('floating-texts');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `floating-text ${isMoney ? 'money' : ''}`;
    el.textContent = text;
    el.style.left = `${screenX}px`;
    el.style.top = `${screenY}px`;

    container.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1000);
  }

  update(dt) {
    if (this.displayMoney !== this.game.money) {
      const diff = this.game.money - this.displayMoney;
      if (Math.abs(diff) < 2) {
        this.displayMoney = this.game.money;
      } else {
        this.displayMoney += Math.round(diff * Math.min(1.0, 18 * dt));
      }
      const moneyCountEl = document.getElementById('money-count');
      if (moneyCountEl) {
        const formatted = this.displayMoney >= 100000 
          ? `${(this.displayMoney / 1000).toFixed(1)}K` 
          : (this.displayMoney >= 1000 ? `${this.displayMoney.toLocaleString()}` : `${this.displayMoney}`);
        moneyCountEl.textContent = formatted;
      }
    }

    const capacityText = document.getElementById('capacity-text');
    const capacityFill = document.getElementById('capacity-fill');

    if (capacityText && capacityFill && this.game.player) {
      const current = this.game.player.stack.length;
      const max = this.game.player.capacity;
      capacityText.textContent = `${current} / ${max}`;
      
      const pct = Math.min(100, (current / max) * 100);
      capacityFill.style.width = `${pct}%`;
      
      if (current >= max) {
        capacityFill.classList.add('full');
      } else {
        capacityFill.classList.remove('full');
      }
    }

    const boostBadge = document.getElementById('boost-indicator');
    const boostTimerEl = document.getElementById('boost-timer');
    if (boostBadge && boostTimerEl) {
      if (sdk.boostActive) {
        boostBadge.style.display = 'flex';
        const mins = Math.floor(sdk.boostTimer / 60);
        const secs = Math.floor(sdk.boostTimer % 60);
        boostTimerEl.textContent = `2X CASH (${mins}:${secs.toString().padStart(2, '0')})`;
      } else {
        boostBadge.style.display = 'none';
      }
    }

    // Upgrade Availability & Recommendation Watchdog
    this.upgradeTipTimer = (this.upgradeTipTimer || 0) + dt;
    const btnUpgrade = document.getElementById('btn-upgrade');
    
    // Check which impactful upgrades can be afforded
    const affordableUpgrades = [];
    const playerMoney = this.game.money;
    const priorityKeys = ['capacity', 'speed', 'growth', 'stand_capacity', 'quality_tomato', 'quality_wheat', 'egg_speed'];
    for (let k of priorityKeys) {
      const u = CONFIG.UPGRADES[k];
      if (u && u.currentLevel < u.costs.length && playerMoney >= u.costs[u.currentLevel]) {
        affordableUpgrades.push(u);
      }
    }

    if (btnUpgrade) {
      if (affordableUpgrades.length > 0) {
        btnUpgrade.classList.add('pulse-upgrade');
      } else {
        btnUpgrade.classList.remove('pulse-upgrade');
      }
    }

    // 1. Backpack Full trigger: if backpack hits capacity and player can afford capacity upgrade
    if (this.game.player && this.game.player.isFull() && this.upgradeTipTimer > 15) {
      const capUpg = CONFIG.UPGRADES.capacity;
      if (capUpg && capUpg.currentLevel < capUpg.costs.length && playerMoney >= capUpg.costs[capUpg.currentLevel]) {
        const nextCap = capUpg.levels[capUpg.currentLevel + 1] || (capUpg.levels[capUpg.currentLevel] + 2);
        const cost = capUpg.costs[capUpg.currentLevel];
        this.showNotification(`🎒 Backpack Full! Tap ⭐ Upgrades to carry ${nextCap} items ($${cost})!`);
        this.upgradeTipTimer = 0;
      }
    }

    // 2. Periodic recommendation tip (every 40s) for the most impactful affordable upgrade
    if (this.upgradeTipTimer > 40 && affordableUpgrades.length > 0) {
      this.upgradeTipTimer = 0;
      const topUpg = affordableUpgrades[0];
      const nextVal = `${topUpg.levels[topUpg.currentLevel + 1]} ${topUpg.unit || ''}`;
      const cost = topUpg.costs[topUpg.currentLevel];
      
      let tipMsg = `⭐ ${topUpg.title} available ($${cost})! Tap ⭐ Upgrades to boost to ${nextVal}!`;
      if (topUpg.id === 'speed') {
        tipMsg = `👟 Speed Upgrade available ($${cost})! Tap ⭐ Upgrades to run faster! ⚡`;
      } else if (topUpg.id === 'growth') {
        tipMsg = `🌾 Crop Fertilizer available ($${cost})! Tap ⭐ Upgrades to grow crops faster! ⚡`;
      } else if (topUpg.id === 'stand_capacity') {
        tipMsg = `📦 Shelf Space available ($${cost})! Tap ⭐ Upgrades to hold more stock! 🏬`;
      }
      this.showNotification(tipMsg);
    }
  }
}