// CrazyGames SDK v3 Integration & Save State Manager
class CrazySDKWrapper {
  constructor() {
    this.isInitialized = false;
    this.hasCrazySDK = typeof window !== 'undefined' && typeof window.CrazyGames !== 'undefined';
    this.boostActive = false;
    this.boostMultiplier = 1;
    this.boostTimer = 0;
    
    this.init();
  }

  async init() {
    try {
      if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK) {
        await window.CrazyGames.SDK.init();
        this.isInitialized = true;
        console.log('[CrazyGames SDK] Initialized successfully');
      } else {
        console.log('[CrazyGames SDK] Running in local/test mode');
      }
    } catch (err) {
      console.warn('[CrazyGames SDK] Fallback mode active:', err);
    }
  }

  gameplayStart() {
    if (this.isInitialized && window.CrazyGames.SDK.game) {
      try {
        window.CrazyGames.SDK.game.gameplayStart();
      } catch (e) {}
    }
  }

  gameplayStop() {
    if (this.isInitialized && window.CrazyGames.SDK.game) {
      try {
        window.CrazyGames.SDK.game.gameplayStop();
      } catch (e) {}
    }
  }

  // Rewarded Video Ad: 2x Revenue, Instant Restock, etc.
  async showRewardedAd(rewardType, onRewarded, onError) {
    this.gameplayStop();

    if (this.isInitialized && window.CrazyGames.SDK.ad) {
      const callbacks = {
        adFinished: () => {
          this.gameplayStart();
          if (onRewarded) onRewarded();
        },
        adError: (error) => {
          this.gameplayStart();
          console.warn('[CrazyGames SDK] Ad error:', error);
          if (onError) onError(error);
        },
        adStarted: () => {
          console.log('[CrazyGames SDK] Rewarded ad started');
        }
      };

      try {
        await window.CrazyGames.SDK.ad.requestAd('rewarded', callbacks);
      } catch (e) {
        this.gameplayStart();
        // Fallback for test environments
        if (onRewarded) onRewarded();
      }
    } else {
      // Local dev simulated ad with 0.8s timeout
      console.log('[Simulation] Rewarded ad watched for:', rewardType);
      setTimeout(() => {
        this.gameplayStart();
        if (onRewarded) onRewarded();
      }, 600);
    }
  }

  // Midgame Interstitial Ad (e.g. major milestone unlocks)
  async showMidgameAd() {
    this.gameplayStop();

    if (this.isInitialized && window.CrazyGames.SDK.ad) {
      const callbacks = {
        adFinished: () => { this.gameplayStart(); },
        adError: () => { this.gameplayStart(); }
      };

      try {
        await window.CrazyGames.SDK.ad.requestAd('midgame', callbacks);
      } catch (e) {
        this.gameplayStart();
      }
    } else {
      this.gameplayStart();
    }
  }

  // Activate VIP Frenzy Boost for duration (in seconds)
  activateVipFrenzy(durationSec = 180) {
    this.boostActive = true;
    this.boostMultiplier = 2;
    this.boostTimer = durationSec;

    const boostBadge = document.getElementById('boost-indicator');
    if (boostBadge) boostBadge.style.display = 'flex';
  }

  activate2xBoost(durationSec = 180) {
    this.activateVipFrenzy(durationSec);
  }

  activateBoost(durationSec = 180) {
    this.activateVipFrenzy(durationSec);
  }

  update(dt) {
    if (this.boostActive) {
      this.boostTimer -= dt;
      const boostTimerEl = document.getElementById('boost-timer');
      if (boostTimerEl) {
        const mins = Math.floor(Math.max(0, this.boostTimer) / 60);
        const secs = Math.floor(Math.max(0, this.boostTimer) % 60);
        boostTimerEl.textContent = `👑 VIP FRENZY (${mins}:${secs < 10 ? '0' : ''}${secs})`;
      }

      if (this.boostTimer <= 0) {
        this.boostActive = false;
        this.boostMultiplier = 1;
        const boostBadge = document.getElementById('boost-indicator');
        if (boostBadge) boostBadge.style.display = 'none';
      }
    }
  }

  // Save / Load system
  saveGameState(state) {
    try {
      localStorage.setItem('organic_farm_mart_save', JSON.stringify(state));
    } catch (e) {}
  }

  loadGameState() {
    try {
      const data = localStorage.getItem('organic_farm_mart_save');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  clearGameState() {
    try {
      localStorage.removeItem('organic_farm_mart_save');
    } catch (e) {}
  }
}

const sdk = new CrazySDKWrapper();