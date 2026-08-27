// ============================================================================
// Quests & Lifetime Achievements Manager
// ============================================================================

class QuestManager {
  constructor() {
    this.stats = {
      cropsHarvested: 0,
      breadBaked: 0,
      cakesBaked: 0,
      customersServed: 0,
      staffUpgraded: 0
    };
    this.claimedQuests = {};

    this.load();

    this.quests = [
      {
        id: 'harvest_1',
        title: '🌱 Sprout Collector',
        desc: 'Harvest 30 crops from farm patches',
        statKey: 'cropsHarvested',
        target: 30,
        reward: 200,
        icon: '🌾'
      },
      {
        id: 'harvest_2',
        title: '🌾 Master Harvester',
        desc: 'Harvest 150 crops from farm patches',
        statKey: 'cropsHarvested',
        target: 150,
        reward: 800,
        icon: '🌽'
      },
      {
        id: 'harvest_3',
        title: '🚜 Agricultural Legend',
        desc: 'Harvest 500 crops from farm patches',
        statKey: 'cropsHarvested',
        target: 500,
        reward: 3500,
        icon: '🍅'
      },
      {
        id: 'bread_1',
        title: '🥖 Warm Oven Starter',
        desc: 'Bake 15 loaves of Artisan Bread',
        statKey: 'breadBaked',
        target: 15,
        reward: 350,
        icon: '🥖'
      },
      {
        id: 'bread_2',
        title: '🥐 Master Boulanger',
        desc: 'Bake 60 loaves of Artisan Bread',
        statKey: 'breadBaked',
        target: 60,
        reward: 1500,
        icon: '🥖'
      },
      {
        id: 'cake_1',
        title: '🎂 Sweet Indulgence',
        desc: 'Bake 5 Royal Pastry Cakes',
        statKey: 'cakesBaked',
        target: 5,
        reward: 500,
        icon: '🎂'
      },
      {
        id: 'cake_2',
        title: '👑 Grand Pâtissier',
        desc: 'Bake 25 Royal Pastry Cakes',
        statKey: 'cakesBaked',
        target: 25,
        reward: 3000,
        icon: '🎂'
      },
      {
        id: 'customers_1',
        title: '🛒 Neighborhood Favorite',
        desc: 'Serve 25 store customers at checkout',
        statKey: 'customersServed',
        target: 25,
        reward: 300,
        icon: '🛍️'
      },
      {
        id: 'customers_2',
        title: '🏬 Bustling Mega Mart',
        desc: 'Serve 100 store customers at checkout',
        statKey: 'customersServed',
        target: 100,
        reward: 2000,
        icon: '🛒'
      },
      {
        id: 'staff_1',
        title: '🧑‍🤝‍🧑 Helping Hands',
        desc: 'Purchase or upgrade helper staff 4 times',
        statKey: 'staffUpgraded',
        target: 4,
        reward: 600,
        icon: '👔'
      },
      {
        id: 'staff_2',
        title: '🏢 Executive Tycoon',
        desc: 'Purchase or upgrade helper staff 12 times',
        statKey: 'staffUpgraded',
        target: 12,
        reward: 4000,
        icon: '⭐'
      }
    ];
  }

  load() {
    try {
      const savedStats = localStorage.getItem('ofm_quest_stats');
      if (savedStats) this.stats = { ...this.stats, ...JSON.parse(savedStats) };
      const savedClaimed = localStorage.getItem('ofm_claimed_quests');
      if (savedClaimed) this.claimedQuests = JSON.parse(savedClaimed);
    } catch (e) {}
  }

  save() {
    try {
      localStorage.setItem('ofm_quest_stats', JSON.stringify(this.stats));
      localStorage.setItem('ofm_claimed_quests', JSON.stringify(this.claimedQuests));
    } catch (e) {}
  }

  recordEvent(key, amount = 1) {
    if (this.stats[key] !== undefined) {
      this.stats[key] += amount;
      this.save();

      // Trigger UI notification if a new quest just became claimable
      if (typeof window !== 'undefined' && window.game && window.game.ui) {
        window.game.ui.refreshQuestBadge();
      }
    }
  }

  isCompleted(questId) {
    const q = this.quests.find(x => x.id === questId);
    if (!q) return false;
    const cur = this.stats[q.statKey] || 0;
    return cur >= q.target;
  }

  isClaimed(questId) {
    return !!this.claimedQuests[questId];
  }

  isClaimable(questId) {
    return this.isCompleted(questId) && !this.isClaimed(questId);
  }

  hasUnclaimedRewards() {
    return this.quests.some(q => this.isClaimable(q.id));
  }

  claimReward(questId, gameEngine) {
    if (!this.isClaimable(questId)) return 0;
    const q = this.quests.find(x => x.id === questId);
    if (!q) return 0;

    this.claimedQuests[questId] = true;
    this.save();

    if (gameEngine) {
      gameEngine.money += q.reward;
      if (gameEngine.ui) {
        gameEngine.ui.showNotification(`🎉 QUEST COMPLETE! Claimed +$${q.reward.toLocaleString()} 💵 for "${q.title}"!`);
        gameEngine.ui.refreshQuestBadge();
      }
    }
    if (typeof sounds !== 'undefined') {
      sounds.playCash();
      sounds.playUpgrade();
    }
    return q.reward;
  }
}

// Global Export
let questManagerInstance = null;
if (typeof window !== 'undefined') {
  questManagerInstance = new QuestManager();
  window.questManager = questManagerInstance;
}
if (typeof globalThis !== 'undefined') {
  globalThis.questManager = questManagerInstance || new QuestManager();
}
var questManager = globalThis.questManager;

if (typeof module !== 'undefined') {
  module.exports = { QuestManager, questManager };
}
