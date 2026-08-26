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

console.log("=== VERIFYING MAX CARRY LIMIT ON TASK EXECUTION ===");

// 1. Worker 1 - Tomato Shelf
const mockScene = new THREE.Group();
const w1 = new HelperWorker(mockScene, 'STOCKER', { x: -5, z: 0.5 });
w1.setUnlocked(true);

const standTomato = { unlocked: true, config: { itemId: 'TOMATO' }, pos: new Vector3(2, 0, -5), stock: [], isFull: function() { return this.stock.length >= 6; }, addItem: function() { this.stock.push('TOMATO'); } };
const tomatoPatch = { unlocked: true, config: { itemId: 'TOMATO', pos: { x: -5, z: 5.5 } }, hasReadyCrops: () => true, harvestOne: () => 'TOMATO' };

let maxStack = 0;
// Run until first delivery starts
for (let f = 0; f < 300; f++) {
  w1.update(0.1, [tomatoPatch], [], [], [standTomato], []);
  if (w1.stack.length > maxStack) maxStack = w1.stack.length;
  if (w1.isDelivering) break;
}
console.log(`Worker 1 max batch gathered before starting delivery: ${maxStack} / ${w1.capacity}`);

// 2. Farmer - Chicken Feed
const farmer = new HelperWorker(mockScene, 'FARMER', { x: 0, z: 4.5 });
farmer.setUnlocked(true);
const chickenPen = { unlocked: true, config: { type: 'CHICKEN' }, feedStock: 0, feedCapacity: 6, feederPos: new Vector3(-11.5, 0, 6.5), addFeed: function(n) { this.feedStock += n; } };
const wheatPatch = { unlocked: true, config: { itemId: 'WHEAT', pos: { x: 3.5, z: 7.0 } }, hasReadyCrops: () => true, harvestOne: () => 'WHEAT' };

let farmerMaxStack = 0;
for (let f = 0; f < 300; f++) {
  farmer.update(0.1, [wheatPatch], [chickenPen], [], [], []);
  if (farmer.stack.length > farmerMaxStack) farmerMaxStack = farmer.stack.length;
  if (farmer.isDelivering) break;
}
console.log(`Farmer max batch gathered before starting delivery: ${farmerMaxStack} / ${farmer.capacity}`);

if (maxStack === 3 && farmerMaxStack === 3) {
  console.log("SUCCESS: All workers collect full max carry limit before delivering!");
} else {
  console.log("FAILED: Did not collect full max carry limit.");
}