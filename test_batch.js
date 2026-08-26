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
    CARROT: { id: 'CARROT' }
  }
};
global.sdk = { boostActive: false };
global.sounds = { playPop: () => {} };
global.Player = { createItemMesh: () => ({ position: new Vector3() }) };

const staffCode = fs.readFileSync('./src/staff.js', 'utf8');
const fn = new Function(staffCode + '\nglobal.HelperWorker = HelperWorker;');
fn();

const mockScene = new THREE.Group();
const worker = new HelperWorker(mockScene, 'FARMER', { x: 0, z: 4.5 });
worker.setUnlocked(true);

// Mock farm patches (5 ready wheat)
let wheatAvailable = 5;
const mockPatches = [{
  unlocked: true,
  config: { id: 'plot_wheat', itemId: 'WHEAT', pos: { x: 3.5, z: 7.0 } },
  hasReadyCrops: () => wheatAvailable > 0,
  harvestOne: () => {
    if (wheatAvailable > 0) { wheatAvailable--; return 'WHEAT'; }
    return null;
  }
}];

// Mock Wheat Stand (empty, wants wheat)
let standStock = 0;
const mockStands = [{
  unlocked: true,
  config: { itemId: 'WHEAT' },
  pos: new Vector3(6.0, 0, -5.0),
  isFull: () => standStock >= 10,
  addItem: () => { standStock++; }
}];

const mockPens = [];
const mockMachines = [];

console.log("=== SIMULATING FARM HAND BATCH HARVEST ===");
let maxStackRecorded = 0;
let tripsMade = 0;

for (let frame = 0; frame < 1500; frame++) {
  const dt = 0.05;
  worker.update(dt, mockPatches, mockPens, mockMachines, mockStands, []);

  if (worker.stack.length > maxStackRecorded) {
    maxStackRecorded = worker.stack.length;
  }

  if (standStock > 0 && worker.stack.length === 0 && tripsMade === 0) {
    tripsMade++;
    console.log(`Trip 1 completed! Items delivered: ${standStock}, Max batch carried in trip: ${maxStackRecorded}`);
  }
}

console.log(`Final Result: Max stack reached = ${maxStackRecorded} / ${worker.capacity}`);
if (maxStackRecorded === worker.capacity && standStock === 3) {
  console.log("SUCCESS: Worker collected full capacity (3 items) before delivering!");
} else {
  console.log("FAILED: Batching not full.");
}