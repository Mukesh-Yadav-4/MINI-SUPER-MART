const fs = require('fs');

class Vector3 {
  constructor(x=0, y=0, z=0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  clone() { return new Vector3(this.x, this.y, this.z); }
  distanceTo(v) { return Math.sqrt((this.x - v.x)**2 + (this.z - v.z)**2); }
}

global.THREE = {
  Vector3: Vector3,
  Group: function() { this.add = () => {}; this.remove = () => {}; this.position = new Vector3(); this.rotation = { y: 0 }; },
  Mesh: function() { this.position = new Vector3(); this.rotation = { x: 0 }; },
  CircleGeometry: function() {},
  BoxGeometry: function() {},
  SphereGeometry: function() {},
  CylinderGeometry: function() {},
  MeshLambertMaterial: function() {},
  MeshBasicMaterial: function() {}
};

global.CONFIG = {
  UPGRADES: { staff: { currentLevel: 0, levels: [1.0], capacityLevels: [3, 4, 5, 6, 7] } },
  ITEMS: {
    TOMATO: { id: 'TOMATO' },
    WHEAT: { id: 'WHEAT' },
    EGG: { id: 'EGG' },
    MILK: { id: 'MILK' },
    JUICE: { id: 'JUICE' },
    BREAD: { id: 'BREAD' },
    CARROT: { id: 'CARROT' }
  }
};
global.sdk = { boostActive: false };
global.sounds = { playPop: () => {}, playPlace: () => {} };
global.Player = { createItemMesh: () => ({ position: new Vector3() }) };

const staffCode = fs.readFileSync('./src/staff.js', 'utf8');
const fn = new Function(staffCode + '\nglobal.HelperWorker = HelperWorker;');
fn();

console.log("=== TESTING ACTIVE DYNAMIC TASK SWITCHING ===");

const mockScene = new THREE.Group();
const w1 = new HelperWorker(mockScene, 'STOCKER', { x: -5, z: 0.5 });
w1.setUnlocked(true);

const standTomato = { unlocked: true, config: { itemId: 'TOMATO' }, pos: new Vector3(2, 0, -5), stock: [], isFull: function() { return this.stock.length >= 6; }, addItem: function() { this.stock.push('TOMATO'); } };
const juicer = { unlocked: true, config: { type: 'JUICER', pos: { x: -2, z: -1 } }, group: { position: new Vector3(-2, 0, -1) }, ingredients: [], outputStock: 0, inputStock: 0, isInputFull: function() { return this.ingredients.length >= 4; }, addIngredient: function(i) { this.ingredients.push(i); this.inputStock = this.ingredients.length; }, harvestOutput: function() { return 'JUICE'; } };
const standJuice = { unlocked: true, config: { itemId: 'JUICE' }, pos: new Vector3(-2, 0, -9), stock: [], isFull: function() { return this.stock.length >= 6; }, addItem: function() { this.stock.push('JUICE'); } };
const tomatoPatch = { unlocked: true, config: { itemId: 'TOMATO', pos: { x: -5, z: 5.5 } }, hasReadyCrops: () => true, harvestOne: () => 'TOMATO' };

// Fill Tomato Shelf to 100% full
for (let i = 0; i < 6; i++) standTomato.addItem();

// Trigger update
w1.update(0.1, [tomatoPatch], [], [juicer], [standTomato, standJuice], []);
console.log("1. Tomato shelf full (6/6). Juicer needs input. Worker 1 task:", w1.w1_task);

// Fill Juicer to 100% full & put 2 juices in output
for (let i = 0; i < 4; i++) juicer.addIngredient('TOMATO');
juicer.outputStock = 2;

w1.update(0.1, [tomatoPatch], [], [juicer], [standTomato, standJuice], []);
console.log("2. Juicer full. Juice shelf needs stock. Worker 1 task:", w1.w1_task);

// Tomato shelf drops to 0
standTomato.stock = [];
w1.update(0.1, [tomatoPatch], [], [juicer], [standTomato, standJuice], []);
console.log("3. Tomato shelf dropped to 0! Worker 1 task (should interrupt to TOMATO_SHELF):", w1.w1_task);

if (w1.w1_task === 'TOMATO_SHELF') {
  console.log("SUCCESS: Dynamic pipeline working seamlessly without standing idle!");
} else {
  console.log("FAILED: Did not transition properly.");
}