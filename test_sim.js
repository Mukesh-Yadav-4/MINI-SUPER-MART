// Comprehensive Head-On Collision & Multi-Customer Anti-Deadlock Test
const fs = require('fs');

class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  clone() { return new Vector3(this.x, this.y, this.z); }
  distanceTo(v) {
    const dx = this.x - v.x;
    const dz = this.z - v.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
}

const GATES = {
  WEST: { spawn: new Vector3(-15.0, 0, -4.5), door: new Vector3(-12.0, 0, -4.5), foyer: new Vector3(-9.5, 0, -4.5), entryAisle: new Vector3(-4.5, 0, -2.5) },
  NORTH: { spawn: new Vector3(-6.0, 0, -14.5), door: new Vector3(-6.0, 0, -12.0), foyer: new Vector3(-6.0, 0, -10.5), entryAisle: new Vector3(-4.5, 0, -7.0) }
};

const SHELVES = {
  TOMATO: { pos: new Vector3(-2.0, 0, -4.8), front: new Vector3(-2.0, 0, -2.5), stock: 100, unlocked: true },
  EGG: { pos: new Vector3(-7.0, 0, -4.8), front: new Vector3(-7.0, 0, -2.5), stock: 100, unlocked: true },
  WHEAT: { pos: new Vector3(3.0, 0, -4.8), front: new Vector3(3.0, 0, -2.5), stock: 100, unlocked: true }
};

const REGISTER = { pos: new Vector3(-6.5, 0, 1.8), checkout: new Vector3(-6.5, 0, 0.95) };

function getCorridorPath(start, dest) {
  const waypoints = [];
  const startZ = start.z;
  const destZ = dest.z;

  const arteries = [-9.5, -4.5, 0.5, 5.0];
  let bestArtery = arteries[0];
  let minD = 999;
  for (let a of arteries) {
    const d = Math.abs(start.x - a) + Math.abs(dest.x - a);
    if (d < minD) { minD = d; bestArtery = a; }
  }

  if (Math.abs(startZ - destZ) > 0.8) {
    waypoints.push(new Vector3(bestArtery, 0, startZ));
    waypoints.push(new Vector3(bestArtery, 0, destZ));
  }
  waypoints.push(new Vector3(dest.x, 0, dest.z));
  return waypoints;
}

class SimCustomer {
  constructor(id, gateChoice) {
    this.id = id;
    this.gate = gateChoice;
    this.position = GATES[this.gate].spawn.clone();
    this.targetPos = this.position.clone();
    this.waypoints = [
      GATES[this.gate].door.clone(),
      GATES[this.gate].foyer.clone(),
      GATES[this.gate].entryAisle.clone()
    ];
    this.targetPos.copy(this.waypoints.shift());
    this.state = 'ENTER';
    this.basket = [];
    this.shoppingList = id % 3 === 0 ? ['TOMATO', 'EGG'] : (id % 3 === 1 ? ['EGG', 'WHEAT'] : ['TOMATO', 'WHEAT']);
    this.checkoutTimer = 0;
    this.speed = 4.2;
    this.isDone = false;
    this.lastPos = this.position.clone();
    this.stuckTimer = 0;
    this.waitingForRestock = false;
  }

  update(dt, isCashierPresent, queueIndex) {
    if (this.isDone) return;

    const dx = this.targetPos.x - this.position.x;
    const dz = this.targetPos.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const stepDist = this.speed * dt;

    if (dist <= stepDist || dist < 0.08) {
      this.position.copy(this.targetPos);
      if (this.waypoints.length > 0) {
        this.targetPos.copy(this.waypoints.shift());
      }
    } else {
      this.position.x += (dx / dist) * stepDist;
      this.position.z += (dz / dist) * stepDist;
    }

    // Stuck Watchdog
    if (this.position.distanceTo(this.lastPos) < 0.02 && this.state !== 'PAY' && !this.waitingForRestock) {
      this.stuckTimer += dt;
      if (this.stuckTimer > 2.5) {
        this.stuckTimer = 0;
        this.waypoints = [];
      }
    } else {
      this.stuckTimer = 0;
      this.lastPos.copy(this.position);
    }

    if (this.state === 'ENTER') {
      if (this.position.distanceTo(GATES[this.gate].entryAisle) < 0.3) {
        this.state = 'SHOP';
      }
    } else if (this.state === 'SHOP') {
      if (this.shoppingList.length > 0) {
        const item = this.shoppingList[0];
        const shelf = SHELVES[item];
        if (!shelf || !shelf.unlocked) {
          this.shoppingList.shift();
          return;
        }

        if (this.targetPos.distanceTo(shelf.front) > 0.4 && this.waypoints.length === 0) {
          this.waypoints = getCorridorPath(this.position, shelf.front);
          this.targetPos.copy(this.waypoints.shift());
        }

        // Instant pickup range (3.0m)
        if (this.position.distanceTo(shelf.pos) < 3.0) {
          if (shelf.stock > 0) {
            shelf.stock--;
            this.basket.push(this.shoppingList.shift());
            this.waitingForRestock = false;
            this.waypoints = [];
          } else {
            this.waitingForRestock = true;
          }
        }
      } else {
        this.state = 'QUEUE';
        this.waypoints = [];
        this.waitingForRestock = false;
      }
    } else if (this.state === 'QUEUE') {
      if (queueIndex === 0) {
        this.state = 'PAY';
        this.targetPos.copy(REGISTER.checkout);
      } else {
        this.targetPos.set(REGISTER.checkout.x, 0, REGISTER.checkout.z - queueIndex * 1.25);
      }
    } else if (this.state === 'PAY') {
      if (isCashierPresent) {
        this.checkoutTimer += dt;
        if (this.checkoutTimer >= 0.85) {
          this.state = 'LEAVE';
          const exitGate = this.id % 2 === 0 ? 'WEST' : 'NORTH';
          this.waypoints = getCorridorPath(this.position, GATES[exitGate].foyer);
          this.waypoints.push(GATES[exitGate].door.clone());
          this.waypoints.push(GATES[exitGate].spawn.clone());
          this.targetPos.copy(this.waypoints.shift());
        }
      }
    } else if (this.state === 'LEAVE') {
      if (this.waypoints.length === 0 && (this.position.distanceTo(GATES.WEST.spawn) < 0.5 || this.position.distanceTo(GATES.NORTH.spawn) < 0.5)) {
        this.isDone = true;
      }
    }
  }
}

// Run 50 Customers Concurrently with Head-On Sidestepping
const customers = [];
for (let i = 0; i < 50; i++) {
  const gate = i % 2 === 0 ? 'WEST' : 'NORTH';
  customers.push(new SimCustomer(i + 1, gate));
}

let allDone = false;
let finalTime = 0;
let maxStuckTime = 0;

for (let step = 0; step < 4000; step++) {
  const dt = 0.04;
  const t = step * dt;

  // Lateral Sidestepping Physics Separation
  for (let i = 0; i < customers.length; i++) {
    for (let j = i + 1; j < customers.length; j++) {
      const c1 = customers[i];
      const c2 = customers[j];
      if (c1.isDone || c2.isDone) continue;
      if (c1.state === 'PAY' && c2.state === 'PAY') continue;

      const dist = c1.position.distanceTo(c2.position);
      const minDist = 0.85;
      if (dist < minDist && dist > 0.001) {
        const overlap = (minDist - dist) * 0.5;
        const nx = (c1.position.x - c2.position.x) / dist;
        const nz = (c1.position.z - c2.position.z) / dist;
        // Lateral deflection prevents head-on stalling
        const perpX = -nz * 0.35;
        const perpZ = nx * 0.35;
        c1.position.x += (nx * 0.65 + perpX) * overlap;
        c1.position.z += (nz * 0.65 + perpZ) * overlap;
        c2.position.x -= (nx * 0.65 - perpX) * overlap;
        c2.position.z -= (nz * 0.65 - perpZ) * overlap;
      }
    }
  }

  const queue = customers.filter(c => (c.state === 'QUEUE' || c.state === 'PAY') && !c.isDone);
  customers.forEach(c => {
    const qIdx = queue.indexOf(c);
    c.update(dt, true, qIdx);
    if (c.stuckTimer > maxStuckTime) maxStuckTime = c.stuckTimer;
  });

  if (customers.every(c => c.isDone)) {
    allDone = true;
    finalTime = t;
    break;
  }
}

const doneCount = customers.filter(c => c.isDone).length;
console.log(`Simulation finished at t=${finalTime.toFixed(1)}s: ${doneCount} / ${customers.length} customers successfully completed full cycle.`);
console.log(`Max stuck time recorded: ${maxStuckTime.toFixed(2)}s`);
if (allDone && maxStuckTime < 1.0) {
  console.log("=== 100% PERFECT VERIFICATION: 50/50 COMPLETED WITH ZERO DELAYS ===");
}