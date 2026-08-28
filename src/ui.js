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
    const triggerActivity = () => {
      if (this.game && this.game.recordPlayerActivity) {
        this.game.recordPlayerActivity();
      }
    };

    window.addEventListener('keydown', (e) => {
      triggerActivity();
      this.keys[e.key.toLowerCase()] = true;
      if (e.code) this.keys[e.code.toLowerCase()] = true;
    }, { passive: true });

    window.addEventListener('keyup', (e) => {
      triggerActivity();
      this.keys[e.key.toLowerCase()] = false;
      if (e.code) this.keys[e.code.toLowerCase()] = false;
    }, { passive: true });

    window.addEventListener('mousedown', triggerActivity, { passive: true });
    window.addEventListener('touchstart', triggerActivity, { passive: true });
    window.addEventListener('pointerdown', triggerActivity, { passive: true });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.inputVector = { x: 0, z: 0 };
    });

    const joystickZone = document.getElementById('joystick-zone');
    const joystickKnob = document.getElementById('joystick-knob');
    const maxRadius = 50;

    const handleStart = (clientX, clientY) => {
      triggerActivity();
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
    const btnSettingsAmbience = document.getElementById('btn-settings-ambience');
    const btnSettingsHaptics = document.getElementById('btn-settings-haptics');
    const btnSettingsShake = document.getElementById('btn-settings-shake');
    const sliderBgmVol = document.getElementById('slider-bgm-volume');
    const labelBgmVol = document.getElementById('label-bgm-volume');

    const updateSoundUI = () => {
      const sfxOn = !sounds.muted;
      if (btnSound) btnSound.textContent = sfxOn ? '🔊' : '🔇';
      if (btnSettingsSound) btnSettingsSound.textContent = sfxOn ? 'SFX: ON 🔊' : 'SFX: OFF 🔇';

      const bgmOn = !sounds.bgmMuted;
      if (btnBgm) btnBgm.textContent = bgmOn ? '🎵' : '🔇';
      if (btnSettingsBgm) btnSettingsBgm.textContent = bgmOn ? 'Music: ON 🎵' : 'Music: OFF 🔇';

      const ambOn = !sounds.ambientMuted;
      if (btnSettingsAmbience) btnSettingsAmbience.textContent = ambOn ? 'Ambience: ON 🌾' : 'Ambience: OFF 🔇';

      const hapOn = !!sounds.hapticsEnabled;
      if (btnSettingsHaptics) btnSettingsHaptics.textContent = hapOn ? 'Haptics: ON 📳' : 'Haptics: OFF 🔇';

      const shakeOn = !!sounds.screenShakeEnabled;
      if (btnSettingsShake) btnSettingsShake.textContent = shakeOn ? 'Shake: ON ✨' : 'Shake: OFF 🔇';

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

    if (btnSettingsAmbience) {
      btnSettingsAmbience.addEventListener('click', () => {
        sounds.toggleAmbience();
        updateSoundUI();
      });
    }

    if (btnSettingsHaptics) {
      btnSettingsHaptics.addEventListener('click', () => {
        sounds.setHapticsEnabled(!sounds.hapticsEnabled);
        sounds.triggerHaptic('medium');
        updateSoundUI();
      });
    }

    if (btnSettingsShake) {
      btnSettingsShake.addEventListener('click', () => {
        sounds.setScreenShakeEnabled(!sounds.screenShakeEnabled);
        if (this.game) this.game.triggerScreenShake(0.3, 0.35);
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

    // Photo & Camera Mode Handlers
    const btnPhotoMode = document.getElementById('btn-photo-mode');
    const btnExitPhoto = document.getElementById('btn-exit-photo');
    const btnTakeScreenshot = document.getElementById('btn-take-screenshot');
    const sliderPhotoZoom = document.getElementById('slider-photo-zoom');
    const sliderPhotoAngle = document.getElementById('slider-photo-angle');

    if (btnPhotoMode) {
      btnPhotoMode.addEventListener('click', () => {
        if (this.game) this.game.enterPhotoMode();
      });
    }

    if (btnExitPhoto) {
      btnExitPhoto.addEventListener('click', () => {
        if (this.game) this.game.exitPhotoMode();
      });
    }

    if (btnTakeScreenshot) {
      btnTakeScreenshot.addEventListener('click', () => {
        if (this.game) this.game.takePhotoScreenshot();
      });
    }

    if (sliderPhotoZoom) {
      sliderPhotoZoom.addEventListener('input', (e) => {
        if (this.game) this.game.setPhotoZoom(parseFloat(e.target.value));
      });
    }

    if (sliderPhotoAngle) {
      sliderPhotoAngle.addEventListener('input', (e) => {
        if (this.game) this.game.setPhotoAngle(parseFloat(e.target.value));
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

    // Auto-detect CrazyGames account username on startup
    if (typeof sdk !== 'undefined' && sdk.getCrazyUser) {
      sdk.getCrazyUser().then(user => {
        if (user && user.username) {
          if (!localStorage.getItem('ofm_farm_name') || this.playerFarmName === '🧑‍🌾 Green Acres Mart') {
            this.playerFarmName = `🎮 ${user.username}'s Mart`;
            try { localStorage.setItem('ofm_farm_name', this.playerFarmName); } catch (e) {}
          }
        }
      }).catch(() => {});
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

    // Quests & Goals Modal
    const modalQuests = document.getElementById('modal-quests');
    const btnQuests = document.getElementById('btn-quests');
    const btnCloseQuests = document.getElementById('btn-close-quests');

    if (btnQuests && modalQuests) {
      btnQuests.addEventListener('click', () => {
        this.renderQuestsModal();
        modalQuests.style.display = 'flex';
      });
    }

    if (btnCloseQuests && modalQuests) {
      btnCloseQuests.addEventListener('click', () => {
        modalQuests.style.display = 'none';
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
    this.activeUpgradeTab = 'player';
    const modal = document.getElementById('modal-upgrade');
    const btnUpgrade = document.getElementById('btn-upgrade');
    const btnClose = document.getElementById('btn-close-upgrade');
    const tabButtons = document.querySelectorAll('#upgrade-tabs .tab-btn');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeUpgradeTab = btn.getAttribute('data-tab') || 'player';
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

  generateCharacterPortrait(type) {
    if (!this.portraitCache) this.portraitCache = {};
    if (this.portraitCache[type]) return this.portraitCache[type];

    const svgMap = {
      FARMER: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
        <defs>
          <radialGradient id="bgFarmer" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95"/>
          </radialGradient>
          <linearGradient id="eggYolk" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fde047"/>
            <stop offset="100%" stop-color="#eab308"/>
          </linearGradient>
          <linearGradient id="strawBrim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#d97706"/>
            <stop offset="50%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" rx="20" fill="url(#bgFarmer)"/>
        <path d="M 32 160 Q 32 118 80 118 Q 128 118 128 160 Z" fill="#ffffff" stroke="#111827" stroke-width="2.5"/>
        <path d="M 44 130 Q 56 122 62 136 Q 52 148 40 142 Z" fill="#1e293b"/>
        <path d="M 104 126 Q 118 132 112 148 Q 98 152 100 134 Z" fill="#1e293b"/>
        <path d="M 54 135 L 106 135 L 112 160 L 48 160 Z" fill="#334155" stroke="#111827" stroke-width="2"/>
        <rect x="52" y="132" width="10" height="28" fill="#1e293b"/>
        <rect x="98" y="132" width="10" height="28" fill="#1e293b"/>
        <rect x="70" y="102" width="20" height="18" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <ellipse cx="80" cy="80" rx="34" ry="34" fill="#ffd180" stroke="#111827" stroke-width="2.5"/>
        <circle cx="45" cy="82" r="7" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <circle cx="115" cy="82" r="7" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <ellipse cx="68" cy="78" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="66.5" cy="76" r="1.5" fill="#ffffff"/>
        <ellipse cx="92" cy="78" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="90.5" cy="76" r="1.5" fill="#ffffff"/>
        <ellipse cx="58" cy="88" rx="6" ry="3.5" fill="#f472b6" opacity="0.6"/>
        <ellipse cx="102" cy="88" rx="6" ry="3.5" fill="#f472b6" opacity="0.6"/>
        <path d="M 70 91 Q 80 101 90 91" fill="none" stroke="#b45309" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 47 62 Q 80 50 113 62 Q 106 72 100 66 Q 80 72 60 66 Q 54 72 47 62 Z" fill="#78350f"/>
        <path d="M 44 60 C 44 24, 116 24, 116 60 Z" fill="#ffffff" stroke="#111827" stroke-width="3"/>
        <path d="M 48 58 C 50 30, 80 26, 80 58 Z" fill="#f8fafc" opacity="0.7"/>
        <ellipse cx="80" cy="60" rx="40" ry="8" fill="url(#strawBrim)" stroke="#111827" stroke-width="2.5"/>
        <circle cx="80" cy="42" r="11" fill="url(#eggYolk)" stroke="#111827" stroke-width="2"/>
        <ellipse cx="77" cy="38" rx="3.5" ry="2" fill="#ffffff" opacity="0.8"/>
      </svg>`,

      STOCKER: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
        <defs>
          <radialGradient id="bgTomato" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#ef4444" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95"/>
          </radialGradient>
          <linearGradient id="tomatoRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f87171"/>
            <stop offset="50%" stop-color="#ef4444"/>
            <stop offset="100%" stop-color="#b91c1c"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" rx="20" fill="url(#bgTomato)"/>
        <path d="M 32 160 Q 32 118 80 118 Q 128 118 128 160 Z" fill="#dc2626" stroke="#111827" stroke-width="2.5"/>
        <path d="M 52 134 L 108 134 L 114 160 L 46 160 Z" fill="#2563eb" stroke="#111827" stroke-width="2"/>
        <rect x="52" y="130" width="10" height="30" fill="#1d4ed8"/>
        <rect x="98" y="130" width="10" height="30" fill="#1d4ed8"/>
        <rect x="70" y="102" width="20" height="18" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <ellipse cx="80" cy="80" rx="34" ry="34" fill="#ffd180" stroke="#111827" stroke-width="2.5"/>
        <circle cx="45" cy="82" r="7" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <circle cx="115" cy="82" r="7" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <ellipse cx="68" cy="78" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="66.5" cy="76" r="1.5" fill="#ffffff"/>
        <ellipse cx="92" cy="78" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="90.5" cy="76" r="1.5" fill="#ffffff"/>
        <ellipse cx="58" cy="88" rx="6" ry="3.5" fill="#f87171" opacity="0.6"/>
        <ellipse cx="102" cy="88" rx="6" ry="3.5" fill="#f87171" opacity="0.6"/>
        <path d="M 70 91 Q 80 101 90 91" fill="none" stroke="#b91c1c" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 47 62 Q 80 50 113 62 Q 106 72 100 66 Q 80 72 60 66 Q 54 72 47 62 Z" fill="#451a03"/>
        <ellipse cx="80" cy="48" rx="42" ry="26" fill="url(#tomatoRed)" stroke="#111827" stroke-width="3"/>
        <ellipse cx="64" cy="38" rx="10" ry="4" fill="#ffffff" opacity="0.4" transform="rotate(-15 64 38)"/>
        <polygon points="80,24 86,34 98,30 90,38 96,48 84,42 80,50 76,42 64,48 70,38 62,30 74,34" fill="#22c55e" stroke="#111827" stroke-width="2"/>
        <path d="M 80 28 Q 86 16 94 18" fill="none" stroke="#15803d" stroke-width="4.5" stroke-linecap="round"/>
      </svg>`,

      HARVESTER: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
        <defs>
          <radialGradient id="bgCorn" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95"/>
          </radialGradient>
          <linearGradient id="cornGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="50%" stop-color="#facc15"/>
            <stop offset="100%" stop-color="#ca8a04"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" rx="20" fill="url(#bgCorn)"/>
        <path d="M 32 160 Q 32 118 80 118 Q 128 118 128 160 Z" fill="#eab308" stroke="#111827" stroke-width="2.5"/>
        <path d="M 52 134 L 108 134 L 114 160 L 46 160 Z" fill="#15803d" stroke="#111827" stroke-width="2"/>
        <rect x="52" y="130" width="10" height="30" fill="#166534"/>
        <rect x="98" y="130" width="10" height="30" fill="#166534"/>
        <rect x="70" y="102" width="20" height="18" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <ellipse cx="80" cy="80" rx="34" ry="34" fill="#ffd180" stroke="#111827" stroke-width="2.5"/>
        <circle cx="45" cy="82" r="7" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <circle cx="115" cy="82" r="7" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <ellipse cx="68" cy="78" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="66.5" cy="76" r="1.5" fill="#ffffff"/>
        <ellipse cx="92" cy="78" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="90.5" cy="76" r="1.5" fill="#ffffff"/>
        <ellipse cx="58" cy="88" rx="6" ry="3.5" fill="#f59e0b" opacity="0.6"/>
        <ellipse cx="102" cy="88" rx="6" ry="3.5" fill="#f59e0b" opacity="0.6"/>
        <path d="M 70 91 Q 80 101 90 91" fill="none" stroke="#a16207" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 47 62 Q 80 50 113 62 Q 106 72 100 66 Q 80 72 60 66 Q 54 72 47 62 Z" fill="#1c1917"/>
        <path d="M 48 58 C 48 24, 112 24, 112 58 Z" fill="url(#cornGold)" stroke="#111827" stroke-width="3"/>
        <circle cx="68" cy="40" r="3.5" fill="#eab308" stroke="#ca8a04" stroke-width="1"/>
        <circle cx="80" cy="38" r="3.5" fill="#eab308" stroke="#ca8a04" stroke-width="1"/>
        <circle cx="92" cy="40" r="3.5" fill="#eab308" stroke="#ca8a04" stroke-width="1"/>
        <circle cx="62" cy="49" r="3.5" fill="#eab308" stroke="#ca8a04" stroke-width="1"/>
        <circle cx="74" cy="47" r="3.5" fill="#eab308" stroke="#ca8a04" stroke-width="1"/>
        <circle cx="86" cy="47" r="3.5" fill="#eab308" stroke="#ca8a04" stroke-width="1"/>
        <circle cx="98" cy="49" r="3.5" fill="#eab308" stroke="#ca8a04" stroke-width="1"/>
        <path d="M 42 62 C 34 40, 52 28, 56 46 Z" fill="#22c55e" stroke="#111827" stroke-width="2"/>
        <path d="M 118 62 C 126 40, 108 28, 104 46 Z" fill="#22c55e" stroke="#111827" stroke-width="2"/>
        <ellipse cx="80" cy="60" rx="38" ry="6" fill="#16a34a" stroke="#111827" stroke-width="2"/>
      </svg>`,

      BAKER: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
        <defs>
          <radialGradient id="bgBread" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#d97706" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95"/>
          </radialGradient>
          <linearGradient id="breadCrust" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f59e0b"/>
            <stop offset="50%" stop-color="#d97706"/>
            <stop offset="100%" stop-color="#92400e"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" rx="20" fill="url(#bgBread)"/>
        <path d="M 32 160 Q 32 118 80 118 Q 128 118 128 160 Z" fill="#fef3c7" stroke="#111827" stroke-width="2.5"/>
        <path d="M 52 134 L 108 134 L 114 160 L 46 160 Z" fill="#8d6e63" stroke="#111827" stroke-width="2"/>
        <rect x="52" y="130" width="10" height="30" fill="#5d4037"/>
        <rect x="98" y="130" width="10" height="30" fill="#5d4037"/>
        <rect x="70" y="102" width="20" height="18" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <ellipse cx="80" cy="80" rx="34" ry="34" fill="#ffd180" stroke="#111827" stroke-width="2.5"/>
        <circle cx="45" cy="82" r="7" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <circle cx="115" cy="82" r="7" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <ellipse cx="68" cy="78" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="66.5" cy="76" r="1.5" fill="#ffffff"/>
        <ellipse cx="92" cy="78" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="90.5" cy="76" r="1.5" fill="#ffffff"/>
        <ellipse cx="58" cy="88" rx="6" ry="3.5" fill="#f472b6" opacity="0.6"/>
        <ellipse cx="102" cy="88" rx="6" ry="3.5" fill="#f472b6" opacity="0.6"/>
        <path d="M 70 91 Q 80 101 90 91" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 47 62 Q 80 50 113 62 Q 106 72 100 66 Q 80 72 60 66 Q 54 72 47 62 Z" fill="#5d4037"/>
        <ellipse cx="80" cy="46" rx="44" ry="24" fill="url(#breadCrust)" stroke="#111827" stroke-width="3"/>
        <path d="M 60 42 Q 65 48 68 44" fill="none" stroke="#fef08a" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M 77 40 Q 80 46 83 40" fill="none" stroke="#fef08a" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M 92 44 Q 95 48 100 42" fill="none" stroke="#fef08a" stroke-width="3.5" stroke-linecap="round"/>
        <ellipse cx="80" cy="58" rx="39" ry="7" fill="#6d4c41" stroke="#111827" stroke-width="2"/>
      </svg>`,

      CHEF: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
        <defs>
          <radialGradient id="bgChef" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#ef4444" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95"/>
          </radialGradient>
          <linearGradient id="toqueShade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#e2e8f0"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" rx="20" fill="url(#bgChef)"/>
        <path d="M 32 160 Q 32 118 80 118 Q 128 118 128 160 Z" fill="#ffffff" stroke="#111827" stroke-width="2.5"/>
        <path d="M 54 135 L 106 135 L 112 160 L 48 160 Z" fill="#0288d1" stroke="#111827" stroke-width="2"/>
        <path d="M 66 112 Q 80 126 94 112 Q 80 106 66 112 Z" fill="#dc2626" stroke="#111827" stroke-width="2"/>
        <circle cx="80" cy="116" r="4.5" fill="#b91c1c"/>
        <rect x="70" y="100" width="20" height="15" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <ellipse cx="80" cy="78" rx="34" ry="34" fill="#ffd180" stroke="#111827" stroke-width="2.5"/>
        <circle cx="45" cy="80" r="7" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <circle cx="115" cy="80" r="7" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <ellipse cx="68" cy="75" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="66.5" cy="73" r="1.5" fill="#ffffff"/>
        <ellipse cx="92" cy="75" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="90.5" cy="73" r="1.5" fill="#ffffff"/>
        <ellipse cx="58" cy="84" rx="6" ry="3.5" fill="#f472b6" opacity="0.6"/>
        <ellipse cx="102" cy="84" rx="6" ry="3.5" fill="#f472b6" opacity="0.6"/>
        <path d="M 64 88 Q 72 84 80 88 Q 88 84 96 88 Q 92 94 80 90 Q 68 94 64 88 Z" fill="#3e2723" stroke="#111827" stroke-width="1.5"/>
        <path d="M 64 88 Q 58 84 62 80" fill="none" stroke="#3e2723" stroke-width="2" stroke-linecap="round"/>
        <path d="M 96 88 Q 102 84 98 80" fill="none" stroke="#3e2723" stroke-width="2" stroke-linecap="round"/>
        <path d="M 47 58 Q 80 48 113 58" fill="none" stroke="#3e2723" stroke-width="4"/>
        <path d="M 50 56 L 52 30 Q 52 14 80 14 Q 108 14 108 30 L 110 56 Z" fill="url(#toqueShade)" stroke="#111827" stroke-width="3"/>
        <line x1="64" y1="20" x2="64" y2="54" stroke="#cbd5e1" stroke-width="2"/>
        <line x1="80" y1="16" x2="80" y2="54" stroke="#cbd5e1" stroke-width="2"/>
        <line x1="96" y1="20" x2="96" y2="54" stroke="#cbd5e1" stroke-width="2"/>
        <ellipse cx="80" cy="56" rx="34" ry="6" fill="#f1f5f9" stroke="#111827" stroke-width="2"/>
      </svg>`,

      CASHIER: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
        <defs>
          <radialGradient id="bgCashier" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#a855f7" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95"/>
          </radialGradient>
        </defs>
        <rect width="160" height="160" rx="20" fill="url(#bgCashier)"/>
        <path d="M 32 160 Q 32 118 80 118 Q 128 118 128 160 Z" fill="#8e24aa" stroke="#111827" stroke-width="2.5"/>
        <path d="M 54 135 L 106 135 L 112 160 L 48 160 Z" fill="#ab47bc" stroke="#111827" stroke-width="2"/>
        <rect x="94" y="136" width="16" height="8" rx="2" fill="#facc15" stroke="#ca8a04" stroke-width="1"/>
        <rect x="70" y="102" width="20" height="18" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <ellipse cx="80" cy="80" rx="34" ry="34" fill="#ffd180" stroke="#111827" stroke-width="2.5"/>
        <circle cx="45" cy="82" r="7" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <circle cx="115" cy="82" r="7" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <ellipse cx="68" cy="78" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="66.5" cy="76" r="1.5" fill="#ffffff"/>
        <ellipse cx="92" cy="78" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="90.5" cy="76" r="1.5" fill="#ffffff"/>
        <ellipse cx="58" cy="88" rx="6" ry="3.5" fill="#f472b6" opacity="0.6"/>
        <ellipse cx="102" cy="88" rx="6" ry="3.5" fill="#f472b6" opacity="0.6"/>
        <path d="M 70 91 Q 80 101 90 91" fill="none" stroke="#ad1457" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 47 62 Q 80 50 113 62 Q 106 72 100 66 Q 80 72 60 66 Q 54 72 47 62 Z" fill="#4e342e"/>
        <path d="M 46 56 Q 80 44 114 56 L 118 64 Q 80 54 42 64 Z" fill="#6a1b9a" stroke="#111827" stroke-width="2.5"/>
        <ellipse cx="80" cy="58" rx="38" ry="6" fill="#4a148c"/>
      </svg>`,

      PLAYER: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
        <defs>
          <radialGradient id="bgPlayer" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95"/>
          </radialGradient>
          <linearGradient id="strawGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fde047"/>
            <stop offset="50%" stop-color="#facc15"/>
            <stop offset="100%" stop-color="#d97706"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" rx="20" fill="url(#bgPlayer)"/>
        <path d="M 32 160 Q 32 118 80 118 Q 128 118 128 160 Z" fill="#e53935" stroke="#111827" stroke-width="2.5"/>
        <path d="M 52 134 L 108 134 L 114 160 L 46 160 Z" fill="#1e88e5" stroke="#111827" stroke-width="2"/>
        <rect x="52" y="130" width="10" height="30" fill="#1565c0"/>
        <rect x="98" y="130" width="10" height="30" fill="#1565c0"/>
        <rect x="70" y="102" width="20" height="18" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <ellipse cx="80" cy="80" rx="34" ry="34" fill="#ffd180" stroke="#111827" stroke-width="2.5"/>
        <circle cx="45" cy="82" r="7" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <circle cx="115" cy="82" r="7" fill="#ffd180" stroke="#111827" stroke-width="2"/>
        <ellipse cx="68" cy="78" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="66.5" cy="76" r="1.5" fill="#ffffff"/>
        <ellipse cx="92" cy="78" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="90.5" cy="76" r="1.5" fill="#ffffff"/>
        <ellipse cx="58" cy="88" rx="6" ry="3.5" fill="#f472b6" opacity="0.6"/>
        <ellipse cx="102" cy="88" rx="6" ry="3.5" fill="#f472b6" opacity="0.6"/>
        <path d="M 70 91 Q 80 101 90 91" fill="none" stroke="#b71c1c" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 47 62 Q 80 50 113 62 Q 106 72 100 66 Q 80 72 60 66 Q 54 72 47 62 Z" fill="#451a03"/>
        <ellipse cx="80" cy="54" rx="46" ry="12" fill="url(#strawGrad)" stroke="#111827" stroke-width="2.5"/>
        <path d="M 54 54 C 54 28, 106 28, 106 54 Z" fill="url(#strawGrad)" stroke="#111827" stroke-width="3"/>
        <ellipse cx="80" cy="53" rx="27" ry="5.5" fill="#b71c1c"/>
        <path d="M 72 38 L 75 44 L 80 34 L 85 44 L 88 38 L 88 46 L 72 46 Z" fill="#facc15" stroke="#854d0e" stroke-width="1"/>
      </svg>`
    };

    const rawSvg = svgMap[type];
    if (rawSvg) {
      const cleanSvg = rawSvg.replace(/\s+/g, ' ').trim();
      const dataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(cleanSvg);
      this.portraitCache[type] = dataUrl;
      return dataUrl;
    }
    return null;
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

    const currentTab = this.activeUpgradeTab || 'player';

    // Helper: Execute and refresh upgrade purchase
    const buyUpgrade = (upg) => {
      if (upg.currentLevel >= upg.costs.length) return;
      const cost = upg.costs[upg.currentLevel];
      if (this.game.money < cost) return;

      this.game.money -= cost;
      upg.currentLevel++;
      if (typeof sounds !== 'undefined') sounds.playUpgrade();

      if (typeof questManager !== 'undefined' && (upg.group === 'worker_player' || upg.id.includes('staff'))) {
        questManager.recordEvent('staffUpgraded', 1);
      }

      this.game.refreshAllUpgrades();
      this.renderUpgradeModal();
      this.showNotification(`⭐ ${upg.title} Upgraded to Lv ${upg.currentLevel + 1}! (${upg.levels[upg.currentLevel]} ${upg.unit || ''})`);
    };

    // Helper: Render Standard Upgrade Card
    const createUpgradeCard = (upg) => {
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
        buyBtn.addEventListener('click', () => buyUpgrade(upg));
      }
      return itemDiv;
    };

    // ==========================================
    // TAB 1: 🧑‍🌾 MAIN PLAYER (FARM MART OWNER)
    // ==========================================
    if (currentTab === 'player') {
      const speedUpg = CONFIG.UPGRADES.speed;
      const capUpg = CONFIG.UPGRADES.capacity;
      const curSpeed = speedUpg.levels[speedUpg.currentLevel];
      const curCap = capUpg.levels[capUpg.currentLevel];
      const playerPortraitUrl = this.generateCharacterPortrait('PLAYER');

      // Hero Character Portrait Card
      const heroCard = document.createElement('div');
      heroCard.className = 'player-hero-card';
      heroCard.innerHTML = `
        <div class="player-hero-portrait-wrap">
          <div class="player-avatar-ring">
            ${playerPortraitUrl 
              ? `<img class="player-avatar-img" src="${playerPortraitUrl}" alt="Farm Mart Owner">` 
              : `<span class="player-avatar-emoji">🧑‍🌾</span>`
            }
            <span class="player-avatar-badge">👑</span>
          </div>
        </div>
        <div class="player-hero-identity">
          <div class="player-hero-tag">🌟 TYCOON LEADER</div>
          <h3 class="player-hero-name">FARM MART OWNER</h3>
          <span class="player-hero-role">Store Founder & General Manager</span>
        </div>
        <div class="player-stats-grid">
          <div class="player-stat-box">
            <span class="player-stat-icon">⚡</span>
            <div class="player-stat-info">
              <span class="player-stat-label">Movement Speed</span>
              <span class="player-stat-val">${curSpeed} m/s</span>
            </div>
            <span class="player-stat-level">Lv ${speedUpg.currentLevel + 1}/${speedUpg.levels.length}</span>
          </div>
          <div class="player-stat-box">
            <span class="player-stat-icon">🎒</span>
            <div class="player-stat-info">
              <span class="player-stat-label">Carry Capacity</span>
              <span class="player-stat-val">${curCap} Items</span>
            </div>
            <span class="player-stat-level">Lv ${capUpg.currentLevel + 1}/${capUpg.levels.length}</span>
          </div>
        </div>
      `;
      list.appendChild(heroCard);

      // Section Header: Player Upgrades
      const sectionHeader = document.createElement('div');
      sectionHeader.className = 'upgrade-group-header';
      sectionHeader.textContent = '⚡ Owner Skills & Mobility Upgrades';
      list.appendChild(sectionHeader);

      // Only Player Upgrades!
      list.appendChild(createUpgradeCard(capUpg));
      list.appendChild(createUpgradeCard(speedUpg));
      return;
    }

    // ==========================================
    // TAB 2: 👥 WORKERS (YOUR SPECIALIZED TEAM)
    // ==========================================
    if (currentTab === 'workers') {
      const staffUpg = CONFIG.UPGRADES.staff;
      const staffSpeedMult = staffUpg.levels[staffUpg.currentLevel];
      const staffCapVal = staffUpg.capacityLevels ? staffUpg.capacityLevels[staffUpg.currentLevel] : (3 + staffUpg.currentLevel * 2);

      // Team Header
      const teamHeader = document.createElement('div');
      teamHeader.className = 'upgrade-group-header';
      teamHeader.textContent = '👥 Team Capabilities & Collective Training';
      list.appendChild(teamHeader);

      // Collective Staff Upgrade Card
      list.appendChild(createUpgradeCard(staffUpg));

      // Worker Roster Section
      const rosterHeader = document.createElement('div');
      rosterHeader.className = 'upgrade-group-header';
      rosterHeader.textContent = '📋 Specialized Workforce Roster';
      list.appendChild(rosterHeader);

      const workersRoster = [
        {
          id: 'helper_farmer',
          type: 'FARMER',
          name: 'Barnaby',
          title: 'Livestock & Grain Farm Hand',
          specialty: 'Cow & Egg Specialist',
          specialtyIcon: '🥚',
          hatTheme: 'Egg Shell Hat & Cowhide Clothes',
          badgeColor: '#0288d1',
          tasks: [
            'Harvests Golden Wheat from agricultural fields',
            'Transports feed to replenish Chicken Coop',
            'Collects fresh eggs & feeds Dairy Cows',
            'Milks cows & restocks Whole Milk refrigerator shelf'
          ]
        },
        {
          id: 'helper_stocker',
          type: 'STOCKER',
          name: 'Toby',
          title: 'Tomato Specialist & Canning Stocker',
          specialty: 'Tomato & Canning Specialist',
          specialtyIcon: '🍅',
          hatTheme: 'Tomato Cap with Green Leaf & Stem',
          badgeColor: '#e53935',
          tasks: [
            'Harvests ripe Organic Tomatoes from troughs',
            'Restocks fresh tomatoes directly onto Tomato Stand',
            'Supplies tomato ingredients into Sauce Press hopper',
            'Collects Canned Sauce/Jam and stacks onto shelves'
          ]
        },
        {
          id: 'helper_harvester',
          type: 'HARVESTER',
          name: 'Cooper',
          title: 'Agricultural Field Harvester',
          specialty: 'Sweetcorn & Grain Specialist',
          specialtyIcon: '🌽',
          hatTheme: 'Sweetcorn Husk Cap & Golden Crown',
          badgeColor: '#f57f17',
          tasks: [
            'Harvests Golden Sweetcorn & Wheat from outer fields',
            'Transports and restocks Sweetcorn onto market stands',
            'Restocks Golden Grain stands with freshly harvested wheat',
            'Maintains non-stop field harvesting efficiency'
          ]
        },
        {
          id: 'helper_baker',
          type: 'BAKER',
          name: 'Pierre',
          title: 'Artisan Bread Baker',
          specialty: 'Artisan Bakery Specialist',
          specialtyIcon: '🍞',
          hatTheme: 'Golden Brioche Loaf Baker Beret',
          badgeColor: '#8d6e63',
          tasks: [
            'Collects 12 Eggs & 12 Wheat batches from farm storage',
            'Loads bakery oven hopper with baking ingredients',
            'Bakes 12 golden Artisan Bread loaves per batch',
            'Stacks 12 fresh bread loaves onto Warm Bakery Showcase'
          ]
        },
        {
          id: 'helper_chef',
          type: 'CHEF',
          name: 'Chef Jean',
          title: 'Master Patissier',
          specialty: 'Royal Pastry & Cake Specialist',
          specialtyIcon: '🎂',
          hatTheme: 'Iconic Tall Pleated Toque & French Ascot',
          badgeColor: '#c62828',
          tasks: [
            'Gathers Milk, Eggs, and Bread from market shelves',
            'Supplies Pastry Cake Mixer machine in 6-item batches',
            'Crafts gourmet Royal Strawberry Cakes',
            'Restocks Royal Cakes onto Royal Pedestal Stand'
          ]
        },
        {
          id: 'helper_cashier',
          type: 'CASHIER',
          name: 'Penny & Sam',
          title: 'Express Checkout Cashiers',
          specialty: 'Front Desk & Checkout Specialist',
          specialtyIcon: '💵',
          hatTheme: 'Store Uniform & Cashier Sun Visor',
          badgeColor: '#8e24aa',
          tasks: [
            'Operates checkout counters with zero customer wait time',
            'Automatically scans customer shopping baskets',
            'Bags customer groceries and vaults revenue securely'
          ]
        }
      ];

      workersRoster.forEach(w => {
        const isHired = (CONFIG.UNLOCKS[w.id] && CONFIG.UNLOCKS[w.id].unlocked);
        const portraitUrl = this.generateCharacterPortrait(w.type);
        const card = document.createElement('div');
        card.className = `worker-roster-card ${isHired ? 'worker-hired' : 'worker-locked'}`;
        card.innerHTML = `
          <div class="worker-card-header">
            <div class="worker-portrait-frame ${isHired ? 'portrait-hired' : 'portrait-locked'}" style="border-color: ${w.badgeColor};">
              ${portraitUrl 
                ? `<img class="worker-portrait-img" src="${portraitUrl}" alt="${w.name}">` 
                : `<span class="worker-avatar-fallback">${w.specialtyIcon}</span>`
              }
              ${!isHired ? `<span class="worker-portrait-lock">🔒</span>` : ''}
            </div>
            <div class="worker-header-info">
              <div class="worker-name-row">
                <span class="worker-name">${w.name}</span>
                <span class="worker-status-badge ${isHired ? 'status-hired' : 'status-locked'}">
                  ${isHired ? '🟢 HIRED & ACTIVE' : '🔒 LOCKED'}
                </span>
              </div>
              <span class="worker-title">${w.title}</span>
              <span class="worker-specialty-badge">
                <span class="specialty-indicator-icon">${w.specialtyIcon}</span>
                <span class="specialty-text">${w.specialty}</span>
              </span>
            </div>
          </div>

          <div class="worker-outfit-pill">
            <span class="outfit-icon">👒</span>
            <span class="outfit-text"><strong>Outfit:</strong> ${w.hatTheme}</span>
          </div>

          <div class="worker-tasks-section">
            <span class="worker-section-title">⚡ Assigned AI Responsibilities:</span>
            <ul class="worker-tasks-list">
              ${w.tasks.map(t => `<li>${t}</li>`).join('')}
            </ul>
          </div>

          <div class="worker-stats-footer">
            <div class="worker-stat-pill">
              <span>⚡ Speed:</span> <strong>${staffSpeedMult}x</strong>
            </div>
            <div class="worker-stat-pill">
              <span>🎒 Capacity:</span> <strong>${staffCapVal} Items</strong>
            </div>
          </div>
        `;
        list.appendChild(card);
      });
      return;
    }

    // ==========================================
    // TAB 3: 🌾 FARM & GEAR (PRODUCTION & MACHINERY)
    // ==========================================
    if (currentTab === 'production') {
      const prodUpgs = Object.values(CONFIG.UPGRADES).filter(u => u.group === 'production' || u.group === 'machinery');
      
      const prodHeader = document.createElement('div');
      prodHeader.className = 'upgrade-group-header';
      prodHeader.textContent = '🌾 Farm Fertility, Livestock & Machinery';
      list.appendChild(prodHeader);

      prodUpgs.forEach(upg => list.appendChild(createUpgradeCard(upg)));
      return;
    }

    // ==========================================
    // TAB 4: ✨ VALUE (PRODUCT QUALITY RECIPES)
    // ==========================================
    if (currentTab === 'quality') {
      const qualityUpgs = Object.values(CONFIG.UPGRADES).filter(u => u.group === 'quality');
      
      const qualHeader = document.createElement('div');
      qualHeader.className = 'upgrade-group-header';
      qualHeader.textContent = '✨ Gourmet Product Quality & Higher Sell Prices';
      list.appendChild(qualHeader);

      qualityUpgs.forEach(upg => list.appendChild(createUpgradeCard(upg)));
      return;
    }

    // ==========================================
    // TAB 5: 🌺 DECOR (STORE DECORATIONS)
    // ==========================================
    if (currentTab === 'decor') {
      const header = document.createElement('div');
      header.className = 'upgrade-group-header';
      header.textContent = '🌺 Store Decorations & Personalization';
      list.appendChild(header);

      const decors = Object.values(CONFIG.DECORATIONS || {});
      decors.forEach(d => {
        const isUnlocked = this.game ? this.game.isDecorationUnlocked(d.id) : false;
        const isActive = this.game ? this.game.isDecorationActive(d.id) : false;
        const canAfford = !isUnlocked && this.game && this.game.money >= d.cost;

        const itemDiv = document.createElement('div');
        itemDiv.className = `upgrade-item ${isUnlocked ? 'maxed-card' : (canAfford ? 'affordable-card' : '')}`;
        itemDiv.innerHTML = `
          <div class="upgrade-icon-box">
            <span class="upgrade-emoji">${d.icon}</span>
          </div>
          <div class="upgrade-info-col">
            <div class="upgrade-title-row">
              <span class="upgrade-title-text">${d.name}</span>
              <span class="upgrade-level-pill ${isUnlocked ? (isActive ? 'max-pill' : '') : ''}">${isUnlocked ? (isActive ? 'ACTIVE ✨' : 'HIDDEN 👁️') : 'LOCKED 🔒'}</span>
            </div>
            <div class="upgrade-benefit-row">
              <span class="benefit-unit">${d.desc}</span>
            </div>
          </div>
          <div class="upgrade-btn-col">
            <button class="upgrade-buy-btn ${isUnlocked ? (isActive ? 'btn-can-buy' : 'btn-cant-buy') : (canAfford ? 'btn-can-buy' : 'btn-cant-buy')}" ${!isUnlocked && !canAfford ? 'disabled' : ''}>
              ${isUnlocked ? (isActive ? 'Active 👁️' : 'Show ➕') : `💵 $${d.cost.toLocaleString()}`}
            </button>
          </div>
        `;

        const actionBtn = itemDiv.querySelector('.upgrade-buy-btn');
        if (actionBtn) {
          actionBtn.addEventListener('click', () => {
            if (isUnlocked) {
              if (this.game) this.game.toggleDecoration(d.id);
              this.renderUpgradeModal();
            } else if (canAfford) {
              if (this.game) this.game.purchaseDecoration(d.id);
              this.renderUpgradeModal();
            }
          });
        }

        list.appendChild(itemDiv);
      });
      return;
    }
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

    // Refresh Quest notification badge
    this.refreshQuestBadge();
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

    // Render Milestone Wardrobe Cosmetics
    const cosmeticsGrid = document.getElementById('cosmetics-grid');
    if (cosmeticsGrid) {
      cosmeticsGrid.innerHTML = '';
      const currentEquipped = (this.game && this.game.player) 
        ? (this.game.player.currentHat || 'STRAW_HAT')
        : (localStorage.getItem('ofm_equipped_hat') || 'STRAW_HAT');

      const cosmeticList = [
        { id: 'STRAW_HAT', name: 'Straw Hat', icon: '👒', reqScore: 0, reqDesc: 'Default' },
        { id: 'CHEF_TOQUE', name: "Chef's Toque", icon: '👨‍🍳', reqScore: 50000, reqDesc: '$50K Peak' },
        { id: 'GOLDEN_CROWN', name: 'Royal Crown', icon: '👑', reqScore: 500000, reqDesc: '$500K Peak' }
      ];

      cosmeticList.forEach(c => {
        const isUnlocked = this.playerHighScore >= c.reqScore;
        const isEquipped = currentEquipped === c.id;

        const card = document.createElement('div');
        card.className = `cosmetic-card ${isEquipped ? 'equipped' : (isUnlocked ? 'unlocked' : 'locked')}`;

        let statusText = '🔒 Locked';
        if (isEquipped) statusText = 'Equipped ✨';
        else if (isUnlocked) statusText = 'Equip 👆';
        else statusText = c.reqDesc;

        card.innerHTML = `
          <div class="cosmetic-icon">${c.icon}</div>
          <div class="cosmetic-name">${c.name}</div>
          <div class="cosmetic-status">${statusText}</div>
        `;

        card.addEventListener('click', () => {
          if (isUnlocked) {
            if (this.game && this.game.player) {
              this.game.player.setCosmeticHat(c.id);
            }
            try { localStorage.setItem('ofm_equipped_hat', c.id); } catch (e) {}
            sounds.playUpgrade();
            this.showNotification(`✨ Equipped ${c.name}!`);
            this.renderLeaderboard();
          } else {
            this.showNotification(`🔒 Reach ${c.reqDesc} on Leaderboard to unlock ${c.name}!`);
          }
        });

        cosmeticsGrid.appendChild(card);
      });
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

  // Quests & Achievements Modal
  renderQuestsModal() {
    const list = document.getElementById('quests-list');
    if (!list || typeof questManager === 'undefined') return;

    list.innerHTML = '';
    questManager.quests.forEach(q => {
      const cur = Math.min(q.target, questManager.stats[q.statKey] || 0);
      const percent = Math.min(100, Math.round((cur / q.target) * 100));
      const isClaimed = questManager.isClaimed(q.id);
      const isClaimable = questManager.isClaimable(q.id);

      const card = document.createElement('div');
      card.className = `quest-card ${isClaimable ? 'quest-claimable' : (isClaimed ? 'quest-claimed' : '')}`;

      card.innerHTML = `
        <div class="quest-icon-box">
          <span>${q.icon}</span>
        </div>
        <div class="quest-info-col">
          <div class="quest-title-row">
            <span class="quest-title">${q.title}</span>
            <span class="quest-reward-pill">💵 +$${q.reward.toLocaleString()}</span>
          </div>
          <div class="quest-desc">${q.desc}</div>
          <div class="quest-progress-track">
            <div class="quest-progress-fill" style="width: ${percent}%;"></div>
            <span class="quest-progress-text">${cur.toLocaleString()} / ${q.target.toLocaleString()} (${percent}%)</span>
          </div>
        </div>
        <div class="quest-action-col">
          <button class="quest-claim-btn ${isClaimable ? 'btn-claim-active' : (isClaimed ? 'btn-claimed' : 'btn-in-progress')}" ${isClaimable ? '' : 'disabled'}>
            ${isClaimed ? 'Claimed ✅' : (isClaimable ? 'CLAIM 💵' : 'In Progress')}
          </button>
        </div>
      `;

      const claimBtn = card.querySelector('.quest-claim-btn');
      if (claimBtn && isClaimable) {
        claimBtn.addEventListener('click', () => {
          questManager.claimReward(q.id, this.game);
          this.renderQuestsModal();
          this.refreshQuestBadge();
        });
      }

      list.appendChild(card);
    });
  }

  refreshQuestBadge() {
    const dot = document.getElementById('quest-notification-dot');
    if (!dot || typeof questManager === 'undefined') return;

    const hasUnclaimed = questManager.hasUnclaimedRewards();
    dot.style.display = hasUnclaimed ? 'block' : 'none';
  }
}