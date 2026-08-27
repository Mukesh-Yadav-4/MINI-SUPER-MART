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
    const btnBgm = document.getElementById('btn-bgm');
    const btnSettingsBgm = document.getElementById('btn-settings-bgm');
    const sliderBgmVol = document.getElementById('slider-bgm-volume');
    const labelBgmVol = document.getElementById('label-bgm-volume');

    const updateSoundUI = () => {
      const sfxOn = !sounds.muted;
      if (btnSound) btnSound.textContent = sfxOn ? '🔊' : '🔇';
      if (btnSettingsSound) btnSettingsSound.textContent = sfxOn ? 'SFX: ON 🔊' : 'SFX: OFF 🔇';

      const bgmOn = !sounds.bgmMuted;
      if (btnBgm) btnBgm.textContent = bgmOn ? '🎵' : '🔇';
      if (btnSettingsBgm) btnSettingsBgm.textContent = bgmOn ? 'Music: ON 🎵' : 'Music: OFF 🔇';

      if (sliderBgmVol) {
        sliderBgmVol.value = bgmOn ? Math.round((sounds.bgmVolumeFactor || 0.75) * 100) : 0;
        if (labelBgmVol) labelBgmVol.textContent = `${sliderBgmVol.value}%`;
      }
    };

    if (btnSound) {
      btnSound.addEventListener('click', () => {
        sounds.toggleMute();
        updateSoundUI();
      });
    }

    if (btnSettingsSound) {
      btnSettingsSound.addEventListener('click', () => {
        sounds.toggleMute();
        updateSoundUI();
      });
    }

    if (btnBgm) {
      btnBgm.addEventListener('click', () => {
        sounds.toggleBGM();
        updateSoundUI();
      });
    }

    if (btnSettingsBgm) {
      btnSettingsBgm.addEventListener('click', () => {
        sounds.toggleBGM();
        updateSoundUI();
      });
    }

    if (sliderBgmVol) {
      const curPct = Math.round((sounds.bgmVolumeFactor || 0.75) * 100);
      sliderBgmVol.value = sounds.bgmMuted ? 0 : curPct;
      if (labelBgmVol) labelBgmVol.textContent = `${sliderBgmVol.value}%`;

      sliderBgmVol.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (labelBgmVol) labelBgmVol.textContent = `${val}%`;
        sounds.setBGMVolume(val / 100);
        const bgmOn = !sounds.bgmMuted;
        if (btnBgm) btnBgm.textContent = bgmOn ? '🎵' : '🔇';
        if (btnSettingsBgm) btnSettingsBgm.textContent = bgmOn ? 'Music: ON 🎵' : 'Music: OFF 🔇';
      });
    }

    // Leaderboard Competitor Roster & High-Score Tracking
    this.leaderboardCompetitors = [
      { rank: 1, name: '👑 Royal Chateau Patisserie', score: 500000, tier: '👑 Grand Emporium' },
      { rank: 2, name: '👑 Golden Valley Mega-Mart', score: 250000, tier: '👑 Mega Franchise' },
      { rank: 3, name: '🥇 Sunnybrook Super Ranch', score: 100000, tier: '🥇 Super Mart' },
      { rank: 4, name: '🥇 Emerald Harvest Agro', score: 50000, tier: '🥇 Master Mart' },
      { rank: 5, name: '🥈 Sweet Strawberry Fields', score: 25000, tier: '🥈 Country Mart' },
      { rank: 6, name: '🥈 Fresh Meadow Organic Farm', score: 10000, tier: '🥈 Local Mart' },
      { rank: 7, name: '🥉 Sunrise Produce Corner', score: 3500, tier: '🥉 Farm Stand' },
      { rank: 8, name: '🥉 Rustic Barnyard Stall', score: 1000, tier: '🥉 Starter Stall' }
    ];

    this.playerHighScore = 0;
    try {
      const savedPeak = localStorage.getItem('ofm_peak_balance');
      if (savedPeak) this.playerHighScore = parseInt(savedPeak, 10) || 0;
      const savedName = localStorage.getItem('ofm_farm_name');
      this.playerFarmName = savedName || '🧑‍🌾 Green Acres Mart';
      const savedRank = localStorage.getItem('ofm_last_rank');
      this.lastAnnouncedRank = savedRank ? parseInt(savedRank, 10) : 9;
    } catch (e) {
      this.playerFarmName = '🧑‍🌾 Green Acres Mart';
      this.lastAnnouncedRank = 9;
    }

    // Leaderboard Modal
    const modalLeaderboard = document.getElementById('modal-leaderboard');
    const btnLeaderboard = document.getElementById('btn-leaderboard');
    const btnCloseLeaderboard = document.getElementById('btn-close-leaderboard');
    const btnEditFarmName = document.getElementById('btn-edit-farm-name');

    if (btnLeaderboard && modalLeaderboard) {
      btnLeaderboard.addEventListener('click', () => {
        this.renderLeaderboard();
        modalLeaderboard.style.display = 'flex';
      });
    }

    if (btnCloseLeaderboard && modalLeaderboard) {
      btnCloseLeaderboard.addEventListener('click', () => {
        modalLeaderboard.style.display = 'none';
      });
    }

    if (btnEditFarmName) {
      btnEditFarmName.addEventListener('click', () => {
        const newName = prompt('Enter your Mart/Farm Name:', this.playerFarmName);
        if (newName && newName.trim().length > 0) {
          this.playerFarmName = newName.trim().substring(0, 24);
          try { localStorage.setItem('ofm_farm_name', this.playerFarmName); } catch (e) {}
          this.renderLeaderboard();
        }
      });
    }

    // CrazyGames Live Auth Button
    const btnCgAuth = document.getElementById('btn-cg-auth');
    if (btnCgAuth) {
      btnCgAuth.addEventListener('click', async () => {
        const user = await sdk.promptCrazyAuth();
        if (user && user.username) {
          this.playerFarmName = `🎮 ${user.username}'s Mart`;
          try { localStorage.setItem('ofm_farm_name', this.playerFarmName); } catch (e) {}
          this.showNotification(`🎮 Logged in as ${user.username}! High score synced to CrazyGames!`);
          this.renderLeaderboard();
        }
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
        sdk.showRewardedAd('vip_frenzy', () => {
          sdk.activateVipFrenzy(180);
          this.showNotification('👑 VIP FRENZY ACTIVATED! 2X CASH & +5 BAG FOR 3 MIN!');
          sounds.playCash();
        });
      });
    }

    const btnVipBus = document.getElementById('btn-vip-bus');
    if (btnVipBus) {
      btnVipBus.addEventListener('click', () => {
        sdk.showRewardedAd('vip_bus', () => {
          if (this.game && this.game.customerManager) {
            this.game.customerManager.spawnVipWave(5);
            this.showNotification('🚌 VIP TOUR BUS ARRIVED! 5 GOLDEN BILLIONAIRES ENTERING!');
            sounds.playCash();
          }
        });
      });
    }

    const btnInstantHarvest = document.getElementById('btn-instant-restock');
    if (btnInstantHarvest) {
      btnInstantHarvest.addEventListener('click', () => {
        sdk.showRewardedAd('instant_crop', () => {
          this.game.instantHarvestAll();
          this.showNotification('🌾 ALL CROPS & STANDS INSTANTLY HARVESTED!');
          sounds.playHarvest();
        });
      });
    }
  }

  renderUpgradeModal() {
    const list = document.getElementById('upgrade-list');
    if (!list) return;

    // Update real-time money badge in modal header
    const modalMoney = document.getElementById('modal-money-count');
    if (modalMoney) {
      modalMoney.textContent = this.game.money >= 100000 
        ? `$${(this.game.money / 1000).toFixed(1)}K` 
        : `$${this.game.money.toLocaleString()}`;
    }

    list.innerHTML = '';

    const allUpgrades = Object.values(CONFIG.UPGRADES);
    const groups = [
      { id: 'production', title: '🌾 Farm Speed & Livestock' },
      { id: 'quality', title: '✨ Product Sell Value' },
      { id: 'machinery', title: '⚙️ Machine Hoppers & Shelves' },
      { id: 'worker_player', title: '👤 Player Mobility & Backpack' }
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
        const curVal = upg.levels[upg.currentLevel];
        const nextVal = isMax ? curVal : upg.levels[upg.currentLevel + 1];
        const unit = upg.unit || '';
        const isQuality = upg.group === 'quality';

        let benefitHTML = '';
        if (isMax) {
          benefitHTML = `<span class="benefit-max">⭐ MAX LEVEL (${isQuality ? '$' : ''}${curVal} ${unit})</span>`;
        } else {
          benefitHTML = `
            <span class="benefit-cur">${isQuality ? '$' : ''}${curVal}</span>
            <span class="benefit-arrow">➔</span>
            <span class="benefit-next">${isQuality ? '$' : ''}${nextVal}</span>
            <span class="benefit-unit">${unit}</span>
          `;
        }

        const itemDiv = document.createElement('div');
        itemDiv.className = `upgrade-item ${canAfford ? 'affordable-card' : ''} ${isMax ? 'maxed-card' : ''}`;
        itemDiv.innerHTML = `
          <div class="upgrade-icon-box">
            <span class="upgrade-emoji">${upg.icon}</span>
          </div>
          <div class="upgrade-info-col">
            <div class="upgrade-title-row">
              <span class="upgrade-title-text">${upg.title}</span>
              <span class="upgrade-level-pill ${isMax ? 'max-pill' : ''}">Lv ${upg.currentLevel + 1}</span>
            </div>
            <div class="upgrade-benefit-row">
              ${benefitHTML}
            </div>
          </div>
          <div class="upgrade-btn-col">
            <button class="upgrade-buy-btn ${isMax ? 'btn-max' : (canAfford ? 'btn-can-buy' : 'btn-cant-buy')}" ${canAfford ? '' : 'disabled'}>
              ${isMax ? '⭐ MAX' : `💵 ${formattedCost}`}
            </button>
          </div>
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
            this.showNotification(`⭐ ${upg.title} Upgraded to Lv ${upg.currentLevel + 1}! (${upg.levels[upg.currentLevel]} ${upg.unit || ''})`);
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

    // High Score tracking on frame update
    if (this.game) {
      this.updateHighScore(this.game.money);
    }
  }

  // High-Score Leaderboard Management
  updateHighScore(currentMoney) {
    if (currentMoney > this.playerHighScore) {
      this.playerHighScore = currentMoney;
      try {
        localStorage.setItem('ofm_peak_balance', this.playerHighScore.toString());
      } catch (e) {}
      // Sync score to CrazyGames Cloud
      if (typeof sdk !== 'undefined' && sdk.submitLeaderboardScore) {
        sdk.submitLeaderboardScore(this.playerHighScore);
      }
    }

    const currentRank = this.calculatePlayerRank(this.playerHighScore);
    if (currentRank < this.lastAnnouncedRank) {
      const surpassed = this.leaderboardCompetitors.find(c => c.rank === currentRank);
      const passedName = surpassed ? surpassed.name : 'Competitor';
      this.showNotification(`🏆 LEADERBOARD RANK UP! You reached #${currentRank} (passed ${passedName})! 🎉`);
      this.lastAnnouncedRank = currentRank;
      try {
        localStorage.setItem('ofm_last_rank', currentRank.toString());
      } catch (e) {}
      if (this.game && this.game.spawnConfetti && this.game.player) {
        this.game.spawnConfetti(this.game.player.position);
      }
      sounds.playUpgrade();
    }
  }

  calculatePlayerRank(score) {
    let rank = 1;
    for (let c of this.leaderboardCompetitors) {
      if (score < c.score) {
        rank = c.rank + 1;
      }
    }
    return rank;
  }

  getPlayerTier(score) {
    if (score >= 500000) return '👑 Grand Tycoon';
    if (score >= 250000) return '👑 Mega Franchise';
    if (score >= 100000) return '🥇 Super Mart';
    if (score >= 50000) return '🥇 Master Mart';
    if (score >= 25000) return '🥈 Country Mart';
    if (score >= 10000) return '🥈 Local Mart';
    if (score >= 3500) return '🥉 Farm Stand';
    if (score >= 1000) return '🥉 Starter Stall';
    return '🌱 Fresh Start';
  }

  async renderLeaderboard() {
    this.updateHighScore(this.game ? this.game.money : 0);

    // Check CrazyGames user account status
    const cgBannerText = document.getElementById('cg-banner-text');
    const btnCgAuth = document.getElementById('btn-cg-auth');
    if (typeof sdk !== 'undefined' && sdk.getCrazyUser) {
      try {
        const user = await sdk.getCrazyUser();
        if (user && user.username) {
          if (cgBannerText) cgBannerText.textContent = `🎮 Logged in as: ${user.username}`;
          if (btnCgAuth) {
            btnCgAuth.textContent = '✅ Synced';
            btnCgAuth.style.background = '#10b981';
          }
          if (this.playerFarmName === '🧑‍🌾 Green Acres Mart') {
            this.playerFarmName = `🎮 ${user.username}'s Mart`;
          }
        }
      } catch (e) {}
    }

    const rank = this.calculatePlayerRank(this.playerHighScore);
    const tier = this.getPlayerTier(this.playerHighScore);

    const spotlightRank = document.getElementById('spotlight-player-rank');
    const spotlightName = document.getElementById('spotlight-player-name');
    const spotlightTier = document.getElementById('spotlight-player-tier');
    const spotlightScore = document.getElementById('spotlight-player-score');

    if (spotlightRank) spotlightRank.textContent = `#${rank}`;
    if (spotlightName) spotlightName.textContent = this.playerFarmName;
    if (spotlightTier) spotlightTier.textContent = tier;
    if (spotlightScore) {
      spotlightScore.textContent = this.playerHighScore >= 100000 
        ? `$${(this.playerHighScore / 1000).toFixed(1)}K` 
        : `$${this.playerHighScore.toLocaleString()}`;
    }

    const list = document.getElementById('leaderboard-list');
    if (!list) return;
    list.innerHTML = '';

    // Merge live competitors + player
    const playerEntry = {
      rank: rank,
      name: this.playerFarmName,
      score: this.playerHighScore,
      tier: tier,
      isPlayer: true
    };

    const combined = [...this.leaderboardCompetitors, playerEntry].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.isPlayer ? -1 : 1;
    });

    // Re-assign sorted visual ranks
    combined.forEach((entry, idx) => {
      const visualRank = idx + 1;
      const row = document.createElement('div');
      row.className = `leaderboard-row ${entry.isPlayer ? 'player-row' : ''}`;

      let medal = `#${visualRank}`;
      let rankClass = '';
      if (visualRank === 1) { medal = '🥇 #1'; rankClass = 'rank-1'; }
      else if (visualRank === 2) { medal = '🥈 #2'; rankClass = 'rank-2'; }
      else if (visualRank === 3) { medal = '🥉 #3'; rankClass = 'rank-3'; }

      const formattedScore = entry.score >= 100000 
        ? `$${(entry.score / 1000).toFixed(1)}K` 
        : `$${entry.score.toLocaleString()}`;

      row.innerHTML = `
        <div class="lb-rank ${rankClass}">${medal}</div>
        <div class="lb-info">
          <div class="lb-name">${entry.isPlayer ? `⭐️ ${entry.name} (YOU)` : entry.name}</div>
          <div class="lb-tier">${entry.tier}</div>
        </div>
        <div class="lb-score">${formattedScore}</div>
      `;

      list.appendChild(row);
    });
  }
}