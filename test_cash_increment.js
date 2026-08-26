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
  RingGeometry: function() {},
  PlaneGeometry: function() {},
  MeshLambertMaterial: function() {},
  MeshBasicMaterial: function() {}
};

global.CONFIG = {
  COLORS: { FLOOR_MAT: 0x0, COUNTER_CYAN: 0x0, MONEY_GREEN: 0x0 },
  CUSTOMER: { maxCustomers: 5, spawnInterval: 3.0, vipChance: 0.18, checkoutDuration: 0.35 },
  ITEMS: {
    TOMATO: { id: 'TOMATO', sellPrice: 1, type: 'crop' }
  }
};
global.sounds = { playCash: () => {} };

const marketCode = fs.readFileSync('./src/market.js', 'utf8');
const fn = new Function(marketCode + '\nglobal.CashRegister = CashRegister;');
fn();

console.log("=== VERIFYING CASH INCREMENT & COLLECTION ===");

const mockScene = new THREE.Group();
const reg = new CashRegister(mockScene, { x: -6.5, z: 2.0 });

// Customer pays $15
reg.addEarnedCash(15);
console.log("Uncollected cash on desk:", reg.uncollectedCash);

// Player walks within 7.5m (e.g. at x: -4.0, z: 2.0, dist = 2.5m)
const playerPos = new Vector3(-4.0, 0, 2.0);
const distToDesk = Math.min(
  playerPos.distanceTo(reg.pos),
  playerPos.distanceTo(reg.cashCollectPos),
  playerPos.distanceTo(reg.cashierZonePos),
  playerPos.distanceTo(reg.customerCheckoutPos)
);

let playerMoney = 100;
if (distToDesk < 7.5 && reg.uncollectedCash > 0) {
  const earned = reg.collectAllCash();
  playerMoney += earned;
  console.log(`Earned: +$${earned}, Player Balance: $${playerMoney}`);
}

if (playerMoney === 115 && reg.uncollectedCash === 0) {
  console.log("SUCCESS: Cash collection and increment verified 100%!");
} else {
  console.log("FAILED: Cash collection did not work.");
}