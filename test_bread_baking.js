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
  Sprite: function() { this.scale = { set: () => {} }; this.position = new Vector3(); },
  CanvasTexture: function() {},
  SpriteMaterial: function() {},
  BoxGeometry: function() {},
  CylinderGeometry: function() {},
  CircleGeometry: function() {},
  SphereGeometry: function() {},
  MeshLambertMaterial: function() {},
  MeshBasicMaterial: function() {},
  LinearFilter: 0
};

global.document = {
  createElement: () => ({ getContext: () => ({ clearRect: () => {}, beginPath: () => {}, arc: () => {}, closePath: () => {}, fill: () => {}, stroke: () => {}, fillText: () => {} }) })
};

global.CONFIG = {
  UPGRADES: { staff: { currentLevel: 0, levels: [1.0], capacityLevels: [3, 4, 5, 6, 7] } },
  ITEMS: {
    TOMATO: { id: 'TOMATO' },
    WHEAT: { id: 'WHEAT' },
    EGG: { id: 'EGG' },
    MILK: { id: 'MILK' },
    JUICE: { id: 'JUICE' },
    BREAD: { id: 'BREAD', bakeTime: 8.0 },
    CARROT: { id: 'CARROT' }
  }
};
global.sdk = { boostActive: false };
global.sounds = { playPop: () => {}, playPlace: () => {}, playMachine: () => {} };
global.Player = { createItemMesh: () => ({ position: new Vector3() }) };
global.addSketchLines = () => {};

const farmCode = fs.readFileSync('./src/farm.js', 'utf8');
const staffCode = fs.readFileSync('./src/staff.js', 'utf8');
const fn = new Function(farmCode + '\n' + staffCode + '\nglobal.ProcessingMachine = ProcessingMachine;\nglobal.HelperWorker = HelperWorker;');
fn();

console.log("=== VERIFYING AUTOMATED BREAD BAKING (8.0s) ===");

const mockScene = new THREE.Group();
const bakery = new ProcessingMachine(mockScene, { id: 'machine_bakery', type: 'BAKERY', outputId: 'BREAD', pos: { x: 4.8, z: -0.5 }, unlocked: true });
bakery.unlocked = true;

// Add 1 wheat + 1 egg
bakery.addIngredient('WHEAT');
bakery.addIngredient('EGG');

console.log("Bakery initial output:", bakery.outputStock);

// Simulate 8.1 seconds
bakery.update(8.1, 1.0);

console.log("Bakery output after 8.1s:", bakery.outputStock);

const farmer = new HelperWorker(mockScene, 'FARMER', { x: 0.0, z: 4.5 });
farmer.setUnlocked(true);

const wheatPatch = { unlocked: true, config: { itemId: 'WHEAT', pos: { x: 3.5, z: 7.0 } }, hasReadyCrops: () => true, harvestOne: () => 'WHEAT' };
const chickenPen = { unlocked: true, config: { type: 'CHICKEN' }, feedStock: 4, feedCapacity: 4 };

// Farmer updates when animals are fed and bakery needs input
bakery.ingredients = []; // empty bakery
farmer.update(0.1, [wheatPatch], [chickenPen], [bakery], [], []);
console.log("Farmer task for bakery:", farmer.farmer_task);

if (bakery.outputStock === 1 && farmer.farmer_task === 'BAKERY_FEED') {
  console.log("SUCCESS: Automated Bread Baking & Staff Pipeline verified 100%!");
} else {
  console.log("FAILED: Check parameters.");
}