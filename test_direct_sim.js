// Direct Navigation Worker Simulation Test
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
  { id: 'stand_wheat', itemId: 'WHEAT', pos: new Vector3(2.5, 0, -5.0), stock: 0, capacity: 6, unlocked: true },
  { id: 'stand_egg', itemId: 'EGG', pos: new Vector3(-6.5, 0, -5.0), stock: 0, capacity: 6, unlocked: true }
];

const PATCHES = [
  { id: 'plot_tomato', itemId: 'TOMATO', pos: new Vector3(-5.0, 0, 5.5), readyCrops: 10, unlocked: true },
  { id: 'plot_wheat', itemId: 'WHEAT', pos: new Vector3(3.5, 0, 7.0), readyCrops: 10, unlocked: true }
];

const PENS = [
  { id: 'pen_chicken', produceId: 'EGG', pickupPos: new Vector3(-11.5, 0, 6.5), feederPos: new Vector3(-11.5, 0, 5.0), produceStock: 10, feedStock: 0, feedCapacity: 6, unlocked: true }
];

class DirectWorker {
  constructor(type, idlePos) {
    this.type = type;
    this.position = idlePos.clone();
    this.targetPos = idlePos.clone();
    this.idlePos = idlePos.clone();
    this.stack = [];
    this.capacity = 3;
    this.speed = 5.4;
    this.totalRestocks = 0;
  }

  setTarget(x, z) {
    this.targetPos.set(x, 0, z);
  }

  update(dt) {
    const dx = this.targetPos.x - this.position.x;
    const dz = this.targetPos.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const stepDist = this.speed * dt;

    if (dist <= stepDist || dist < 0.1) {
      this.position.copy(this.targetPos);
    } else {
      this.position.x += (dx / dist) * stepDist;
      this.position.z += (dz / dist) * stepDist;
    }

    if (this.type === 'STOCKER') this.updateStocker();
    else if (this.type === 'FARMER') this.updateFarmer();
    else if (this.type === 'HARVESTER') this.updateHarvester();
  }

  updateStocker() {
    // Deliver
    if (this.stack.length > 0) {
      for (let s of STANDS) {
        if (s.unlocked && s.stock < s.capacity && this.stack.includes(s.itemId)) {
          this.setTarget(s.pos.x, s.pos.z + 1.2);
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
            this.setTarget(patch.pos.x, patch.pos.z);
            if (this.position.distanceTo(patch.pos) < 2.8) {
              patch.readyCrops--;
              this.stack.push(patch.itemId);
            }
            return;
          }
          const pen = PENS.find(p => p.unlocked && p.produceId === s.itemId && p.produceStock > 0);
          if (pen) {
            this.setTarget(pen.pickupPos.x, pen.pickupPos.z);
            if (this.position.distanceTo(pen.pickupPos) < 2.8) {
              pen.produceStock--;
              this.stack.push(pen.produceId);
            }
            return;
          }
        }
      }
    }

    this.setTarget(this.idlePos.x, this.idlePos.z);
  }

  updateFarmer() {
    // Deliver
    if (this.stack.length > 0) {
      if (this.stack.includes('WHEAT')) {
        const hungryPen = PENS.find(p => p.unlocked && p.feedStock < p.feedCapacity);
        if (hungryPen) {
          this.setTarget(hungryPen.feederPos.x, hungryPen.feederPos.z);
          if (this.position.distanceTo(hungryPen.feederPos) < 2.8) {
            const idx = this.stack.indexOf('WHEAT');
            this.stack.splice(idx, 1);
            hungryPen.feedStock++;
          }
          return;
        }

        const wheatStand = STANDS.find(s => s.unlocked && s.itemId === 'WHEAT' && s.stock < s.capacity);
        if (wheatStand) {
          this.setTarget(wheatStand.pos.x, wheatStand.pos.z + 1.2);
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
        this.setTarget(wheatPatch.pos.x, wheatPatch.pos.z);
        if (this.position.distanceTo(wheatPatch.pos) < 2.8) {
          wheatPatch.readyCrops--;
          this.stack.push('WHEAT');
        }
        return;
      }
    }

    this.setTarget(this.idlePos.x, this.idlePos.z);
  }

  updateHarvester() {
    if (this.stack.length > 0) {
      for (let s of STANDS) {
        if (s.unlocked && s.stock < s.capacity && this.stack.includes(s.itemId)) {
          this.setTarget(s.pos.x, s.pos.z + 1.2);
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

    if (this.stack.length < this.capacity) {
      for (let patch of PATCHES) {
        if (patch.unlocked && patch.readyCrops > 0) {
          this.setTarget(patch.pos.x, patch.pos.z);
          if (this.position.distanceTo(patch.pos) < 2.8) {
            patch.readyCrops--;
            this.stack.push(patch.itemId);
          }
          return;
        }
      }
    }

    this.setTarget(this.idlePos.x, this.idlePos.z);
  }
}

const stocker = new DirectWorker('STOCKER', new Vector3(-5.0, 0, 0.5));
const farmer = new DirectWorker('FARMER', new Vector3(0.0, 0, 4.5));
const harvester = new DirectWorker('HARVESTER', new Vector3(3.5, 0, 4.5));

for (let step = 0; step < 400; step++) {
  stocker.update(0.05);
  farmer.update(0.05);
  harvester.update(0.05);
}

console.log(`Stocker Restocked: ${stocker.totalRestocks}`);
console.log(`Farmer Restocked: ${farmer.totalRestocks}`);
console.log(`Harvester Restocked: ${harvester.totalRestocks}`);
console.log(`Shelf Stocks: Tomato=${STANDS[0].stock}/${STANDS[0].capacity}, Wheat=${STANDS[1].stock}/${STANDS[1].capacity}, Egg=${STANDS[2].stock}/${STANDS[2].capacity}`);