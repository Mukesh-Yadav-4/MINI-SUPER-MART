// Autonomous Staff Workers: Direct Navigation Engine, Master Stocker & Farm Hand
function addSketchLines(mesh, color = 0x111111) {
  if (!mesh || !mesh.geometry) return;
  try {
    const edges = new THREE.EdgesGeometry(mesh.geometry, 28);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: color, linewidth: 2 }));
    mesh.add(line);
  } catch (e) {}
}

class HelperWorker {
  constructor(scene, type, initialPos) {
    this.scene = scene;
    this.type = type; // 'STOCKER' | 'FARMER' | 'HARVESTER'
    this.position = new THREE.Vector3(initialPos.x, 0, initialPos.z);
    this.targetPos = new THREE.Vector3(initialPos.x, 0, initialPos.z);
    this.idlePos = new THREE.Vector3(initialPos.x, 0, initialPos.z);
    this.baseSpeed = 2.8;
    this.speed = 2.8;
    this.baseCapacity = 3;
    this.capacity = 3;
    this.stack = [];
    this.unlocked = false;
    this.currentRotation = 0;
    this.walkCycle = 0;
    this.deadlockTimer = 0;
    this.isDelivering = false;
    this.w1_task = null;
    this.w2_task = null;
    this.farmer_task = null;
    this.wheatRefillActive = false;
    this.chickenFeedRefillActive = false;

    this.createMesh();
  }

  createMesh() {
    this.mesh = new THREE.Group();

    let shirtColor = 0x43a047; // Stocker: Emerald Green
    let capColor = 0x2e7d32;

    if (this.type === 'FARMER') {
      shirtColor = 0x1e88e5; // Farm Hand: Denim Blue
      capColor = 0xffb74d;   // Straw Hat Yellow
    } else if (this.type === 'HARVESTER') {
      shirtColor = 0xff9800; // Harvester: Vibrant Orange
      capColor = 0xe65100;
    }

    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffd180 });
    const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    const capMat = new THREE.MeshLambertMaterial({ color: capColor });
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x37474f });
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 });

    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.44, 14), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.mesh.add(shadow);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.8, 0.4), shirtMat);
    torso.position.y = 0.95;
    torso.castShadow = true;
    addSketchLines(torso, 0x111111);
    this.mesh.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), skinMat);
    head.position.y = 1.6;
    head.castShadow = true;
    addSketchLines(head, 0x111111);
    this.mesh.add(head);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.15, 12), capMat);
    cap.position.y = 1.78;
    addSketchLines(cap, 0x111111);
    this.mesh.add(cap);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.3), capMat);
    visor.position.set(0, 1.72, 0.3);
    addSketchLines(visor, 0x111111);
    this.mesh.add(visor);

    const legGeo = new THREE.BoxGeometry(0.22, 0.6, 0.22);
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.18, 0.4, 0);
    this.leftLeg.castShadow = true;
    addSketchLines(this.leftLeg, 0x111111);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.18, 0.4, 0);
    this.rightLeg.castShadow = true;
    addSketchLines(this.rightLeg, 0x111111);
    this.mesh.add(this.rightLeg);

    this.stackAnchor = new THREE.Group();
    this.stackAnchor.position.set(0, 1.1, -0.3);
    this.mesh.add(this.stackAnchor);

    this.mesh.visible = false;
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  setUnlocked(unlocked) {
    this.unlocked = unlocked;
    this.mesh.visible = unlocked;
  }

  refreshStats() {
    const lvl = (CONFIG.UPGRADES.staff && CONFIG.UPGRADES.staff.currentLevel) || 0;
    const mult = (CONFIG.UPGRADES.staff && CONFIG.UPGRADES.staff.levels[lvl]) || 1.0;
    const capArray = (CONFIG.UPGRADES.staff && CONFIG.UPGRADES.staff.capacityLevels) || [3, 4, 5, 6, 7];
    this.speed = this.baseSpeed * mult * (sdk.boostActive ? 1.4 : 1.0);
    this.capacity = capArray[lvl] || 3;
  }

  addItem(itemId) {
    if (this.stack.length >= this.capacity) return false;
    const mesh = Player.createItemMesh(itemId);
    mesh.position.set(0, this.stack.length * 0.32, 0);
    this.stackAnchor.add(mesh);
    this.stack.push({ type: itemId, mesh: mesh });
    return true;
  }

  popItem(preferredType = null) {
    if (this.stack.length === 0) return null;
    let idx = -1;
    if (preferredType) {
      for (let i = this.stack.length - 1; i >= 0; i--) {
        if (this.stack[i].type === preferredType) {
          idx = i;
          break;
        }
      }
    } else {
      idx = this.stack.length - 1;
    }

    if (idx === -1) return null;
    const removed = this.stack.splice(idx, 1)[0];
    this.stackAnchor.remove(removed.mesh);

    this.stack.forEach((item, i) => {
      item.mesh.position.y = i * 0.32;
    });

    return removed.type;
  }

  setTarget(x, z) {
    this.targetPos.set(x, 0, z);
  }

  update(dt, patches, pens, machines, stands, dustbins = []) {
    if (!this.unlocked) return;

    this.refreshStats();

    // Direct Smooth Movement
    const dx = this.targetPos.x - this.position.x;
    const dz = this.targetPos.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const stepDist = this.speed * dt;

    if (dist <= stepDist || dist < 0.1) {
      this.position.copy(this.targetPos);
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
    } else {
      const dirX = dx / dist;
      const dirZ = dz / dist;
      this.position.x += dirX * stepDist;
      this.position.z += dirZ * stepDist;

      const targetRot = Math.atan2(dirX, dirZ);
      let angleDiff = targetRot - this.currentRotation;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.currentRotation += angleDiff * Math.min(1.0, 14 * dt);

      this.walkCycle += dt * 5.5;
      this.leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.5;
      this.rightLeg.rotation.x = -Math.sin(this.walkCycle) * 0.5;
    }

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.currentRotation;

    if (this.type === 'STOCKER') {
      this.updateStockerAI(dt, patches, pens, machines, stands, dustbins);
    } else if (this.type === 'FARMER') {
      this.updateFarmerAI(dt, patches, pens, machines, stands, dustbins);
    } else {
      this.updateHarvesterAI(dt, patches, pens, machines, stands, dustbins);
    }
  }

  // Worker 1 (Stocker AI): Smooth Active Priority Pipeline (Tomato Shelf -> Tomato Mixer -> Juice Shelf -> Bread Shelf)
  updateStockerAI(dt, patches, pens, machines, stands, dustbins) {
    const standTomato = stands.find(s => s.config.itemId === 'TOMATO');
    const juicer = machines.find(m => m.config.type === 'JUICER');
    const standJuice = stands.find(s => s.config.itemId === 'JUICE');
    const bakery = machines.find(m => m.config.type === 'BAKERY');
    const standBread = stands.find(s => s.config.itemId === 'BREAD');

    // Batching delivery state toggle
    if (this.stack.length >= this.capacity) {
      this.isDelivering = true;
    } else if (this.stack.length === 0) {
      this.isDelivering = false;
    }

    // 1. Priority 1: If Tomato Shelf is empty (0), top priority emergency refill
    if (standTomato && standTomato.unlocked && standTomato.stock.length === 0) {
      this.w1_task = 'TOMATO_SHELF';
    }
    if (this.w1_task === 'TOMATO_SHELF' && standTomato && standTomato.isFull()) {
      this.w1_task = null;
    }

    // 2. Priority 2: Once Tomato Shelf is full, fill Tomato Mixer if unlocked & needs ingredients
    if (!this.w1_task && juicer && juicer.unlocked && !juicer.isInputFull()) {
      this.w1_task = 'TOMATO_MIXER';
    }
    if (this.w1_task === 'TOMATO_MIXER' && juicer && juicer.isInputFull()) {
      this.w1_task = null;
    }

    // 3. Priority 3: Once Mixer is full, restock Canned Ketchup/Juice Shelf if unlocked & needs stock
    if (!this.w1_task && standJuice && standJuice.unlocked && !standJuice.isFull() && juicer && juicer.outputStock > 0) {
      this.w1_task = 'JUICE_SHELF';
    }
    if (this.w1_task === 'JUICE_SHELF' && standJuice && standJuice.isFull()) {
      this.w1_task = null;
    }

    // 4. Priority 4: Restock Warm Bread Shelf if bakery has ready bread
    if (!this.w1_task && standBread && standBread.unlocked && !standBread.isFull() && bakery && bakery.outputStock > 0) {
      this.w1_task = 'BREAD_SHELF';
    }
    if (this.w1_task === 'BREAD_SHELF' && standBread && standBread.isFull()) {
      this.w1_task = null;
    }

    // 5. Active Maintenance: Keep Tomato Shelf stocked if mixer & juice are full or locked
    if (!this.w1_task && standTomato && standTomato.unlocked && !standTomato.isFull()) {
      this.w1_task = 'TOMATO_SHELF';
    }

    // Emergency Interrupt: Tomato Shelf reaching 0 ALWAYS interrupts lower priorities
    if (standTomato && standTomato.unlocked && standTomato.stock.length === 0) {
      this.w1_task = 'TOMATO_SHELF';
    }

    // Execute Active Task
    if (this.w1_task === 'TOMATO_SHELF' && standTomato) {
      // Deliver full batch
      if (this.isDelivering && this.stack.some(i => i.type === 'TOMATO')) {
        this.setTarget(standTomato.pos.x, standTomato.pos.z + 1.2);
        if (this.position.distanceTo(standTomato.pos) < 3.2) {
          const item = this.popItem('TOMATO');
          if (item) standTomato.addItem();
          if (standTomato.isFull()) {
            this.w1_task = null;
          }
        }
        return;
      }
      // Gather up to max carry limit
      const tomatoPatch = patches.find(p => p.unlocked && p.config.itemId === 'TOMATO' && p.hasReadyCrops());
      if (tomatoPatch) {
        this.setTarget(tomatoPatch.config.pos.x, tomatoPatch.config.pos.z);
        if (this.position.distanceTo(new THREE.Vector3(tomatoPatch.config.pos.x, 0, tomatoPatch.config.pos.z)) < 3.0) {
          const t = tomatoPatch.harvestOne();
          if (t) this.addItem(t);
        }
        return;
      }
      if (this.stack.some(i => i.type === 'TOMATO')) {
        this.isDelivering = true;
        return;
      }
    } else if (this.w1_task === 'TOMATO_MIXER' && juicer) {
      // Deliver full batch to mixer
      if (this.isDelivering && this.stack.some(i => i.type === 'TOMATO')) {
        const inputX = juicer.config.pos.x - 0.7;
        const inputZ = juicer.config.pos.z + 0.9;
        this.setTarget(inputX, inputZ);
        if (this.position.distanceTo(new THREE.Vector3(inputX, 0, inputZ)) < 3.2 || this.position.distanceTo(juicer.config.pos) < 3.2) {
          const item = this.popItem('TOMATO');
          if (item) juicer.addIngredient(item);
          if (juicer.isInputFull()) {
            this.w1_task = null;
          }
        }
        return;
      }
      // Gather up to max carry limit
      const tomatoPatch = patches.find(p => p.unlocked && p.config.itemId === 'TOMATO' && p.hasReadyCrops());
      if (tomatoPatch) {
        this.setTarget(tomatoPatch.config.pos.x, tomatoPatch.config.pos.z);
        if (this.position.distanceTo(new THREE.Vector3(tomatoPatch.config.pos.x, 0, tomatoPatch.config.pos.z)) < 3.0) {
          const t = tomatoPatch.harvestOne();
          if (t) this.addItem(t);
        }
        return;
      }
      if (this.stack.some(i => i.type === 'TOMATO')) {
        this.isDelivering = true;
        return;
      }
    } else if (this.w1_task === 'JUICE_SHELF' && standJuice) {
      // Deliver full batch of juice to shelf
      if (this.isDelivering && this.stack.some(i => i.type === 'JUICE')) {
        this.setTarget(standJuice.pos.x, standJuice.pos.z + 1.2);
        if (this.position.distanceTo(standJuice.pos) < 3.5 || Math.hypot(this.position.x - standJuice.pos.x, this.position.z - (standJuice.pos.z + 1.2)) < 2.0) {
          const item = this.popItem('JUICE');
          if (item) standJuice.addItem();
          if (standJuice.isFull()) {
            this.w1_task = null;
          }
        }
        return;
      }
      // Gather juice from juicer output tray
      if (juicer && juicer.outputStock > 0) {
        this.setTarget(juicer.group.position.x, juicer.group.position.z + 0.8);
        if (this.position.distanceTo(juicer.group.position) < 3.0) {
          const out = juicer.harvestOutput();
          if (out) this.addItem(out);
        }
        return;
      }
      if (this.stack.some(i => i.type === 'JUICE')) {
        this.isDelivering = true;
        return;
      }
    } else if (this.w1_task === 'BREAD_SHELF' && standBread) {
      // Deliver bread to shelf
      if (this.isDelivering && this.stack.some(i => i.type === 'BREAD')) {
        this.setTarget(standBread.pos.x, standBread.pos.z + 1.2);
        if (this.position.distanceTo(standBread.pos) < 3.2) {
          const bread = this.popItem('BREAD');
          if (bread) standBread.addItem();
          if (standBread.isFull()) {
            this.w1_task = null;
          }
        }
        return;
      }
      if (bakery && bakery.outputStock > 0) {
        this.setTarget(bakery.group.position.x, bakery.group.position.z + 0.8);
        if (this.position.distanceTo(bakery.group.position) < 3.0) {
          const out = bakery.harvestOutput();
          if (out) this.addItem(out);
        }
        return;
      }
      if (this.stack.some(i => i.type === 'BREAD')) {
        this.isDelivering = true;
        return;
      }
    }

    // Overflow discard if holding unneeded items
    if (this.stack.length > 0 && dustbins.length > 0) {
      const bin = dustbins[0];
      this.setTarget(bin.pos.x, bin.pos.z);
      if (this.position.distanceTo(bin.pos) < 2.5) {
        this.popItem();
      }
      return;
    }

    // Return to Idle Station
    this.setTarget(this.idlePos.x, this.idlePos.z);
  }

  // Farmer (Farm Hand AI): Smooth Active Priority Pipeline (Chicken Feed Hysteresis [0->Max] -> Wheat Shelf Hysteresis [0->Max] -> Cow Feed -> Milk Shelf -> Corn -> Bakery)
  updateFarmerAI(dt, patches, pens, machines, stands, dustbins) {
    const standWheat = stands.find(s => s.config.itemId === 'WHEAT');
    const chickenPen = pens.find(p => p.config.type === 'CHICKEN');
    const cowPen = pens.find(p => p.config.type === 'COW');
    const standMilk = stands.find(s => s.config.itemId === 'MILK');
    const standCorn = stands.find(s => s.config.itemId === 'CARROT');
    const bakery = machines.find(m => m.config.type === 'BAKERY');

    // Batching delivery state toggle
    if (this.stack.length >= this.capacity) {
      this.isDelivering = true;
    } else if (this.stack.length === 0) {
      this.isDelivering = false;
    }

    // 1. CHICKEN COOP HYSTERESIS (Refill only when reaches 0, fill until max):
    if (chickenPen && chickenPen.unlocked) {
      if (chickenPen.feedStock === 0) {
        this.chickenFeedRefillActive = true;
      }
      if (chickenPen.feedStock >= chickenPen.feedCapacity) {
        this.chickenFeedRefillActive = false;
        if (this.farmer_task === 'CHICKEN_FEED') {
          this.farmer_task = null;
        }
      }
    }

    // 2. WHEAT SHELF HYSTERESIS (Refill only when reaches 0, fill until max):
    if (standWheat && standWheat.unlocked) {
      if (standWheat.stock.length === 0) {
        this.wheatRefillActive = true;
      }
      if (standWheat.isFull()) {
        this.wheatRefillActive = false;
        if (this.farmer_task === 'WHEAT_SHELF') {
          this.farmer_task = null;
        }
      }
    }

    // Priority Task Selection:
    // A. Chicken Coop refilling takes top priority when chickenFeedRefillActive is true (until 100% full)
    if (this.chickenFeedRefillActive && chickenPen && chickenPen.unlocked && chickenPen.feedStock < chickenPen.feedCapacity) {
      this.farmer_task = 'CHICKEN_FEED';
    }

    // B. Wheat Shelf refilling when wheatRefillActive is true (until 100% full)
    if (!this.farmer_task && this.wheatRefillActive && standWheat && standWheat.unlocked && !standWheat.isFull()) {
      this.farmer_task = 'WHEAT_SHELF';
    }

    // C. Emergency Interrupt for Empty Milk Shelf
    if (!this.farmer_task && standMilk && standMilk.unlocked && standMilk.stock.length === 0 && cowPen && (cowPen.produceStock > 0 || this.stack.some(i => i.type === 'MILK'))) {
      this.farmer_task = 'MILK_SHELF';
    }

    // D. Standard Priority Queue when idle
    if (!this.farmer_task) {
      if (cowPen && cowPen.unlocked && cowPen.feedStock < cowPen.feedCapacity) {
        this.farmer_task = 'COW_FEED';
      } else if (standMilk && standMilk.unlocked && !standMilk.isFull() && cowPen && (cowPen.produceStock > 0 || this.stack.some(i => i.type === 'MILK'))) {
        this.farmer_task = 'MILK_SHELF';
      } else if (standCorn && standCorn.unlocked && !standCorn.isFull()) {
        this.farmer_task = 'CORN_SHELF';
      } else if (bakery && bakery.unlocked && !bakery.isInputFull()) {
        this.farmer_task = 'BAKERY_FEED';
      }
    }

    // Execute Active Task
    if (this.farmer_task === 'COW_FEED' && cowPen) {
      // Deliver full batch of wheat to cow feeder
      if (this.isDelivering && this.stack.some(i => i.type === 'WHEAT')) {
        this.setTarget(cowPen.feederPos.x, cowPen.feederPos.z);
        if (this.position.distanceTo(cowPen.feederPos) < 3.0) {
          const wheat = this.popItem('WHEAT');
          if (wheat) cowPen.addFeed(1);
          if (cowPen.feedStock >= cowPen.feedCapacity || !this.stack.some(i => i.type === 'WHEAT')) {
            this.farmer_task = null;
            this.isDelivering = false;
          }
        }
        return;
      }
      // Gather wheat up to max carry limit
      const wheatPatch = patches.find(p => p.unlocked && p.config.itemId === 'WHEAT' && p.hasReadyCrops());
      if (wheatPatch) {
        this.setTarget(wheatPatch.config.pos.x, wheatPatch.config.pos.z);
        if (this.position.distanceTo(new THREE.Vector3(wheatPatch.config.pos.x, 0, wheatPatch.config.pos.z)) < 3.0) {
          const w = wheatPatch.harvestOne();
          if (w) this.addItem(w);
        }
        return;
      }
      if (this.stack.some(i => i.type === 'WHEAT')) {
        this.isDelivering = true;
        return;
      }
    } else if (this.farmer_task === 'CHICKEN_FEED' && chickenPen) {
      // Deliver full batch of wheat to chicken feeder
      if (this.isDelivering && this.stack.some(i => i.type === 'WHEAT')) {
        this.setTarget(chickenPen.feederPos.x, chickenPen.feederPos.z);
        if (this.position.distanceTo(chickenPen.feederPos) < 3.0) {
          const wheat = this.popItem('WHEAT');
          if (wheat) chickenPen.addFeed(1);
          if (chickenPen.feedStock >= chickenPen.feedCapacity || !this.stack.some(i => i.type === 'WHEAT')) {
            this.farmer_task = null;
            this.isDelivering = false;
          }
        }
        return;
      }
      // Gather wheat up to max carry limit
      const wheatPatch = patches.find(p => p.unlocked && p.config.itemId === 'WHEAT' && p.hasReadyCrops());
      if (wheatPatch) {
        this.setTarget(wheatPatch.config.pos.x, wheatPatch.config.pos.z);
        if (this.position.distanceTo(new THREE.Vector3(wheatPatch.config.pos.x, 0, wheatPatch.config.pos.z)) < 3.0) {
          const w = wheatPatch.harvestOne();
          if (w) this.addItem(w);
        }
        return;
      }
      if (this.stack.some(i => i.type === 'WHEAT')) {
        this.isDelivering = true;
        return;
      }
    } else if (this.farmer_task === 'MILK_SHELF' && standMilk) {
      // Deliver full batch of milk to refrigerator
      if (this.isDelivering && this.stack.some(i => i.type === 'MILK')) {
        this.setTarget(standMilk.pos.x, standMilk.pos.z + 1.2);
        if (this.position.distanceTo(standMilk.pos) < 3.5 || Math.hypot(this.position.x - standMilk.pos.x, this.position.z - (standMilk.pos.z + 1.2)) < 2.0) {
          const milk = this.popItem('MILK');
          if (milk) standMilk.addItem();
          if (standMilk.isFull() || !this.stack.some(i => i.type === 'MILK')) {
            this.farmer_task = null;
            this.isDelivering = false;
          }
        }
        return;
      }
      // Gather milk from cow pasture pickup point
      if (cowPen && cowPen.produceStock > 0 && this.stack.length < this.capacity) {
        this.setTarget(cowPen.pickupPos.x, cowPen.pickupPos.z);
        if (this.position.distanceTo(cowPen.pickupPos) < 3.0) {
          const milk = cowPen.harvestProduce();
          if (milk) this.addItem(milk);
          if (this.stack.length >= this.capacity || cowPen.produceStock === 0) {
            this.isDelivering = true;
          }
        }
        return;
      }
      if (this.stack.some(i => i.type === 'MILK')) {
        this.isDelivering = true;
        return;
      }
    } else if (this.farmer_task === 'WHEAT_SHELF' && standWheat) {
      // Deliver full batch of wheat to wheat shelf
      if (this.isDelivering && this.stack.some(i => i.type === 'WHEAT')) {
        this.setTarget(standWheat.pos.x, standWheat.pos.z + 1.2);
        if (this.position.distanceTo(standWheat.pos) < 3.2) {
          const wheat = this.popItem('WHEAT');
          if (wheat) standWheat.addItem();
          if (standWheat.isFull() || !this.stack.some(i => i.type === 'WHEAT')) {
            this.farmer_task = null;
            this.isDelivering = false;
          }
        }
        return;
      }
      // Gather wheat up to max carry limit
      const wheatPatch = patches.find(p => p.unlocked && p.config.itemId === 'WHEAT' && p.hasReadyCrops());
      if (wheatPatch) {
        this.setTarget(wheatPatch.config.pos.x, wheatPatch.config.pos.z);
        if (this.position.distanceTo(new THREE.Vector3(wheatPatch.config.pos.x, 0, wheatPatch.config.pos.z)) < 3.0) {
          const w = wheatPatch.harvestOne();
          if (w) this.addItem(w);
        }
        return;
      }
      if (this.stack.some(i => i.type === 'WHEAT')) {
        this.isDelivering = true;
        return;
      }
    } else if (this.farmer_task === 'CORN_SHELF' && standCorn) {
      // Deliver full batch of sweetcorn to shelf
      if (this.isDelivering && this.stack.some(i => i.type === 'CARROT')) {
        this.setTarget(standCorn.pos.x, standCorn.pos.z + 1.2);
        if (this.position.distanceTo(standCorn.pos) < 3.2) {
          const corn = this.popItem('CARROT');
          if (corn) standCorn.addItem();
          if (standCorn.isFull() || !this.stack.some(i => i.type === 'CARROT')) {
            this.farmer_task = null;
            this.isDelivering = false;
          }
        }
        return;
      }
      // Gather sweetcorn up to max carry limit
      const cornPatch = patches.find(p => p.unlocked && p.config.itemId === 'CARROT' && p.hasReadyCrops());
      if (cornPatch) {
        this.setTarget(cornPatch.config.pos.x, cornPatch.config.pos.z);
        if (this.position.distanceTo(new THREE.Vector3(cornPatch.config.pos.x, 0, cornPatch.config.pos.z)) < 3.0) {
          const c = cornPatch.harvestOne();
          if (c) this.addItem(c);
        }
        return;
      }
      if (this.stack.some(i => i.type === 'CARROT')) {
        this.isDelivering = true;
        return;
      }
    } else if (this.farmer_task === 'BAKERY_FEED' && bakery) {
      // Deliver full batch of wheat to bakery oven
      if (this.isDelivering && this.stack.some(i => i.type === 'WHEAT')) {
        const inputX = bakery.config.pos.x - 0.7;
        const inputZ = bakery.config.pos.z + 0.9;
        this.setTarget(inputX, inputZ);
        if (this.position.distanceTo(new THREE.Vector3(inputX, 0, inputZ)) < 3.2 || this.position.distanceTo(bakery.config.pos) < 3.2) {
          const wheat = this.popItem('WHEAT');
          if (wheat) bakery.addIngredient(wheat);
          if (bakery.isInputFull() || !this.stack.some(i => i.type === 'WHEAT')) {
            this.farmer_task = null;
            this.isDelivering = false;
          }
        }
        return;
      }
      // Gather wheat up to max carry limit
      const wheatPatch = patches.find(p => p.unlocked && p.config.itemId === 'WHEAT' && p.hasReadyCrops());
      if (wheatPatch) {
        this.setTarget(wheatPatch.config.pos.x, wheatPatch.config.pos.z);
        if (this.position.distanceTo(new THREE.Vector3(wheatPatch.config.pos.x, 0, wheatPatch.config.pos.z)) < 3.0) {
          const w = wheatPatch.harvestOne();
          if (w) this.addItem(w);
        }
        return;
      }
      if (this.stack.some(i => i.type === 'WHEAT')) {
        this.isDelivering = true;
        return;
      }
    }

    // Overflow discard if holding unneeded items
    if (this.stack.length > 0 && dustbins.length > 0) {
      const bin = dustbins[0];
      this.setTarget(bin.pos.x, bin.pos.z);
      if (this.position.distanceTo(bin.pos) < 2.5) {
        this.popItem();
      }
      return;
    }

    // Return to Farm Idle Station
    this.setTarget(this.idlePos.x, this.idlePos.z);
  }

  // Worker 2 (Harvester AI): Smooth Active Priority Pipeline (Egg Shelf -> Milk Shelf -> Bakery -> Bread Shelf)
  updateHarvesterAI(dt, patches, pens, machines, stands, dustbins) {
    const standEgg = stands.find(s => s.config.itemId === 'EGG');
    const standMilk = stands.find(s => s.config.itemId === 'MILK');
    const bakery = machines.find(m => m.config.type === 'BAKERY');
    const standBread = stands.find(s => s.config.itemId === 'BREAD');
    const chickenPen = pens.find(p => p.config.type === 'CHICKEN');
    const cowPen = pens.find(p => p.config.type === 'COW');

    // Batching delivery state toggle
    if (this.stack.length >= this.capacity) {
      this.isDelivering = true;
    } else if (this.stack.length === 0) {
      this.isDelivering = false;
    }

    // 1. Priority 1: Egg shelf empty (0)
    if (standEgg && standEgg.unlocked && standEgg.stock.length === 0) {
      this.w2_task = 'EGG_SHELF';
    }
    if (this.w2_task === 'EGG_SHELF' && standEgg && standEgg.isFull()) {
      this.w2_task = null;
    }

    // 2. Priority 2: Milk shelf if unlocked & needs stock
    if (!this.w2_task && standMilk && standMilk.unlocked && !standMilk.isFull() && cowPen && cowPen.produceStock > 0) {
      this.w2_task = 'MILK_SHELF';
    }
    if (this.w2_task === 'MILK_SHELF' && standMilk && standMilk.isFull()) {
      this.w2_task = null;
    }

    // 3. Priority 3: Bakery machine if unlocked & needs ingredients
    if (!this.w2_task && bakery && bakery.unlocked && !bakery.isInputFull()) {
      this.w2_task = 'BAKERY_MACHINE';
    }
    if (this.w2_task === 'BAKERY_MACHINE' && bakery && bakery.isInputFull()) {
      this.w2_task = null;
    }

    // 4. Priority 4: Bread shelf if unlocked & needs stock
    if (!this.w2_task && standBread && standBread.unlocked && !standBread.isFull() && bakery && bakery.outputStock > 0) {
      this.w2_task = 'BREAD_SHELF';
    }
    if (this.w2_task === 'BREAD_SHELF' && standBread && standBread.isFull()) {
      this.w2_task = null;
    }

    // 5. Active Maintenance: Keep Egg shelf stocked if others full or locked
    if (!this.w2_task && standEgg && standEgg.unlocked && !standEgg.isFull() && chickenPen && chickenPen.produceStock > 0) {
      this.w2_task = 'EGG_SHELF';
    }

    // Emergency Interrupt: Egg shelf at 0 ALWAYS interrupts lower priorities
    if (standEgg && standEgg.unlocked && standEgg.stock.length === 0) {
      this.w2_task = 'EGG_SHELF';
    }

    // Execute Active Task
    if (this.w2_task === 'EGG_SHELF' && standEgg) {
      // Deliver full batch of eggs to shelf
      if (this.isDelivering && this.stack.some(i => i.type === 'EGG')) {
        this.setTarget(standEgg.pos.x, standEgg.pos.z + 1.2);
        if (this.position.distanceTo(standEgg.pos) < 3.2) {
          const egg = this.popItem('EGG');
          if (egg) standEgg.addItem();
          if (standEgg.isFull()) {
            this.w2_task = null;
          }
        }
        return;
      }
      // Gather eggs up to max carry limit from chicken coop
      if (chickenPen && chickenPen.produceStock > 0) {
        this.setTarget(chickenPen.pickupPos.x, chickenPen.pickupPos.z);
        if (this.position.distanceTo(chickenPen.pickupPos) < 3.0) {
          const egg = chickenPen.harvestProduce();
          if (egg) this.addItem(egg);
        }
        return;
      }
      if (this.stack.some(i => i.type === 'EGG')) {
        this.isDelivering = true;
        return;
      }
    } else if (this.w2_task === 'MILK_SHELF' && standMilk) {
      // Deliver full batch of milk to shelf
      if (this.isDelivering && this.stack.some(i => i.type === 'MILK')) {
        this.setTarget(standMilk.pos.x, standMilk.pos.z + 1.2);
        if (this.position.distanceTo(standMilk.pos) < 3.2) {
          const milk = this.popItem('MILK');
          if (milk) standMilk.addItem();
          if (standMilk.isFull()) {
            this.w2_task = null;
          }
        }
        return;
      }
      // Gather milk up to max carry limit from cow pasture
      if (cowPen && cowPen.produceStock > 0) {
        this.setTarget(cowPen.pickupPos.x, cowPen.pickupPos.z);
        if (this.position.distanceTo(cowPen.pickupPos) < 3.0) {
          const milk = cowPen.harvestProduce();
          if (milk) this.addItem(milk);
        }
        return;
      }
      if (this.stack.some(i => i.type === 'MILK')) {
        this.isDelivering = true;
        return;
      }
    } else if (this.w2_task === 'BAKERY_MACHINE' && bakery) {
      // Deliver full batch of wheat/eggs to bakery
      const wheatOrEgg = this.stack.find(i => i.type === 'WHEAT' || i.type === 'EGG');
      if (this.isDelivering && wheatOrEgg) {
        const inputX = bakery.config.pos.x - 0.7;
        const inputZ = bakery.config.pos.z + 0.9;
        this.setTarget(inputX, inputZ);
        if (this.position.distanceTo(new THREE.Vector3(inputX, 0, inputZ)) < 3.2 || this.position.distanceTo(bakery.config.pos) < 3.2) {
          const item = this.popItem(wheatOrEgg.type);
          if (item) bakery.addIngredient(item);
          if (bakery.isInputFull()) {
            this.w2_task = null;
          }
        }
        return;
      }
      // Gather eggs if bakery has no eggs & eggs ready, else gather wheat
      const eggCountInBakery = bakery.ingredients.filter(i => i === 'EGG').length;
      if (eggCountInBakery === 0 && chickenPen && chickenPen.produceStock > 0) {
        this.setTarget(chickenPen.pickupPos.x, chickenPen.pickupPos.z);
        if (this.position.distanceTo(chickenPen.pickupPos) < 3.0) {
          const e = chickenPen.harvestProduce();
          if (e) this.addItem(e);
        }
        return;
      }
      const wheatPatch = patches.find(p => p.unlocked && p.config.itemId === 'WHEAT' && p.hasReadyCrops());
      if (wheatPatch) {
        this.setTarget(wheatPatch.config.pos.x, wheatPatch.config.pos.z);
        if (this.position.distanceTo(new THREE.Vector3(wheatPatch.config.pos.x, 0, wheatPatch.config.pos.z)) < 3.0) {
          const w = wheatPatch.harvestOne();
          if (w) this.addItem(w);
        }
        return;
      } else if (chickenPen && chickenPen.produceStock > 0) {
        this.setTarget(chickenPen.pickupPos.x, chickenPen.pickupPos.z);
        if (this.position.distanceTo(chickenPen.pickupPos) < 3.0) {
          const e = chickenPen.harvestProduce();
          if (e) this.addItem(e);
        }
        return;
      }
      if (this.stack.some(i => i.type === 'WHEAT' || i.type === 'EGG')) {
        this.isDelivering = true;
        return;
      }
    } else if (this.w2_task === 'BREAD_SHELF' && standBread) {
      // Deliver full batch of bread to shelf
      if (this.isDelivering && this.stack.some(i => i.type === 'BREAD')) {
        this.setTarget(standBread.pos.x, standBread.pos.z + 1.2);
        if (this.position.distanceTo(standBread.pos) < 3.2) {
          const bread = this.popItem('BREAD');
          if (bread) standBread.addItem();
          if (standBread.isFull()) {
            this.w2_task = null;
          }
        }
        return;
      }
      // Gather bread up to max carry limit from bakery output tray
      if (bakery && bakery.outputStock > 0) {
        this.setTarget(bakery.group.position.x, bakery.group.position.z + 0.8);
        if (this.position.distanceTo(bakery.group.position) < 3.0) {
          const out = bakery.harvestOutput();
          if (out) this.addItem(out);
        }
        return;
      }
      if (this.stack.some(i => i.type === 'BREAD')) {
        this.isDelivering = true;
        return;
      }
    }

    // Overflow discard if holding unneeded items
    if (this.stack.length > 0 && dustbins.length > 0) {
      const bin = dustbins[0];
      this.setTarget(bin.pos.x, bin.pos.z);
      if (this.position.distanceTo(bin.pos) < 2.5) {
        this.popItem();
      }
      return;
    }

    // Return to Idle Station
    this.setTarget(this.idlePos.x, this.idlePos.z);
  }
}

// Purple Uniform Cashier: Stands on Tomato Farm Side Facing North
class HelperCashier {
  constructor(scene, pos = { x: -6.5, z: 2.35 }) {
    this.scene = scene;
    this.pos = new THREE.Vector3(pos.x, 0, pos.z);
    this.unlocked = false;

    this.createMesh();
  }

  createMesh() {
    this.mesh = new THREE.Group();
    this.mesh.position.set(this.pos.x, 0, this.pos.z);

    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffd180 });
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0xab47bc });
    const capMat = new THREE.MeshLambertMaterial({ color: 0x8e24aa });

    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 });
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.44, 14), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.mesh.add(shadow);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.35), shirtMat);
    torso.position.y = 0.95;
    torso.castShadow = true;
    addSketchLines(torso, 0x111111);
    this.mesh.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), skinMat);
    head.position.y = 1.6;
    head.castShadow = true;
    addSketchLines(head, 0x111111);
    this.mesh.add(head);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.15, 12), capMat);
    cap.position.y = 1.78;
    addSketchLines(cap, 0x111111);
    this.mesh.add(cap);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.3), capMat);
    visor.position.set(0, 1.72, 0.3);
    addSketchLines(visor, 0x111111);
    this.mesh.add(visor);

    this.mesh.visible = false;
    this.scene.add(this.mesh);
  }

  setUnlocked(unlocked) {
    this.unlocked = unlocked;
    this.mesh.visible = unlocked;
  }
}