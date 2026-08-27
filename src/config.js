// Master Configuration: Spacious Layout, Grounded Pricing & 40-50 Min Progression
const CONFIG = {
  ITEMS: {
    TOMATO: { id: 'TOMATO', name: 'Organic Tomato', icon: '🍅', color: 0xf44336, sellPrice: 2, growthTime: 2.5, type: 'crop' },
    WHEAT: { id: 'WHEAT', name: 'Golden Wheat', icon: '🌾', color: 0xffca28, sellPrice: 3, growthTime: 2.0, type: 'material' },
    EGG: { id: 'EGG', name: 'Farm Fresh Egg', icon: '🥚', color: 0xffffff, produceTime: 3.0, feedRequired: 'WHEAT', sellPrice: 4, type: 'animal' },
    JUICE: { id: 'JUICE', name: 'Canned Sauce / Jam', icon: '🥫', color: 0xd32f2f, sellPrice: 8, pressTime: 4.0, recipe: { TOMATO: 2 }, type: 'processed' },
    CARROT: { id: 'CARROT', name: 'Golden Sweetcorn', icon: '🌽', color: 0xff9800, sellPrice: 12, growthTime: 3.5, type: 'crop' },
    MILK: { id: 'MILK', name: 'Whole Farm Milk', icon: '🥛', color: 0x29b6f6, sellPrice: 18, produceTime: 4.5, feedRequired: 'WHEAT', type: 'animal' },
    BREAD: { id: 'BREAD', name: 'Artisan Bakery Bread', icon: '🍞', color: 0xd79a55, sellPrice: 28, bakeTime: 5.0, recipe: { WHEAT: 1, EGG: 1 }, type: 'processed' },
    CAKE: { id: 'CAKE', name: 'Royal Strawberry Cake', icon: '🎂', color: 0xf06292, sellPrice: 80, bakeTime: 4.5, recipe: { MILK: 1, EGG: 1, BREAD: 1 }, type: 'processed' }
  },

  UNLOCKS: {
    plot_tomato: { id: 'plot_tomato', name: 'Tomato Troughs', cost: 0, unlocked: true },
    stand_tomato: { id: 'stand_tomato', name: 'Tomato Stand', cost: 0, unlocked: true },
    
    // Phase 1 (0 - 5 mins): Wheat Field, Grain Stand, Farm Hand & Chicken Coop
    plot_wheat: {
      id: 'plot_wheat',
      name: 'Wheat Field',
      cost: 10,
      unlocked: false,
      pos: { x: 3.5, z: 7.0 },
      radius: 1.8
    },
    stand_wheat: {
      id: 'stand_wheat',
      name: 'Golden Grain Stand',
      cost: 15,
      unlocked: false,
      pos: { x: 10.1, z: -6.65 },
      radius: 1.6,
      requires: 'plot_wheat'
    },
    helper_farmer: {
      id: 'helper_farmer',
      name: 'Hire Farm Hand',
      cost: 25,
      unlocked: false,
      pos: { x: 0.0, z: 4.5 },
      radius: 1.6,
      requires: 'stand_wheat'
    },
    pen_chicken: {
      id: 'pen_chicken',
      name: 'Chicken Coop',
      cost: 40,
      unlocked: false,
      pos: { x: -11.5, z: 6.5 },
      radius: 2.0,
      requires: 'helper_farmer'
    },
    stand_egg: {
      id: 'stand_egg',
      name: 'Egg Display Shelf',
      cost: 50,
      unlocked: false,
      pos: { x: -0.5, z: -6.65 },
      radius: 1.6,
      requires: 'pen_chicken'
    },

    // Phase 2 (5 - 15 mins): Basic Automation & Sauce Press
    helper_stocker: {
      id: 'helper_stocker',
      name: 'Hire Shelf Stocker',
      cost: 80,
      unlocked: false,
      pos: { x: -5.0, z: 0.5 },
      radius: 1.6,
      requires: 'stand_egg'
    },
    helper_cashier: {
      id: 'helper_cashier',
      name: 'Hire Checkout Cashier',
      cost: 120,
      unlocked: false,
      pos: { x: -6.5, z: 2.35 },
      radius: 1.6,
      requires: 'helper_stocker'
    },
    machine_juicer: {
      id: 'machine_juicer',
      name: 'Tomato Sauce / Jam Machine',
      cost: 200,
      unlocked: false,
      pos: { x: -0.5, z: -0.8 },
      radius: 1.8,
      requires: 'helper_cashier'
    },
    stand_juice: {
      id: 'stand_juice',
      name: 'Canned Goods Stand',
      cost: 300,
      unlocked: false,
      pos: { x: -0.5, z: -12.5 },
      radius: 1.6,
      requires: 'machine_juicer'
    },

    // Phase 3 (15 - 28 mins): Dairy Cow Pasture & Cold Storage
    pen_cow: {
      id: 'pen_cow',
      name: 'Dairy Cow Pasture',
      cost: 450,
      unlocked: false,
      pos: { x: 10.5, z: 6.5 },
      radius: 2.0,
      requires: 'stand_juice'
    },
    stand_milk: {
      id: 'stand_milk',
      name: 'Glass Door Milk Refrigerator',
      cost: 650,
      unlocked: false,
      pos: { x: 4.8, z: -12.5 },
      radius: 1.6,
      requires: 'pen_cow'
    },
    door_east: {
      id: 'door_east',
      name: 'North-East Pastry Gate',
      cost: 750,
      unlocked: false,
      pos: { x: 19.5, z: -11.5 },
      radius: 1.8,
      requires: 'stand_milk'
    },
    helper_cashier_2: {
      id: 'helper_cashier_2',
      name: 'Hire Express Cashier (Reg #2)',
      cost: 950,
      unlocked: false,
      pos: { x: 14.4, z: 2.35 },
      radius: 1.6,
      requires: 'door_east'
    },

    // Phase 4 (28 - 40 mins): Artisan Bakery & Master Crops
    machine_bakery: {
      id: 'machine_bakery',
      name: 'Artisan Oven Counter',
      cost: 1100,
      unlocked: false,
      pos: { x: 4.8, z: -0.8 },
      radius: 1.8,
      requires: 'helper_cashier_2'
    },
    stand_bread: {
      id: 'stand_bread',
      name: 'Warm Bakery Showcase',
      cost: 1400,
      unlocked: false,
      pos: { x: 10.1, z: -12.5 },
      radius: 1.6,
      requires: 'machine_bakery'
    },
    helper_harvester: {
      id: 'helper_harvester',
      name: 'Hire Field Harvester',
      cost: 1200,
      unlocked: false,
      pos: { x: 4.8, z: 2.5 },
      radius: 1.6,
      requires: 'stand_bread'
    },
    plot_carrot: {
      id: 'plot_carrot',
      name: 'Sweetcorn Field',
      cost: 1800,
      unlocked: false,
      pos: { x: 0.0, z: 9.5 },
      radius: 1.8,
      requires: 'stand_bread'
    },
    stand_carrot: {
      id: 'stand_carrot',
      name: 'Golden Sweetcorn Stand',
      cost: 2200,
      unlocked: false,
      pos: { x: 15.4, z: -6.65 },
      radius: 1.6,
      requires: 'plot_carrot'
    },

    // Phase 5 (40 - 50 mins): Royal Cake Bakery & Harvester
    machine_cakery: {
      id: 'machine_cakery',
      name: 'Pastry Cake Mixer Machine',
      cost: 3200,
      unlocked: false,
      pos: { x: 10.1, z: -0.8 },
      radius: 1.8,
      requires: 'stand_carrot'
    },
    stand_cake: {
      id: 'stand_cake',
      name: 'Royal Cake Pedestal Stand',
      cost: 4500,
      unlocked: false,
      pos: { x: 15.4, z: -12.5 },
      radius: 1.6,
      requires: 'machine_cakery'
    }
  },

  UPGRADES: {
    // 1. Production Rate (Crops & Animals)
    growth: {
      id: 'growth',
      group: 'production',
      groupName: '🌾 Production Rate',
      category: 'Farming',
      title: 'Crop Fertilizer',
      icon: '⚡',
      levels: [1.0, 1.4, 1.9, 2.5, 3.2, 4.0],
      unit: 'x speed',
      costs: [20, 65, 220, 700, 2000],
      currentLevel: 0
    },
    egg_speed: {
      id: 'egg_speed',
      group: 'production',
      groupName: '🌾 Production Rate',
      category: 'Poultry',
      title: 'Egg Laying Rate',
      icon: '🥚',
      levels: [1.0, 1.3, 1.7, 2.2, 3.0],
      unit: 'x speed',
      costs: [25, 85, 300, 950],
      currentLevel: 0
    },
    chicken_count: {
      id: 'chicken_count',
      group: 'production',
      groupName: '🌾 Production Rate',
      category: 'Poultry',
      title: 'Coop Flock Size',
      icon: '🐔',
      levels: [2, 3, 4, 5, 6, 8],
      unit: 'hens',
      costs: [30, 110, 380, 1150, 3200],
      currentLevel: 0
    },
    milk_speed: {
      id: 'milk_speed',
      group: 'production',
      groupName: '🌾 Production Rate',
      category: 'Dairy',
      title: 'Milk Output Rate',
      icon: '🥛',
      levels: [1.0, 1.3, 1.7, 2.2, 3.0],
      unit: 'x speed',
      costs: [350, 1100, 2800, 6500],
      currentLevel: 0
    },
    cow_count: {
      id: 'cow_count',
      group: 'production',
      groupName: '🌾 Production Rate',
      category: 'Dairy',
      title: 'Dairy Herd Size',
      icon: '🐄',
      levels: [1, 2, 3, 4, 5],
      unit: 'cows',
      costs: [450, 1400, 3600, 8000],
      currentLevel: 0
    },

    // 2. ✨ Product Quality & Value (Increases Sell Prices)
    quality_tomato: {
      id: 'quality_tomato',
      group: 'quality',
      groupName: '✨ Product Quality',
      category: 'Produce Quality',
      title: 'Heirloom Tomato Grade',
      icon: '🍅',
      levels: [2, 4, 7, 11, 16],
      unit: '$/tomato',
      costs: [15, 55, 180, 550],
      currentLevel: 0
    },
    quality_wheat: {
      id: 'quality_wheat',
      group: 'quality',
      groupName: '✨ Product Quality',
      category: 'Grain Quality',
      title: 'Organic Golden Wheat Grade',
      icon: '🌾',
      levels: [3, 6, 10, 16, 24],
      unit: '$/wheat',
      costs: [25, 80, 260, 850],
      currentLevel: 0
    },
    quality_egg: {
      id: 'quality_egg',
      group: 'quality',
      groupName: '✨ Product Quality',
      category: 'Poultry Quality',
      title: 'Free-Range Farm Egg Grade',
      icon: '🥚',
      levels: [4, 8, 14, 22, 32],
      unit: '$/egg',
      costs: [35, 110, 360, 1150],
      currentLevel: 0
    },
    quality_juice: {
      id: 'quality_juice',
      group: 'quality',
      groupName: '✨ Product Quality',
      category: 'Processed Goods',
      title: 'Gourmet Tomato Sauce Recipe',
      icon: '🥫',
      levels: [8, 16, 28, 44, 65],
      unit: '$/can',
      costs: [50, 180, 580, 1850],
      currentLevel: 0
    },
    quality_carrot: {
      id: 'quality_carrot',
      group: 'quality',
      groupName: '✨ Product Quality',
      category: 'Produce Quality',
      title: 'Super-Sweetcorn Grade',
      icon: '🌽',
      levels: [12, 24, 40, 62, 90],
      unit: '$/corn',
      costs: [90, 320, 1100, 3400],
      currentLevel: 0
    },
    quality_milk: {
      id: 'quality_milk',
      group: 'quality',
      groupName: '✨ Product Quality',
      category: 'Dairy Quality',
      title: 'A2 Gold Whole Milk Grade',
      icon: '🥛',
      levels: [18, 34, 58, 90, 130],
      unit: '$/can',
      costs: [150, 520, 1750, 5400],
      currentLevel: 0
    },
    quality_bread: {
      id: 'quality_bread',
      group: 'quality',
      groupName: '✨ Product Quality',
      category: 'Bakery Quality',
      title: 'Artisan Bakery Sourdough',
      icon: '🍞',
      levels: [28, 52, 88, 135, 195],
      unit: '$/loaf',
      costs: [240, 800, 2600, 7800],
      currentLevel: 0
    },
    quality_cake: {
      id: 'quality_cake',
      group: 'quality',
      groupName: '✨ Product Quality',
      category: 'Master Patisserie',
      title: 'Royal Strawberry Cake Recipe',
      icon: '🎂',
      levels: [80, 145, 240, 360, 520],
      unit: '$/cake',
      costs: [450, 1500, 4800, 12800],
      currentLevel: 0
    },

    // 3. Machinery (Appliances & Shelves)
    appliance_capacity: {
      id: 'appliance_capacity',
      group: 'machinery',
      groupName: '⚙️ Machinery',
      category: 'Appliances',
      title: 'Machine Input Hopper',
      icon: '⚙️',
      levels: [6, 8, 10, 12],
      unit: 'max ingredients',
      costs: [80, 320, 1200],
      currentLevel: 0
    },
    stand_capacity: {
      id: 'stand_capacity',
      group: 'machinery',
      groupName: '⚙️ Machinery',
      category: 'Market',
      title: 'Shelf Space',
      icon: '📦',
      levels: [6, 8, 12, 18, 26, 36, 50],
      unit: 'slots',
      costs: [40, 140, 480, 1450, 3800, 8500],
      currentLevel: 0
    },

    // 4. Worker + Main Character
    capacity: {
      id: 'capacity',
      group: 'worker_player',
      groupName: '👥 Worker & Player',
      category: 'Main Character',
      title: 'Backpack Space',
      icon: '🎒',
      levels: [4, 6, 8, 10],
      unit: 'items',
      costs: [20, 90, 380],
      currentLevel: 0
    },
    speed: {
      id: 'speed',
      group: 'worker_player',
      groupName: '👥 Worker & Player',
      category: 'Main Character',
      title: 'Player Speed',
      icon: '👟',
      levels: [9.5, 11.0, 12.8, 14.8, 17.0, 19.5, 22.5],
      unit: 'm/s',
      costs: [15, 50, 180, 550, 1600, 4200],
      currentLevel: 0
    },
    staff: {
      id: 'staff',
      group: 'worker_player',
      groupName: '👥 Worker & Player',
      category: 'Helper Staff',
      title: 'Helper Staff Carry & Speed',
      icon: '👥',
      levels: [1.0, 1.25, 1.55, 1.9, 2.3],
      capacityLevels: [3, 4, 5, 6, 7],
      unit: 'x stats',
      costs: [45, 160, 580, 1900],
      currentLevel: 0
    }
  },

  getItemSellPrice(itemId) {
    if (!itemId) return 1;
    const key = `quality_${itemId.toLowerCase()}`;
    const upg = this.UPGRADES ? this.UPGRADES[key] : null;
    if (upg && Array.isArray(upg.levels)) {
      const lvl = Math.min(upg.currentLevel, upg.levels.length - 1);
      return upg.levels[lvl];
    }
    return this.ITEMS[itemId] ? this.ITEMS[itemId].sellPrice : 1;
  },

  CUSTOMER: {
    spawnInterval: 3.0,
    maxCustomers: 8,
    vipChance: 0.18,
    checkoutDuration: 0.5
  },

  COLORS: {
    GRASS: 0x5bb331,
    MART_FLOOR: 0xd2ba8c,
    MART_FLOOR_ALT: 0xc5ac7e,
    MART_BORDER: 0x6d4c41,
    BACK_WALL: 0xfafafa,
    WALL_TRIM: 0x795548,
    AWNING_RED: 0xe53935,
    AWNING_WHITE: 0xffffff,
    GLASS_DOOR: 0x81d4fa,
    FLOOR_MAT: 0x5d4037,
    COUNTER_CYAN: 0x00acc1,
    DIRT_BROWN: 0x4e342e,
    DIRT_LIGHT: 0x6d4c41,
    WOOD_BORDER: 0x795548,
    BLUE_FRIDGE: 0x0288d1,
    RED_BIN: 0xd32f2f,
    MONEY_GREEN: 0x43a047,
    VIP_GOLD: 0xffb300,
    ARROW_YELLOW: 0xffeb3b,
    PAVER_STONE: 0xd7ccc8,
    PAVER_DARK: 0xa1887f,
    SHADOW_TINT: 0x1b2e1b,
    SKETCH_BLACK: 0x111111
  }
};