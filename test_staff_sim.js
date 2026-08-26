// Automated Staff Simulation Test
console.log("=== RUNNING AUTOMATED STAFF WORKER SIMULATION ===");

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

const STANDS = [
  { id: 'stand_tomato', itemId: 'TOMATO', pos: new Vector3(-2.0, 0, -5.0), stock: 0, capacity: 6, unlocked: true },
  { id: 'stand_egg', itemId: 'EGG', pos: new Vector3(-6.5, 0, -5.0), stock: 0, capacity: 6, unlocked: true },
  { id: 'stand_wheat', itemId: 'WHEAT', pos: new Vector3(2.5, 0, -5.0), stock: 0, capacity: 6, unlocked: true }
];

const PATCHES = [
  { id: 'plot_tomato', itemId: 'TOMATO', pos: new Vector3(-5.0, 0, 5.5), readyCrops: 10, unlocked: true },
  { id: 'plot_wheat', itemId: 'WHEAT', pos: new Vector3(3.5, 0, 7.0), readyCrops: 10, unlocked: true }
];

const PENS = [
  { id: 'pen_chicken', produceId: 'EGG', pickupPos: new Vector3(-11.5, 0, 6.5), feederPos: new Vector3(-11.5, 0, 5.0), produceStock: 10, feedStock: 0, feedCapacity: 6, unlocked: true }
];

class SimStaffWorker {
  constructor(type, initialPos) {
    this.type = type;
    this.position = initialPos.clone();
    this.targetPos = initialPos.clone();
    this.waypoints = [];
    this.stack = [];
    this.capacity = 3;
    this.speed = 5.2;
    this.totalRestocks = 0;
  }

  setDestination(destX, destZ) {
    const isDestInFarm = destZ > 2.0;
    const isCurrInFarm = this.position.z > 2.0;

    if (isDestInFarm !== isCurrInFarm) {
      let corridorX = 0.0;
      if (this.position.x < -2.5) corridorX = -5.0;
      else if (this.position.x > 2.5) corridorX = 5.0;

      this.waypoints = [
        new Vector3(corridorX, 0, this.position.z),
        new Vector3(corridorX, 0, destZ > 2.0 ? 3.5 : 0.8),
        new Vector3(destX, 0, destZ)
      ];
      this.targetPos.copy(this.waypoints.shift());
    } else {
      this.waypoints = [];
      this.targetPos.set(destX, 0, destZ);
    }
  }

  update(dt) {
    const dx = this.targetPos.x - this.position.x;
    const dz = this.targetPos.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const stepDist = this.speed * dt;

    if (dist <= stepDist || dist < 0.15) {
      this.position.copy(this.targetPos);
      if (this.waypoints.length > 0) {
        this.targetPos.copy(this.waypoints.shift());
      }
    } else {
      this.position.x += (dx / dist) * stepDist;
      this.position.z += (dz / dist) * stepDist;
    }

    if (this.type === 'STOCKER') {
      this.updateStocker();
    } else if (this.type === 'FARMER') {
      this.updateFarmer();
    }
  }

  updateStocker() {
    // Deliver
    if (this.stack.length > 0) {
      for (let s of STANDS) {
        if (s.unlocked && s.stock < s.capacity && this.stack.includes(s.itemId)) {
          const standTarget = new Vector3(s.pos.x, 0, s.pos.z < -6.5 ? -7.0 : -2.5);
          if (this.targetPos.distanceTo(standTarget) > 0.4 && this.waypoints.length === 0) {
            this.setDestination(standTarget.x, standTarget.z);
          }
          if (this.position.distanceTo(s.pos) < 3.0) {
            const idx = this.stack.indexOf(s.itemId);
            if (idx !== -1) {
              this.stack.splice(idx, 1);
              s.stock++;
              this.totalRestocks++;
            }
          }
          return;
        }
      }
    }

    // Fetch
    if (this.stack.length < this.capacity) {
      for (let s of STANDS) {
        if (s.unlocked && s.stock < s.capacity) {
          const patch = PATCHES.find(p => p.unlocked && p.itemId === s.itemId && p.readyCrops > 0);
          if (patch) {
            if (this.targetPos.distanceTo(patch.pos) > 0.4 && this.waypoints.length === 0) {
              this.setDestination(patch.pos.x, patch.pos.z);
            }
            if (this.position.distanceTo(patch.pos) < 2.8) {
              patch.readyCrops--;
              this.stack.push(patch.itemId);
            }
            return;
          }
          const pen = PENS.find(p => p.unlocked && p.produceId === s.itemId && p.produceStock > 0);
          if (pen) {
            if (this.targetPos.distanceTo(pen.pickupPos) > 0.4 && this.waypoints.length === 0) {
              this.setDestination(pen.pickupPos.x, pen.pickupPos.z);
            }
            if (this.position.distanceTo(pen.pickupPos) < 2.8) {
              pen.produceStock--;
              this.stack.push(pen.produceId);
            }
            return;
          }
        }
      }
    }
  }

  updateFarmer() {
    // Deliver
    if (this.stack.length > 0) {
      if (this.stack.includes('WHEAT')) {
        const hungryPen = PENS.find(p => p.unlocked && p.feedStock < p.feedCapacity);
        if (hungryPen) {
          if (this.targetPos.distanceTo(hungryPen.feederPos) > 0.4 && this.waypoints.length === 0) {
            this.setDestination(hungryPen.feederPos.x, hungryPen.feederPos.z);
          }
          if (this.position.distanceTo(hungryPen.feederPos) < 2.5) {
            const idx = this.stack.indexOf('WHEAT');
            this.stack.splice(idx, 1);
            hungryPen.feedStock++;
          }
          return;
        }

        const wheatStand = STANDS.find(s => s.unlocked && s.itemId === 'WHEAT' && s.stock < s.capacity);
        if (wheatStand) {
          const standTarget = new Vector3(wheatStand.pos.x, 0, -2.5);
          if (this.targetPos.distanceTo(standTarget) > 0.4 && this.waypoints.length === 0) {
            this.setDestination(standTarget.x, standTarget.z);
          }
          if (this.position.distanceTo(wheatStand.pos) < 3.0) {
            const idx = this.stack.indexOf('WHEAT');
            this.stack.splice(idx, 1);
            wheatStand.stock++;
            this.totalRestocks++;
          }
          return;
        }
      }
    }

    // Fetch
    if (this.stack.length < this.capacity) {
      const wheatPatch = PATCHES.find(p => p.unlocked && p.itemId === 'WHEAT' && p.readyCrops > 0);
      const wheatStand = STANDS.find(s => s.unlocked && s.itemId === 'WHEAT' && s.stock < s.capacity);
      const animalNeedsFeed = PENS.some(p => p.unlocked && p.feedStock < p.feedCapacity);
      if (wheatPatch && (wheatStand || animalNeedsFeed)) {
        if (this.targetPos.distanceTo(wheatPatch.pos) > 0.4 && this.waypoints.length === 0) {
          this.setDestination(wheatPatch.pos.x, wheatPatch.pos.z);
        }
        if (this.position.distanceTo(wheatPatch.pos) < 2.8) {
          wheatPatch.readyCrops--;
          this.stack.push('WHEAT');
        }
        return;
      }
    }
  }
}

const stocker = new SimStaffWorker('STOCKER', new Vector3(-5.0, 0, 0.5));
const farmer = new SimStaffWorker('FARMER', new Vector3(0.0, 0, 4.5));

for (let step = 0; step < 600; step++) {
  stocker.update(0.05);
  farmer.update(0.05);
}

console.log(`Stocker restocked: ${stocker.totalRestocks} items`);
console.log(`Farmer restocked: ${farmer.totalRestocks} items`);
console.log(`Final Shelf Stocks: Tomato=${STANDS[0].stock}/${STANDS[0].capacity}, Egg=${STANDS[1].stock}/${STANDS[1].capacity}, Wheat=${STANDS[2].stock}/${STANDS[2].capacity}`);

if (STANDS[0].stock > 0 && STANDS[1].stock > 0 && STANDS[2].stock > 0) {
  console.log("=== TEST RESULT: PASS (Stocker & Farm Hand fully autonomous & restocking!) ===");
} else {
  console.log("=== TEST RESULT: FAIL ===");
}