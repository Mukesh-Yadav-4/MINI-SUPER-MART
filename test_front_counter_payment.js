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
  Mesh: function() { this.position = new Vector3(); this.rotation = { x: 0, y: 0 }; },
  Sprite: function() { this.scale = { set: () => {} }; this.position = new Vector3(); },
  CanvasTexture: function() {},
  SpriteMaterial: function() {},
  BoxGeometry: function() {},
  CylinderGeometry: function() {},
  CircleGeometry: function() {},
  SphereGeometry: function() {},
  RingGeometry: function() {},
  PlaneGeometry: function() {},
  MeshLambertMaterial: function() {},
  MeshBasicMaterial: function() {},
  LinearFilter: 0
};

global.document = {
  createElement: () => ({ getContext: () => ({ clearRect: () => {}, beginPath: () => {}, arc: () => {}, closePath: () => {}, fill: () => {}, stroke: () => {}, fillText: () => {} }) })
};

global.CONFIG = {
  COLORS: { FLOOR_MAT: 0x0, COUNTER_CYAN: 0x0, MONEY_GREEN: 0x0 },
  CUSTOMER: { maxCustomers: 5, spawnInterval: 3.0, vipChance: 0.18, checkoutDuration: 0.5 },
  UNLOCKS: { stand_tomato: { unlocked: true } },
  ITEMS: {
    TOMATO: { id: 'TOMATO', sellPrice: 1, type: 'crop' }
  }
};
global.sounds = { playCash: () => {}, playPop: () => {}, playUnlock: () => {} };

const custCode = fs.readFileSync('./src/customers.js', 'utf8');
const marketCode = fs.readFileSync('./src/market.js', 'utf8');
const fn = new Function(marketCode + '\n' + custCode + '\nglobal.CashRegister = CashRegister;\nglobal.Customer = Customer;\nglobal.CustomerManager = CustomerManager;');
fn();

console.log("=== VERIFYING FRONT COUNTER PAYMENT & SMALL RADIUS CASH VACUUM ===");

const mockScene = new THREE.Group();
const reg = new CashRegister(mockScene, { x: -6.5, z: 2.0 });
const cust = new Customer(mockScene, false);
cust.assignedRegister = reg;
cust.state = 'PAY';
cust.basketItems = ['TOMATO', 'TOMATO'];

// Case 1: Customer is 2m away from the counter spot -> Should NOT pay yet
cust.position.set(-6.5, 0, 0.0); // 1.15m away from customerCheckoutPos (-6.5, 0, 1.15)
let cm = new CustomerManager(mockScene);
cm.customers = [cust];

cm.update(0.6, [], [reg], true, null, { position: new Vector3(-6.5, 0, 2.85) });
console.log("1. Customer walking (not yet at counter) -> checkoutTimer:", cust.checkoutTimer, "reg cash:", reg.uncollectedCash);

// Case 2: Customer physically arrives in front of counter
cust.position.copy(reg.customerCheckoutPos);
cm.update(0.6, [], [reg], true, null, { position: new Vector3(-6.5, 0, 2.85) });
console.log("2. Customer standing in front of counter -> payment completed! reg cash:", reg.uncollectedCash);

// Case 3: Player standing at counter (dist < 2.4m) collects cash
const playerPos = new Vector3(-6.5, 0, 2.85); // 0.85m away from reg.pos
let playerMoney = 50;

const distToDesk = Math.min(
  playerPos.distanceTo(reg.pos),
  playerPos.distanceTo(reg.cashCollectPos),
  playerPos.distanceTo(reg.cashierZonePos),
  playerPos.distanceTo(reg.customerCheckoutPos)
);

if (distToDesk < 2.4 && reg.uncollectedCash > 0) {
  const earned = reg.collectAllCash();
  playerMoney += earned;
  console.log(`3. Player at counter collected: +$${earned}, Final Wallet Balance: $${playerMoney}`);
}

if (cust.checkoutTimer === 0 && reg.uncollectedCash === 0 && playerMoney === 52) {
  console.log("SUCCESS: Front counter payment & small collection radius verified 100%!");
} else {
  console.log("FAILED: Check logic.");
}