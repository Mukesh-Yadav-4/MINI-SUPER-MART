// Autonomous Staff Workers: Clean Store Corridor Navigation Engine
function addSketchLines(mesh, color = 0x111111) {
  if (!mesh || !mesh.geometry) return;
  try {
    const edges = new THREE.EdgesGeometry(mesh.geometry, 28);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: color, linewidth: 2 }));
    mesh.add(line);
  } catch (e) {}
}

// Clean Corridor Pathfinding: Guarantees workers always walk through doors and open aisles
function getStaffCorridorPath(start, dest) {
  const waypoints = [];
  const startX = start.x, startZ = start.z;
  const destX = dest.x, destZ = dest.z;

  // Immediate short-distance path
  if (Math.hypot(startX - destX, startZ - destZ) < 0.6) {
    return [new THREE.Vector3(destX, 0, destZ)];
  }

  const isStartFarm = (startZ > 2.2);
  const isDestFarm = (destZ > 2.2);

  // Doorway central passage between Farm & Mart (wide threshold at x = 0.0)
  const DOORWAY_X = 0.0;
  const DOORWAY_FARM_Z = 4.2;
  const DOORWAY_MART_Z = 1.5;
  const CENTRAL_HIGHWAY_Z = 0.5;

  // 1. Moving from Farm (South) to Market (North)
  if (isStartFarm && !isDestFarm) {
    // Walk on Farm Avenue to central doorway
    if (Math.abs(startX - DOORWAY_X) > 0.8) {
      waypoints.push(new THREE.Vector3(startX, 0, DOORWAY_FARM_Z));
      waypoints.push(new THREE.Vector3(DOORWAY_X, 0, DOORWAY_FARM_Z));
    }
    // Pass cleanly through central doorway into store
    waypoints.push(new THREE.Vector3(DOORWAY_X, 0, DOORWAY_MART_Z));
    waypoints.push(new THREE.Vector3(DOORWAY_X, 0, CENTRAL_HIGHWAY_Z));

    // Route within store to destination
    if (destZ < -8.0) {
      // Row 2 Shelves (North Wall): Route via vertical artery to North corridor (z = -11.0)
      const arteryX = destX < 5.0 ? 2.0 : 7.5;
      waypoints.push(new THREE.Vector3(arteryX, 0, CENTRAL_HIGHWAY_Z));
      waypoints.push(new THREE.Vector3(arteryX, 0, -11.0));
      waypoints.push(new THREE.Vector3(destX, 0, -11.0));
    } else if (destZ < -2.5) {
      // Row 1 Shelves (Middle Row): Route via vertical artery to Row 1 corridor (z = -5.2)
      const arteryX = destX < 2.0 ? -3.0 : (destX < 8.0 ? 2.0 : 7.5);
      waypoints.push(new THREE.Vector3(arteryX, 0, CENTRAL_HIGHWAY_Z));
      waypoints.push(new THREE.Vector3(arteryX, 0, -5.2));
      waypoints.push(new THREE.Vector3(destX, 0, -5.2));
    } else {
      // Processing Machines (z ≈ -0.8): Travel along Central Highway directly in front of machine
      waypoints.push(new THREE.Vector3(destX, 0, CENTRAL_HIGHWAY_Z));
      waypoints.push(new THREE.Vector3(destX, 0, destZ));
    }
    return waypoints;
  }

  // 2. Moving from Market (North) to Farm (South)
  if (!isStartFarm && isDestFarm) {
    // Exit shelf/machine to Central Highway
    if (startZ < -8.0) {
      const arteryX = startX < 5.0 ? 2.0 : 7.5;
      waypoints.push(new THREE.Vector3(arteryX, 0, -11.0));
      waypoints.push(new THREE.Vector3(arteryX, 0, CENTRAL_HIGHWAY_Z));
    } else if (startZ < -2.5) {
      const arteryX = startX < 2.0 ? -3.0 : (startX < 8.0 ? 2.0 : 7.5);
      waypoints.push(new THREE.Vector3(arteryX, 0, -5.2));
      waypoints.push(new THREE.Vector3(arteryX, 0, CENTRAL_HIGHWAY_Z));
    } else {
      waypoints.push(new THREE.Vector3(startX, 0, CENTRAL_HIGHWAY_Z));
    }
    waypoints.push(new THREE.Vector3(DOORWAY_X, 0, CENTRAL_HIGHWAY_Z));
    waypoints.push(new THREE.Vector3(DOORWAY_X, 0, DOORWAY_MART_Z));
    waypoints.push(new THREE.Vector3(DOORWAY_X, 0, DOORWAY_FARM_Z));

    // Route on Farm Avenue to target patch/pen
    if (Math.abs(destX - DOORWAY_X) > 0.8) {
      waypoints.push(new THREE.Vector3(destX, 0, DOORWAY_FARM_Z));
    }
    waypoints.push(new THREE.Vector3(destX, 0, destZ));
    return waypoints;
  }

  // 3. Moving within Market
  if (!isStartFarm && !isDestFarm) {
    if (Math.abs(startZ - destZ) > 3.0 || Math.abs(startX - destX) > 4.5) {
      const startArtery = startX < 4.0 ? 2.0 : 7.5;
      const destArtery = destX < 4.0 ? 2.0 : 7.5;
      const intermediateZ = (startZ < -8.0 || destZ < -8.0) ? -11.0 : ((startZ < -2.5 || destZ < -2.5) ? -5.2 : CENTRAL_HIGHWAY_Z);
      waypoints.push(new THREE.Vector3(startArtery, 0, intermediateZ));
      waypoints.push(new THREE.Vector3(destArtery, 0, intermediateZ));
    }
    waypoints.push(new THREE.Vector3(destX, 0, destZ));
    return waypoints;
  }

  // 4. Moving within Farm
  if (Math.abs(startX - destX) > 2.0) {
    waypoints.push(new THREE.Vector3(startX, 0, DOORWAY_FARM_Z));
    waypoints.push(new THREE.Vector3(destX, 0, DOORWAY_FARM_Z));
  }
  waypoints.push(new THREE.Vector3(destX, 0, destZ));
  return waypoints;
}

class HelperWorker {
  constructor(scene, type, initialPos) {
    this.scene = scene;
    this.type = type; // 'STOCKER' | 'FARMER' | 'HARVESTER'
    this.position = new THREE.Vector3(initialPos.x, 0, initialPos.z);
    this.targetPos = new THREE.Vector3(initialPos.x, 0, initialPos.z);
    this.idlePos = new THREE.Vector3(initialPos.x, 0, initialPos.z);
    this.finalDest = new THREE.Vector3(initialPos.x, 0, initialPos.z);
    this.waypoints = [];
    this.baseSpeed = 2.8;
    this.speed = 2.8;
    this.baseCapacity = 3;
    this.capacity = 3;
    this.stack = [];
    this.unlocked = false;
    this.currentRotation = 0;
    this.walkCycle = 0;
    this.stuckTimer = 0;
    this.lastPos = new THREE.Vector3(initialPos.x, 0, initialPos.z);
    this.isDelivering = false;
    this.w1_task = null;
    this.w2_task = null;
    this.farmer_task = null;
    this.wheatRefillActive = false;
    this.chickenFeedRefillActive = false;
    this.tomatoRefillActive = false;
    this.juicerInputActive = false;

    this.createMesh();
  }

  createMesh() {
    this.mesh = new THREE.Group();

    let shirtColor = 0x2e7d32;
    let capColor = 0x1b5e20;
    let hairColor = 0x451a03;

    if (this.type === 'FARMER') {
      shirtColor = 0x0288d1;
      capColor = 0x01579b;
      hairColor = 0x78350f;
    } else if (this.type === 'HARVESTER') {
      shirtColor = 0xf97316;
      capColor = 0xc2410c;
      hairColor = 0x1c1917;
    } else if (this.type === 'BAKER') {
      shirtColor = 0xfff8e1;
      capColor = 0xffe082;
      hairColor = 0x5d4037;
    } else if (this.type === 'CHEF') {
      shirtColor = 0xffffff;
      capColor = 0xffffff;
      hairColor = 0x3e2723;
    }

    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffd180 });
    const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    const apronMat = new THREE.MeshLambertMaterial({ color: this.type === 'CHEF' ? 0x0288d1 : (this.type === 'BAKER' ? 0xffffff : 0x334155) });
    const capMat = new THREE.MeshLambertMaterial({ color: capColor });
    const hairMat = new THREE.MeshLambertMaterial({ color: hairColor });
    const pantsMat = new THREE.MeshLambertMaterial({ color: this.type === 'BAKER' ? 0x475569 : 0x1e293b });
    const bootMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
    const darkEyeMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const toolMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 });

    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.44, 14), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.mesh.add(shadow);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), skinMat);
    head.position.y = 1.55;
    head.castShadow = true;
    this.mesh.add(head);

    // Expressive Eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), darkEyeMat);
    eyeL.position.set(-0.09, 1.57, 0.23);
    this.mesh.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), darkEyeMat);
    eyeR.position.set(0.09, 1.57, 0.23);
    this.mesh.add(eyeR);

    // Friendly smile
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 4, 8, Math.PI), new THREE.MeshLambertMaterial({ color: 0xc2410c }));
    smile.rotation.x = Math.PI;
    smile.position.set(0, 1.50, 0.24);
    this.mesh.add(smile);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), hairMat);
    hair.position.set(0, 1.56, -0.04);
    this.mesh.add(hair);

    if (this.type === 'CHEF' || this.type === 'BAKER') {
      const toquePuff = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.28, 0.32, 16), capMat);
      toquePuff.position.y = 1.90;
      addSketchLines(toquePuff, 0x111111);
      this.mesh.add(toquePuff);

      const toqueTop = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), capMat);
      toqueTop.scale.set(1.0, 0.35, 1.0);
      toqueTop.position.y = 2.06;
      this.mesh.add(toqueTop);

      if (this.type === 'CHEF') {
        // Ruby Red French Ascot / Neckerchief
        const neckerchief = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 6, 12), new THREE.MeshLambertMaterial({ color: 0xc62828 }));
        neckerchief.rotation.x = Math.PI / 2;
        neckerchief.position.set(0, 1.34, 0);
        this.mesh.add(neckerchief);

        // French Curly Mustache
        const mustache = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.016, 4, 8, Math.PI), new THREE.MeshLambertMaterial({ color: 0x3e2723 }));
        mustache.rotation.x = Math.PI;
        mustache.position.set(0, 1.51, 0.24);
        this.mesh.add(mustache);
      }
    } else {
      const capCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.30, 0.16, 14), capMat);
      capCrown.position.y = 1.70;
      this.mesh.add(capCrown);

      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.22), capMat);
      visor.position.set(0, 1.66, 0.26);
      visor.rotation.x = 0.15;
      this.mesh.add(visor);
    }

    // 4. Human Torso & Worker Apron / Uniform
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.30, 0.72, 10), shirtMat);
    torso.position.y = 1.0;
    torso.castShadow = true;
    this.mesh.add(torso);

    // Work Utility Apron
    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.52, 0.44), apronMat);
    apron.position.set(0, 0.90, 0.04);
    apron.castShadow = true;
    this.mesh.add(apron);

    if (this.type === 'CHEF' || this.type === 'BAKER') {
      const rollingPin = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.32, 8), new THREE.MeshLambertMaterial({ color: 0xffd54f }));
      rollingPin.rotation.x = 0.25;
      rollingPin.position.set(0.14, 1.08, 0.25);
      this.mesh.add(rollingPin);
    } else {
      // Mini Garden Trowel in Pocket
      const trowelBlade = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 4), toolMat);
      trowelBlade.rotation.x = 0.3;
      trowelBlade.position.set(0.14, 1.05, 0.25);
      this.mesh.add(trowelBlade);
    }

    // 5. Articulated Human Arms
    const armGeo = new THREE.BoxGeometry(0.12, 0.46, 0.12);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.36, 1.25, 0);
    const lArmMesh = new THREE.Mesh(armGeo, shirtMat);
    lArmMesh.position.y = -0.20;
    lArmMesh.castShadow = true;
    this.leftArm.add(lArmMesh);

    const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 6), skinMat);
    lHand.position.y = -0.45;
    this.leftArm.add(lHand);
    this.mesh.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.36, 1.25, 0);
    const rArmMesh = new THREE.Mesh(armGeo, shirtMat);
    rArmMesh.position.y = -0.20;
    rArmMesh.castShadow = true;
    this.rightArm.add(rArmMesh);

    const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 6), skinMat);
    rHand.position.y = -0.45;
    this.rightArm.add(rHand);
    this.mesh.add(this.rightArm);

    // 6. Human Legs & Sturdy Leather Boots
    const legGeo = new THREE.BoxGeometry(0.16, 0.50, 0.16);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.16, 0.65, 0);
    const lLegMesh = new THREE.Mesh(legGeo, pantsMat);
    lLegMesh.position.y = -0.25;
    lLegMesh.castShadow = true;
    this.leftLeg.add(lLegMesh);

    const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.26), bootMat);
    lBoot.position.set(0, -0.52, 0.04);
    this.leftLeg.add(lBoot);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.16, 0.65, 0);
    const rLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rLegMesh.position.y = -0.25;
    rLegMesh.castShadow = true;
    this.rightLeg.add(rLegMesh);

    const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.26), bootMat);
    rBoot.position.set(0, -0.52, 0.04);
    this.rightLeg.add(rBoot);
    this.mesh.add(this.rightLeg);

    // 7. Stack Anchor for carried produce
    this.stackAnchor = new THREE.Group();
    this.stackAnchor.position.set(0, 1.15, -0.32);
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
    const dest = new THREE.Vector3(x, 0, z);
    if (!this.finalDest || this.finalDest.distanceTo(dest) > 0.8) {
      this.finalDest = dest.clone();
      this.waypoints = getStaffCorridorPath(this.position, dest);
      if (this.waypoints.length > 0) {
        this.targetPos.copy(this.waypoints.shift());
      } else {
        this.targetPos.copy(dest);
      }
    } else if (this.waypoints.length === 0 && this.position.distanceTo(this.targetPos) < 0.3) {
      this.targetPos.copy(dest);
    }
  }

  update(dt, patches, pens, machines, stands, dustbins = []) {
    if (!this.unlocked) return;

    this.refreshStats();

    // Corridor Waypoint Navigation with Continuous Step Consumption
    let remainingStep = this.speed * dt;
    let isMoving = false;

    while (remainingStep > 0.0001) {
      const dx = this.targetPos.x - this.position.x;
      const dz = this.targetPos.z - this.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist <= remainingStep) {
        this.position.copy(this.targetPos);
        remainingStep -= dist;
        if (this.waypoints.length > 0) {
          this.targetPos.copy(this.waypoints.shift());
          isMoving = true;
        } else {
          break;
        }
      } else {
        const dirX = dx / dist;
        const dirZ = dz / dist;
        this.position.x += dirX * remainingStep;
        this.position.z += dirZ * remainingStep;
        remainingStep = 0;
        isMoving = true;

        const targetRot = Math.atan2(dirX, dirZ);
        let angleDiff = targetRot - this.currentRotation;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.currentRotation += angleDiff * Math.min(1.0, 14 * dt);
      }
    }

    if (isMoving) {
      this.walkCycle += dt * 5.5;
      this.leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.5;
      this.rightLeg.rotation.x = -Math.sin(this.walkCycle) * 0.5;
      if (this.leftArm) this.leftArm.rotation.x = -Math.sin(this.walkCycle) * 0.45;
      if (this.rightArm) this.rightArm.rotation.x = Math.sin(this.walkCycle) * 0.45;
    } else {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      if (this.leftArm) this.leftArm.rotation.x = 0;
      if (this.rightArm) this.rightArm.rotation.x = 0;
    }

    // Responsive Anti-Stuck Watchdog: advance waypoint or snap if delayed
    if (!this.lastPos) this.lastPos = new THREE.Vector3();
    const moveDelta = this.position.distanceTo(this.lastPos);
    this.lastPos.copy(this.position);

    if (moveDelta < 0.05 * dt) {
      this.stuckTimer = (this.stuckTimer || 0) + dt;
      if (this.stuckTimer > 1.0) {
        this.stuckTimer = 0;
        if (this.waypoints.length > 0) {
          this.targetPos.copy(this.waypoints.shift());
        } else if (this.finalDest) {
          this.position.copy(this.finalDest);
        }
      }
    } else {
      this.stuckTimer = 0;
    }

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.currentRotation;

    if (this.type === 'STOCKER') {
      this.updateStockerAI(dt, patches, pens, machines, stands, dustbins);
    } else if (this.type === 'FARMER') {
      this.updateFarmerAI(dt, patches, pens, machines, stands, dustbins);
    } else if (this.type === 'HARVESTER') {
      this.updateHarvesterAI(dt, patches, pens, machines, stands, dustbins);
    } else if (this.type === 'BAKER') {
      this.updateBakerAI(dt, patches, pens, machines, stands, dustbins);
    } else if (this.type === 'CHEF') {
      this.updateChefAI(dt, patches, pens, machines, stands, dustbins);
    }
  }

  // Worker 1 (Stocker AI): Produce & Cannery Manager (Tomato Patch -> Juicer Hopper -> Tomato Shelf -> Canned Jam Shelf)
  updateStockerAI(dt, patches, pens, machines, stands, dustbins) {
    const standTomato = stands.find(s => s.config.itemId === 'TOMATO' && s.unlocked);
    const standJuice = stands.find(s => s.config.itemId === 'JUICE' && s.unlocked);
    const juicer = machines.find(m => m.config.type === 'JUICER' && m.unlocked);
    const tomatoPatch = patches.find(p => p.unlocked && p.config.itemId === 'TOMATO');

    // Empty-Trigger Hysteresis (Refill triggered at 0, filled until 100% full)
    if (juicer) {
      if (juicer.ingredients.length === 0) this.juicerRefillActive = true;
      if (juicer.isInputFull()) this.juicerRefillActive = false;
    }

    if (standTomato) {
      if (standTomato.stock.length === 0) this.tomatoShelfRefillActive = true;
      if (standTomato.isFull()) this.tomatoShelfRefillActive = false;
    }

    // Toggle Delivery state: full -> deliver; empty -> gather
    if (this.stack.length >= this.capacity) {
      this.isDelivering = true;
    } else if (this.stack.length === 0) {
      this.isDelivering = false;
    }

    // ============================================
    // 1. DELIVERY PHASE (Direct Walkthrough Navigation)
    // ============================================
    if (this.isDelivering && this.stack.length > 0) {
      // 1A. Deliver Tomatoes to Juicer Hopper or Tomato Shelf
      if (this.stack.some(i => i.type === 'TOMATO')) {
        if (this.juicerRefillActive && juicer && !juicer.isInputFull()) {
          this.setTarget(juicer.config.pos.x - 0.7, juicer.config.pos.z + 0.9);
          if (this.position.distanceTo(juicer.config.pos) < 3.2 || Math.hypot(this.position.x - (juicer.config.pos.x - 0.7), this.position.z - (juicer.config.pos.z + 0.9)) < 1.5) {
            const item = this.popItem('TOMATO');
            if (item) juicer.addIngredient(item);
            if (juicer.isInputFull() || !this.stack.some(i => i.type === 'TOMATO')) {
              this.isDelivering = false;
            }
          }
          return;
        }

        if (this.tomatoShelfRefillActive && standTomato && !standTomato.isFull()) {
          this.setTarget(standTomato.pos.x, standTomato.pos.z + 0.9);
          if (this.position.distanceTo(standTomato.pos) < 3.2 || Math.hypot(this.position.x - standTomato.pos.x, this.position.z - (standTomato.pos.z + 0.9)) < 1.5) {
            const item = this.popItem('TOMATO');
            if (item) standTomato.addItem();
            if (standTomato.isFull() || !this.stack.some(i => i.type === 'TOMATO')) {
              this.isDelivering = false;
            }
          }
          return;
        }

        // Fallbacks
        if (juicer && !juicer.isInputFull()) {
          this.setTarget(juicer.config.pos.x - 0.7, juicer.config.pos.z + 0.9);
          if (this.position.distanceTo(juicer.config.pos) < 3.2 || Math.hypot(this.position.x - (juicer.config.pos.x - 0.7), this.position.z - (juicer.config.pos.z + 0.9)) < 1.5) {
            const item = this.popItem('TOMATO');
            if (item) juicer.addIngredient(item);
            if (juicer.isInputFull() || !this.stack.some(i => i.type === 'TOMATO')) {
              this.isDelivering = false;
            }
          }
          return;
        }
        if (standTomato && !standTomato.isFull()) {
          this.setTarget(standTomato.pos.x, standTomato.pos.z + 0.9);
          if (this.position.distanceTo(standTomato.pos) < 3.2 || Math.hypot(this.position.x - standTomato.pos.x, this.position.z - (standTomato.pos.z + 0.9)) < 1.5) {
            const item = this.popItem('TOMATO');
            if (item) standTomato.addItem();
            if (standTomato.isFull() || !this.stack.some(i => i.type === 'TOMATO')) {
              this.isDelivering = false;
            }
          }
          return;
        }
      }

      // 1B. Deliver Canned Jam to Jam Shelf
      if (this.stack.some(i => i.type === 'JUICE') && standJuice && !standJuice.isFull()) {
        this.setTarget(standJuice.pos.x, standJuice.pos.z + 0.9);
        if (this.position.distanceTo(standJuice.pos) < 3.4 || Math.hypot(this.position.x - standJuice.pos.x, this.position.z - (standJuice.pos.z + 0.9)) < 1.5) {
          const item = this.popItem('JUICE');
          if (item) standJuice.addItem();
          if (standJuice.isFull() || !this.stack.some(i => i.type === 'JUICE')) {
            this.isDelivering = false;
          }
        }
        return;
      }

      // If holding unusable items, discard in dustbin
      if (dustbins && dustbins.length > 0) {
        const bin = dustbins[0];
        this.setTarget(bin.pos.x, bin.pos.z);
        if (this.position.distanceTo(bin.pos) < 2.8) {
          this.popItem();
        }
        return;
      }
    }

    // ============================================
    // 2. GATHERING PHASE
    // ============================================

    // Priority 1: Supply Juicer Hopper with Tomatoes
    if (this.juicerRefillActive && juicer && !juicer.isInputFull() && tomatoPatch) {
      if (this.stack.length < this.capacity && tomatoPatch.hasReadyCrops()) {
        this.setTarget(tomatoPatch.config.pos.x, tomatoPatch.config.pos.z);
        if (this.position.distanceTo(tomatoPatch.pos) < 3.2) {
          const t = tomatoPatch.harvestOne();
          if (t) this.addItem(t);
        }
        return;
      }
      if (this.stack.some(i => i.type === 'TOMATO')) {
        this.isDelivering = true;
        return;
      }
    }

    // Priority 2: Restock Tomato Shelf with Tomatoes
    if (this.tomatoShelfRefillActive && standTomato && !standTomato.isFull() && tomatoPatch) {
      if (this.stack.length < this.capacity && tomatoPatch.hasReadyCrops()) {
        this.setTarget(tomatoPatch.config.pos.x, tomatoPatch.config.pos.z);
        if (this.position.distanceTo(tomatoPatch.pos) < 3.2) {
          const t = tomatoPatch.harvestOne();
          if (t) this.addItem(t);
        }
        return;
      }
      if (this.stack.some(i => i.type === 'TOMATO')) {
        this.isDelivering = true;
        return;
      }
    }

    // Priority 3: Harvest finished Canned Jam from Juicer output tray
    if (juicer && juicer.outputStock > 0 && standJuice && !standJuice.isFull() && this.stack.length < this.capacity) {
      this.setTarget(juicer.config.pos.x + 0.7, juicer.config.pos.z + 0.9);
      if (this.position.distanceTo(juicer.config.pos) < 3.2 || Math.hypot(this.position.x - (juicer.config.pos.x + 0.7), this.position.z - (juicer.config.pos.z + 0.9)) < 1.5) {
        const out = juicer.harvestOutput();
        if (out) this.addItem(out);
      }
      return;
    }

    if (this.stack.length > 0) {
      this.isDelivering = true;
      return;
    }

    // 3. Idle Standby
    this.setTarget(this.idlePos.x, this.idlePos.z);
  }

  // Worker 2 (Farmer AI): Sequential Farm Operations (Chicken Coop -> Wheat Shelf -> Cow Pen -> Egg Shelf)
  updateFarmerAI(dt, patches, pens, machines, stands, dustbins) {
    const standWheat = stands.find(s => s.config.itemId === 'WHEAT' && s.unlocked);
    const standEgg = stands.find(s => s.config.itemId === 'EGG' && s.unlocked);
    const chickenPen = pens.find(p => p.config.type === 'CHICKEN' && p.unlocked);
    const cowPen = pens.find(p => p.config.type === 'COW' && p.unlocked);
    const wheatPatch = patches.find(p => p.unlocked && p.config.itemId === 'WHEAT');

    // 1. Determine Current Sequential Loop Goal
    if (!this.farmer_phase) this.farmer_phase = 'CHICKEN_FEED';

    if (this.farmer_phase === 'CHICKEN_FEED') {
      if (!chickenPen || chickenPen.feedStock >= chickenPen.feedCapacity) {
        this.farmer_phase = 'WHEAT_SHELF';
      }
    }
    if (this.farmer_phase === 'WHEAT_SHELF') {
      if (!standWheat || standWheat.isFull()) {
        this.farmer_phase = 'COW_FEED';
      }
    }
    if (this.farmer_phase === 'COW_FEED') {
      if (!cowPen || cowPen.feedStock >= cowPen.feedCapacity) {
        this.farmer_phase = 'EGG_SHELF';
      }
    }
    if (this.farmer_phase === 'EGG_SHELF') {
      if (!standEgg || standEgg.isFull() || (chickenPen && chickenPen.produceStock === 0 && !this.stack.some(i => i.type === 'EGG'))) {
        // Restart loop from first consumer that needs refill
        if (chickenPen && chickenPen.feedStock < chickenPen.feedCapacity) {
          this.farmer_phase = 'CHICKEN_FEED';
        } else if (standWheat && !standWheat.isFull()) {
          this.farmer_phase = 'WHEAT_SHELF';
        } else if (cowPen && cowPen.feedStock < cowPen.feedCapacity) {
          this.farmer_phase = 'COW_FEED';
        } else if (chickenPen && chickenPen.produceStock > 0 && standEgg && !standEgg.isFull()) {
          this.farmer_phase = 'EGG_SHELF';
        } else {
          this.farmer_phase = 'STANDBY';
        }
      }
    }
    if (this.farmer_phase === 'STANDBY') {
      if (chickenPen && chickenPen.feedStock < chickenPen.feedCapacity) this.farmer_phase = 'CHICKEN_FEED';
      else if (standWheat && !standWheat.isFull()) this.farmer_phase = 'WHEAT_SHELF';
      else if (cowPen && cowPen.feedStock < cowPen.feedCapacity) this.farmer_phase = 'COW_FEED';
      else if (chickenPen && chickenPen.produceStock > 0 && standEgg && !standEgg.isFull()) this.farmer_phase = 'EGG_SHELF';
    }

    // Toggle delivery state
    if (this.stack.length >= this.capacity) {
      this.isDelivering = true;
      this.batchWaitTimer = 0;
    } else if (this.stack.length === 0) {
      this.isDelivering = false;
    }

    // ============================================
    // 1. DELIVERY PHASE
    // ============================================
    if (this.isDelivering && this.stack.length > 0) {
      // 1A. Deliver Wheat to Chicken Pen
      if (this.stack.some(i => i.type === 'WHEAT') && this.farmer_phase === 'CHICKEN_FEED' && chickenPen && chickenPen.feedStock < chickenPen.feedCapacity) {
        const feederPos = chickenPen.feederPos || chickenPen.pos;
        this.setTarget(feederPos.x, feederPos.z);
        if (this.position.distanceTo(chickenPen.pos) < 3.4 || this.position.distanceTo(feederPos) < 3.4) {
          while (this.stack.some(i => i.type === 'WHEAT') && chickenPen.feedStock < chickenPen.feedCapacity) {
            const wheat = this.popItem('WHEAT');
            if (wheat) chickenPen.addFeed(1);
          }
          if (chickenPen.feedStock >= chickenPen.feedCapacity) this.farmer_phase = 'WHEAT_SHELF';
          if (this.stack.length === 0) this.isDelivering = false;
        }
        return;
      }

      // 1B. Deliver Wheat to Wheat Stand
      if (this.stack.some(i => i.type === 'WHEAT') && this.farmer_phase === 'WHEAT_SHELF' && standWheat && !standWheat.isFull()) {
        this.setTarget(standWheat.pos.x, standWheat.pos.z + 0.9);
        if (this.position.distanceTo(standWheat.pos) < 3.4 || Math.hypot(this.position.x - standWheat.pos.x, this.position.z - (standWheat.pos.z + 0.9)) < 1.5) {
          while (this.stack.some(i => i.type === 'WHEAT') && !standWheat.isFull()) {
            const wheat = this.popItem('WHEAT');
            if (wheat) standWheat.addItem();
          }
          if (standWheat.isFull()) this.farmer_phase = 'COW_FEED';
          if (this.stack.length === 0) this.isDelivering = false;
        }
        return;
      }

      // 1C. Deliver Wheat to Cow Pen
      if (this.stack.some(i => i.type === 'WHEAT') && this.farmer_phase === 'COW_FEED' && cowPen && cowPen.feedStock < cowPen.feedCapacity) {
        const feederPos = cowPen.feederPos || cowPen.pos;
        this.setTarget(feederPos.x, feederPos.z);
        if (this.position.distanceTo(cowPen.pos) < 3.4 || this.position.distanceTo(feederPos) < 3.4) {
          while (this.stack.some(i => i.type === 'WHEAT') && cowPen.feedStock < cowPen.feedCapacity) {
            const wheat = this.popItem('WHEAT');
            if (wheat) cowPen.addFeed(1);
          }
          if (cowPen.feedStock >= cowPen.feedCapacity) this.farmer_phase = 'EGG_SHELF';
          if (this.stack.length === 0) this.isDelivering = false;
        }
        return;
      }

      // 1D. Deliver Eggs to Egg Stand
      if (this.stack.some(i => i.type === 'EGG') && standEgg && !standEgg.isFull()) {
        this.setTarget(standEgg.pos.x, standEgg.pos.z + 0.9);
        if (this.position.distanceTo(standEgg.pos) < 3.4 || Math.hypot(this.position.x - standEgg.pos.x, this.position.z - (standEgg.pos.z + 0.9)) < 1.5) {
          while (this.stack.some(i => i.type === 'EGG') && !standEgg.isFull()) {
            const egg = this.popItem('EGG');
            if (egg) standEgg.addItem();
          }
          if (standEgg.isFull()) this.farmer_phase = 'CHICKEN_FEED';
          if (this.stack.length === 0) this.isDelivering = false;
        }
        return;
      }

      // 1E. Fallback Wheat Unloading (if consumer was filled before arrival)
      if (this.stack.some(i => i.type === 'WHEAT')) {
        if (chickenPen && chickenPen.feedStock < chickenPen.feedCapacity) {
          const feederPos = chickenPen.feederPos || chickenPen.pos;
          this.setTarget(feederPos.x, feederPos.z);
          if (this.position.distanceTo(feederPos) < 3.4) {
            const wheat = this.popItem('WHEAT');
            if (wheat) chickenPen.addFeed(1);
          }
          return;
        }
        if (standWheat && !standWheat.isFull()) {
          this.setTarget(standWheat.pos.x, standWheat.pos.z + 0.9);
          if (this.position.distanceTo(standWheat.pos) < 3.4) {
            const wheat = this.popItem('WHEAT');
            if (wheat) standWheat.addItem();
          }
          return;
        }
        if (cowPen && cowPen.feedStock < cowPen.feedCapacity) {
          const feederPos = cowPen.feederPos || cowPen.pos;
          this.setTarget(feederPos.x, feederPos.z);
          if (this.position.distanceTo(feederPos) < 3.4) {
            const wheat = this.popItem('WHEAT');
            if (wheat) cowPen.addFeed(1);
          }
          return;
        }
      }

      if (dustbins && dustbins.length > 0) {
        const bin = dustbins[0];
        this.setTarget(bin.pos.x, bin.pos.z);
        if (this.position.distanceTo(bin.pos) < 2.8) this.popItem();
        return;
      }
    }

    // ============================================
    // 2. GATHERING PHASE
    // ============================================
    if (this.farmer_phase === 'STANDBY') {
      if (this.stack.length > 0) {
        this.isDelivering = true;
        return;
      }
      this.setTarget(this.idlePos.x, this.idlePos.z);
      return;
    }

    // 2A. Egg Gathering (for Egg Shelf)
    if (this.farmer_phase === 'EGG_SHELF') {
      if (chickenPen && chickenPen.produceStock > 0 && this.stack.length < this.capacity) {
        const pickupPos = chickenPen.pickupPos || chickenPen.pos;
        this.setTarget(pickupPos.x, pickupPos.z);
        if (this.position.distanceTo(chickenPen.pos) < 3.4 || this.position.distanceTo(pickupPos) < 3.4) {
          while (chickenPen.produceStock > 0 && this.stack.length < this.capacity) {
            const egg = chickenPen.harvestProduce();
            if (!egg || !this.addItem(egg)) break;
          }
          if (this.stack.length >= this.capacity || chickenPen.produceStock === 0) {
            this.isDelivering = true;
            this.batchWaitTimer = 0;
          }
        }
        return;
      }
      if (this.stack.length > 0) {
        this.isDelivering = true;
        return;
      }
      this.farmer_phase = 'CHICKEN_FEED';
      return;
    }

    // 2B. Wheat Gathering (for Chicken Coop, Wheat Shelf, or Cow Pen)
    if (this.farmer_phase === 'CHICKEN_FEED' || this.farmer_phase === 'WHEAT_SHELF' || this.farmer_phase === 'COW_FEED') {
      if (wheatPatch) {
        this.setTarget(wheatPatch.config.pos.x, wheatPatch.config.pos.z);
        if (this.position.distanceTo(wheatPatch.pos) < 3.4) {
          while (wheatPatch.hasReadyCrops() && this.stack.length < this.capacity) {
            const w = wheatPatch.harvestOne();
            if (!w || !this.addItem(w)) break;
          }
        }

        if (this.stack.length >= this.capacity) {
          this.isDelivering = true;
          this.batchWaitTimer = 0;
          return;
        }

        if (this.stack.length > 0) {
          this.batchWaitTimer = (this.batchWaitTimer || 0) + dt;
          if (this.batchWaitTimer > 2.5) {
            this.isDelivering = true;
            this.batchWaitTimer = 0;
            return;
          }
          this.setTarget(wheatPatch.config.pos.x, wheatPatch.config.pos.z - 1.2);
          return;
        }
        return;
      }
    }

    this.setTarget(this.idlePos.x, this.idlePos.z);
  }

  // Worker 3 (Harvester AI): Dairy & Sweetcorn Specialist (Sweetcorn Shelf -> Milk Fridge)
  updateHarvesterAI(dt, patches, pens, machines, stands, dustbins) {
    const standCorn = stands.find(s => s.config.itemId === 'CARROT' && s.unlocked);
    const standMilk = stands.find(s => s.config.itemId === 'MILK' && s.unlocked);
    const cowPen = pens.find(p => p.config.type === 'COW' && p.unlocked);
    const cornPatch = patches.find(p => p.unlocked && p.config.itemId === 'CARROT');

    // 1. Demand Selection & Zero-Stock Hysteresis
    // Refill Milk Refrigerator ONLY when it becomes completely empty (0 items), then fill it full once.
    if (standMilk) {
      if (standMilk.stock.length === 0) {
        this.milkRefillActive = true;
      } else if (standMilk.isFull()) {
        this.milkRefillActive = false;
      }
    } else {
      this.milkRefillActive = false;
    }

    if (this.milkRefillActive && standMilk && !standMilk.isFull()) {
      this.w3_task = 'MILK_SHELF';
    } else if (standCorn && !standCorn.isFull()) {
      this.w3_task = 'CORN_SHELF';
    } else {
      this.w3_task = null;
    }

    // Toggle delivery state
    if (this.stack.length >= this.capacity) {
      this.isDelivering = true;
      this.batchWaitTimer = 0;
    } else if (this.stack.length === 0) {
      this.isDelivering = false;
    }

    // ============================================
    // 1. DELIVERY PHASE
    // ============================================
    if (this.isDelivering && this.stack.length > 0) {
      // 1A. Deliver Sweetcorn to Corn Stand
      if (this.stack.some(i => i.type === 'CARROT') && standCorn && !standCorn.isFull()) {
        this.setTarget(standCorn.pos.x, standCorn.pos.z + 0.9);
        if (this.position.distanceTo(standCorn.pos) < 3.4 || Math.hypot(this.position.x - standCorn.pos.x, this.position.z - (standCorn.pos.z + 0.9)) < 1.5) {
          while (this.stack.some(i => i.type === 'CARROT') && !standCorn.isFull()) {
            const corn = this.popItem('CARROT');
            if (corn) standCorn.addItem();
          }
          if (this.stack.length === 0) this.isDelivering = false;
        }
        return;
      }

      // 1B. Deliver Milk to Milk Fridge
      if (this.stack.some(i => i.type === 'MILK') && standMilk && !standMilk.isFull()) {
        this.setTarget(standMilk.pos.x, standMilk.pos.z + 0.9);
        if (this.position.distanceTo(standMilk.pos) < 3.5 || Math.hypot(this.position.x - standMilk.pos.x, this.position.z - (standMilk.pos.z + 0.9)) < 1.5) {
          while (this.stack.some(i => i.type === 'MILK') && !standMilk.isFull()) {
            const milk = this.popItem('MILK');
            if (milk) standMilk.addItem();
          }
          if (standMilk.isFull()) {
            this.milkRefillActive = false;
          }
          if (this.stack.length === 0) this.isDelivering = false;
        }
        return;
      }

      if (dustbins && dustbins.length > 0) {
        const bin = dustbins[0];
        this.setTarget(bin.pos.x, bin.pos.z);
        if (this.position.distanceTo(bin.pos) < 2.8) this.popItem();
        return;
      }
    }

    // ============================================
    // 2. GATHERING PHASE
    // ============================================
    if (!this.w3_task) {
      if (this.stack.length > 0) {
        this.isDelivering = true;
        return;
      }
      this.setTarget(this.idlePos.x, this.idlePos.z);
      return;
    }

    // 2A. Sweetcorn Gathering (Full Batch)
    if (this.w3_task === 'CORN_SHELF' && cornPatch) {
      this.setTarget(cornPatch.config.pos.x, cornPatch.config.pos.z);
      if (this.position.distanceTo(cornPatch.pos) < 3.4) {
        while (cornPatch.hasReadyCrops() && this.stack.length < this.capacity) {
          const c = cornPatch.harvestOne();
          if (!c || !this.addItem(c)) break;
        }
      }

      if (this.stack.length >= this.capacity) {
        this.isDelivering = true;
        this.batchWaitTimer = 0;
        return;
      }

      if (this.stack.length > 0) {
        this.batchWaitTimer = (this.batchWaitTimer || 0) + dt;
        if (this.batchWaitTimer > 2.5) {
          this.isDelivering = true;
          this.batchWaitTimer = 0;
          return;
        }
        this.setTarget(cornPatch.config.pos.x, cornPatch.config.pos.z);
        return;
      }
      return;
    }

    // 2B. Milk Gathering (Full Batch)
    if (this.w3_task === 'MILK_SHELF' && cowPen) {
      if (cowPen.produceStock > 0 && this.stack.length < this.capacity) {
        const pickupPos = cowPen.pickupPos || cowPen.pos;
        this.setTarget(pickupPos.x, pickupPos.z);
        if (this.position.distanceTo(cowPen.pos) < 3.4 || this.position.distanceTo(pickupPos) < 3.4) {
          while (cowPen.produceStock > 0 && this.stack.length < this.capacity) {
            const milk = cowPen.harvestProduce();
            if (!milk || !this.addItem(milk)) break;
          }
          if (this.stack.length >= this.capacity || cowPen.produceStock === 0) {
            this.isDelivering = true;
            this.batchWaitTimer = 0;
          }
        }
        return;
      }
      if (this.stack.length > 0) {
        this.isDelivering = true;
        return;
      }
      this.setTarget(this.idlePos.x, this.idlePos.z);
      return;
    }

    this.setTarget(this.idlePos.x, this.idlePos.z);
  }

  // Worker 5 (Baker AI): Dedicated Artisan Bakery Manager
  updateBakerAI(dt, patches, pens, machines, stands, dustbins) {
    const bakery = machines.find(m => m.config.type === 'BAKERY' && m.unlocked);
    const standBread = stands.find(s => s.config.itemId === 'BREAD' && s.unlocked);
    const standWheat = stands.find(s => s.config.itemId === 'WHEAT' && s.unlocked);
    const standEgg = stands.find(s => s.config.itemId === 'EGG' && s.unlocked);
    const chickenPen = pens.find(p => p.config.type === 'CHICKEN' && p.unlocked);
    const wheatPatch = patches.find(p => p.unlocked && p.config.itemId === 'WHEAT');

    if (!bakery) {
      this.setTarget(this.idlePos.x, this.idlePos.z);
      return;
    }

    // ============================================
    // 1. DELIVERY PHASE
    // ============================================
    if (this.stack.length > 0) {
      // 1A. Deliver baked Bread to Bread Showcase
      if (this.stack.some(i => i.type === 'BREAD') && standBread && !standBread.isFull()) {
        this.setTarget(standBread.pos.x, standBread.pos.z + 0.9);
        if (this.position.distanceTo(standBread.pos) < 3.4 || Math.hypot(this.position.x - standBread.pos.x, this.position.z - (standBread.pos.z + 0.9)) < 1.5) {
          while (this.stack.some(i => i.type === 'BREAD') && !standBread.isFull()) {
            const bread = this.popItem('BREAD');
            if (bread) standBread.addItem();
          }
          if (this.stack.length === 0) this.isDelivering = false;
        }
        return;
      }

      // 1B. Deliver Eggs / Wheat ingredients into Bakery Oven Hopper
      const ingredient = this.stack.find(i => i.type === 'EGG' || i.type === 'WHEAT');
      if (ingredient && bakery && !bakery.isInputFull() && bakery.canAcceptIngredient(ingredient.type)) {
        this.setTarget(bakery.config.pos.x - 0.7, bakery.config.pos.z + 0.9);
        if (this.position.distanceTo(bakery.config.pos) < 3.4 || Math.hypot(this.position.x - (bakery.config.pos.x - 0.7), this.position.z - (bakery.config.pos.z + 0.9)) < 1.5) {
          while (this.stack.length > 0 && !bakery.isInputFull()) {
            const nextIng = this.stack[this.stack.length - 1];
            if (bakery.canAcceptIngredient(nextIng.type)) {
              const item = this.popItem(nextIng.type);
              if (item) bakery.addIngredient(item);
            } else {
              break;
            }
          }
          if (this.stack.length === 0) this.isDelivering = false;
        }
        return;
      }

      // 1C. Graceful Shelf Overflow: If holding unaccepted ingredients, deposit into respective mart shelves!
      if (this.stack.some(i => i.type === 'EGG') && standEgg && !standEgg.isFull()) {
        this.setTarget(standEgg.pos.x, standEgg.pos.z + 0.9);
        if (this.position.distanceTo(standEgg.pos) < 3.4) {
          while (this.stack.some(i => i.type === 'EGG') && !standEgg.isFull()) {
            const e = this.popItem('EGG');
            if (e) standEgg.addItem();
          }
        }
        return;
      }
      if (this.stack.some(i => i.type === 'WHEAT') && standWheat && !standWheat.isFull()) {
        this.setTarget(standWheat.pos.x, standWheat.pos.z + 0.9);
        if (this.position.distanceTo(standWheat.pos) < 3.4) {
          while (this.stack.some(i => i.type === 'WHEAT') && !standWheat.isFull()) {
            const w = this.popItem('WHEAT');
            if (w) standWheat.addItem();
          }
        }
        return;
      }

      if (dustbins && dustbins.length > 0) {
        const bin = dustbins[0];
        this.setTarget(bin.pos.x, bin.pos.z);
        if (this.position.distanceTo(bin.pos) < 2.8) this.popItem();
        return;
      }
    }

    // ============================================
    // 2. GATHERING PHASE
    // ============================================

    // Priority 1: Harvest Baked Bread from Bakery Output Tray
    if (bakery.outputStock > 0 && standBread && !standBread.isFull()) {
      this.setTarget(bakery.config.pos.x + 0.7, bakery.config.pos.z + 0.9);
      if (this.position.distanceTo(bakery.config.pos) < 3.4 || Math.hypot(this.position.x - (bakery.config.pos.x + 0.7), this.position.z - (bakery.config.pos.z + 0.9)) < 1.5) {
        while (bakery.outputStock > 0 && this.stack.length < this.capacity) {
          const bread = bakery.harvestOutput();
          if (!bread || !this.addItem(bread)) break;
        }
        if (this.stack.length > 0) this.isDelivering = true;
      }
      return;
    }

    // Check Bakery Hopper Needs (Requires Eggs + Wheat)
    const maxEgg = Math.max(2, Math.floor(bakery.inputCapacity * 0.5));
    const maxWheat = Math.max(3, Math.floor(bakery.inputCapacity * 0.7));
    const eggCountInHopper = bakery.ingredients.filter(i => i === 'EGG').length;
    const wheatCountInHopper = bakery.ingredients.filter(i => i === 'WHEAT').length;

    // Step 1: Take Eggs in full batch from Chicken Coop
    if (eggCountInHopper < maxEgg && !bakery.isInputFull() && chickenPen && chickenPen.produceStock > 0) {
      const pickupPos = chickenPen.pickupPos || chickenPen.pos;
      this.setTarget(pickupPos.x, pickupPos.z);
      if (this.position.distanceTo(chickenPen.pos) < 3.4 || this.position.distanceTo(pickupPos) < 3.4) {
        const needed = Math.min(maxEgg - eggCountInHopper, this.capacity);
        while (chickenPen.produceStock > 0 && this.stack.length < needed) {
          const egg = chickenPen.harvestProduce();
          if (!egg || !this.addItem(egg)) break;
        }
        if (this.stack.length > 0) this.isDelivering = true;
      }
      return;
    }

    // Step 2: Take Wheat in full batch from Wheat Patch
    if (wheatCountInHopper < maxWheat && !bakery.isInputFull() && wheatPatch) {
      this.setTarget(wheatPatch.config.pos.x, wheatPatch.config.pos.z);
      if (this.position.distanceTo(wheatPatch.pos) < 3.4) {
        const needed = Math.min(maxWheat - wheatCountInHopper, this.capacity);
        while (wheatPatch.hasReadyCrops() && this.stack.length < needed) {
          const w = wheatPatch.harvestOne();
          if (!w || !this.addItem(w)) break;
        }
      }
      if (this.stack.length > 0) {
        this.isDelivering = true;
      }
      return;
    }

    // Standby at Bakery Oven
    this.setTarget(this.idlePos.x, this.idlePos.z);
  }

  // Master Patissier (Chef Jean AI): Automates Pastry Cake Mixer & Royal Cake Stand (Full Batch Cycle)
  updateChefAI(dt, patches, pens, machines, stands, dustbins) {
    const cakery = machines.find(m => m.config.type === 'CAKERY' && m.unlocked);
    const bakery = machines.find(m => m.config.type === 'BAKERY' && m.unlocked);
    const standCake = stands.find(s => s.config.itemId === 'CAKE' && s.unlocked);
    const standBread = stands.find(s => s.config.itemId === 'BREAD' && s.unlocked);
    const standMilk = stands.find(s => s.config.itemId === 'MILK' && s.unlocked);
    const standEgg = stands.find(s => s.config.itemId === 'EGG' && s.unlocked);
    const chickenPen = pens.find(p => p.config.type === 'CHICKEN' && p.unlocked);
    const cowPen = pens.find(p => p.config.type === 'COW' && p.unlocked);

    if (!cakery) {
      this.setTarget(this.idlePos.x, this.idlePos.z);
      return;
    }

    // ============================================
    // 1. DELIVERY PHASE
    // ============================================
    if (this.stack.length > 0) {
      // 1A. Deliver Royal Cakes to Cake Stand
      if (this.stack.some(i => i.type === 'CAKE') && standCake) {
        this.setTarget(standCake.pos.x, standCake.pos.z + 0.9);
        if (this.position.distanceTo(standCake.pos) < 3.4 || Math.hypot(this.position.x - standCake.pos.x, this.position.z - (standCake.pos.z + 0.9)) < 1.5) {
          while (this.stack.some(i => i.type === 'CAKE') && !standCake.isFull()) {
            const cake = this.popItem('CAKE');
            if (cake) standCake.addItem();
          }
          if (this.stack.length === 0) this.isDelivering = false;
        }
        return;
      }

      // 1B. Deliver Ingredients (Eggs, Milk, Bread) into Cake Mixer Hopper
      const ingredient = this.stack.find(i => ['EGG', 'MILK', 'BREAD'].includes(i.type));
      if (ingredient && cakery && !cakery.isInputFull() && cakery.canAcceptIngredient(ingredient.type)) {
        this.setTarget(cakery.config.pos.x - 0.7, cakery.config.pos.z + 0.9);
        if (this.position.distanceTo(cakery.config.pos) < 3.4 || Math.hypot(this.position.x - (cakery.config.pos.x - 0.7), this.position.z - (cakery.config.pos.z + 0.9)) < 1.5) {
          while (this.stack.length > 0 && !cakery.isInputFull()) {
            const nextIng = this.stack[this.stack.length - 1];
            if (cakery.canAcceptIngredient(nextIng.type)) {
              const item = this.popItem(nextIng.type);
              if (item) cakery.addIngredient(item);
            } else {
              break;
            }
          }
          if (this.stack.length === 0) this.isDelivering = false;
        }
        return;
      }

      // 1C. Graceful Shelf Overflow: If holding unaccepted ingredients, deposit into respective mart shelves!
      if (this.stack.some(i => i.type === 'EGG') && standEgg && !standEgg.isFull()) {
        this.setTarget(standEgg.pos.x, standEgg.pos.z + 0.9);
        if (this.position.distanceTo(standEgg.pos) < 3.4) {
          while (this.stack.some(i => i.type === 'EGG') && !standEgg.isFull()) {
            const e = this.popItem('EGG');
            if (e) standEgg.addItem();
          }
        }
        return;
      }
      if (this.stack.some(i => i.type === 'MILK') && standMilk && !standMilk.isFull()) {
        this.setTarget(standMilk.pos.x, standMilk.pos.z + 0.9);
        if (this.position.distanceTo(standMilk.pos) < 3.4) {
          while (this.stack.some(i => i.type === 'MILK') && !standMilk.isFull()) {
            const m = this.popItem('MILK');
            if (m) standMilk.addItem();
          }
        }
        return;
      }
      if (this.stack.some(i => i.type === 'BREAD') && standBread && !standBread.isFull()) {
        this.setTarget(standBread.pos.x, standBread.pos.z + 0.9);
        if (this.position.distanceTo(standBread.pos) < 3.4) {
          while (this.stack.some(i => i.type === 'BREAD') && !standBread.isFull()) {
            const b = this.popItem('BREAD');
            if (b) standBread.addItem();
          }
        }
        return;
      }

      if (dustbins && dustbins.length > 0) {
        const bin = dustbins[0];
        this.setTarget(bin.pos.x, bin.pos.z);
        if (this.position.distanceTo(bin.pos) < 2.8) this.popItem();
        return;
      }
    }

    // ============================================
    // 2. GATHERING & BATCHING PHASE
    // ============================================
    const maxPerType = Math.max(2, Math.floor(cakery.inputCapacity / 3));
    const eggCountInHopper = cakery.ingredients.filter(i => i === 'EGG').length;
    const milkCountInHopper = cakery.ingredients.filter(i => i === 'MILK').length;
    const breadCountInHopper = cakery.ingredients.filter(i => i === 'BREAD').length;
    const cakesPending = Math.min(eggCountInHopper, milkCountInHopper, breadCountInHopper);
    const targetBatchSize = Math.min(cakery.outputCapacity, this.capacity, cakery.outputStock + cakesPending);

    // Step 1: Harvest Full Batch of Finished Royal Cakes (or wait if cakes are actively baking towards batch)
    if (cakery.outputStock > 0 && standCake && !standCake.isFull()) {
      if (cakery.outputStock >= targetBatchSize || cakesPending === 0) {
        this.setTarget(cakery.config.pos.x + 0.7, cakery.config.pos.z + 0.9);
        if (this.position.distanceTo(cakery.config.pos) < 3.4 || Math.hypot(this.position.x - (cakery.config.pos.x + 0.7), this.position.z - (cakery.config.pos.z + 0.9)) < 1.5) {
          while (cakery.outputStock > 0 && this.stack.length < this.capacity) {
            const cake = cakery.harvestOutput();
            if (!cake || !this.addItem(cake)) break;
          }
          if (this.stack.length > 0) this.isDelivering = true;
        }
        return;
      } else {
        // Wait at Cake Mixer while batch finishes baking
        this.setTarget(cakery.config.pos.x + 0.7, cakery.config.pos.z + 0.9);
        return;
      }
    }

    // Step 2 (Batch 1): Take Eggs FIRST from Chicken Coop
    if (eggCountInHopper < maxPerType && !cakery.isInputFull() && chickenPen && chickenPen.produceStock > 0) {
      const pickupPos = chickenPen.pickupPos || chickenPen.pos;
      this.setTarget(pickupPos.x, pickupPos.z);
      if (this.position.distanceTo(chickenPen.pos) < 3.4 || this.position.distanceTo(pickupPos) < 3.4) {
        const needed = Math.min(maxPerType - eggCountInHopper, this.capacity);
        while (chickenPen.produceStock > 0 && this.stack.length < needed) {
          const egg = chickenPen.harvestProduce();
          if (!egg || !this.addItem(egg)) break;
        }
        if (this.stack.length > 0) this.isDelivering = true;
      }
      return;
    }

    // Step 3 (Batch 2): Take Milk SECOND from Cow Pen
    if (milkCountInHopper < maxPerType && !cakery.isInputFull() && cowPen && cowPen.produceStock > 0) {
      const pickupPos = cowPen.pickupPos || cowPen.pos;
      this.setTarget(pickupPos.x, pickupPos.z);
      if (this.position.distanceTo(cowPen.pos) < 3.4 || this.position.distanceTo(pickupPos) < 3.4) {
        const needed = Math.min(maxPerType - milkCountInHopper, this.capacity);
        while (cowPen.produceStock > 0 && this.stack.length < needed) {
          const milk = cowPen.harvestProduce();
          if (!milk || !this.addItem(milk)) break;
        }
        if (this.stack.length > 0) this.isDelivering = true;
      }
      return;
    }

    // Step 4 (Batch 3): Take Bread THIRD from Bakery Machine (or Bread Showcase)
    if (breadCountInHopper < maxPerType && !cakery.isInputFull()) {
      if (bakery && bakery.outputStock > 0) {
        this.setTarget(bakery.config.pos.x + 0.7, bakery.config.pos.z + 0.9);
        if (this.position.distanceTo(bakery.config.pos) < 3.4 || Math.hypot(this.position.x - (bakery.config.pos.x + 0.7), this.position.z - (bakery.config.pos.z + 0.9)) < 1.5) {
          const needed = Math.min(maxPerType - breadCountInHopper, this.capacity);
          while (bakery.outputStock > 0 && this.stack.length < needed) {
            const bread = bakery.harvestOutput();
            if (!bread || !this.addItem(bread)) break;
          }
          if (this.stack.length > 0) this.isDelivering = true;
        }
        return;
      } else if (standBread && standBread.stock.length > 0) {
        this.setTarget(standBread.pos.x, standBread.pos.z + 0.9);
        if (this.position.distanceTo(standBread.pos) < 3.4 || Math.hypot(this.position.x - standBread.pos.x, this.position.z - (standBread.pos.z + 0.9)) < 1.5) {
          const needed = Math.min(maxPerType - breadCountInHopper, this.capacity);
          while (standBread.stock.length > 0 && this.stack.length < needed) {
            const b = standBread.takeItem();
            if (!b || !this.addItem(b)) break;
          }
          if (this.stack.length > 0) this.isDelivering = true;
        }
        return;
      }
    }

    // Step 5: Wait at Cake Mixer if ingredients are loaded and baking is in progress
    if (cakesPending > 0) {
      this.setTarget(cakery.config.pos.x + 0.7, cakery.config.pos.z + 0.9);
      return;
    }

    // Standby in front of Cake Mixer
    this.setTarget(this.idlePos.x, this.idlePos.z);
  }
}

// Purple Uniform Cashier: Stands on Tomato Farm Side Facing North
class HelperCashier {
  constructor(scene, pos = { x: -6.5, z: 2.35 }, uniformColor = 0x8e24aa, vestColor = 0xab47bc, capColor = 0x6a1b9a) {
    this.scene = scene;
    this.pos = new THREE.Vector3(pos.x, 0, pos.z);
    this.uniformColor = uniformColor;
    this.vestColor = vestColor;
    this.capColor = capColor;
    this.unlocked = false;

    this.createMesh();
  }

  createMesh() {
    this.mesh = new THREE.Group();
    this.mesh.position.set(this.pos.x, 0, this.pos.z);

    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffd180 });
    const shirtMat = new THREE.MeshLambertMaterial({ color: this.uniformColor });
    const vestMat = new THREE.MeshLambertMaterial({ color: this.vestColor });
    const capMat = new THREE.MeshLambertMaterial({ color: this.capColor });
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x4e342e });
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x263238 });
    const shoeMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const darkEyeMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const blushMat = new THREE.MeshLambertMaterial({ color: 0xf472b6 });
    const badgeGoldMat = new THREE.MeshLambertMaterial({ color: 0xffd54f });
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 });

    // 1. Soft contact shadow
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.44, 14), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.mesh.add(shadow);

    // 2. Human Head & Friendly Face
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), skinMat);
    head.position.y = 1.55;
    head.castShadow = true;
    this.mesh.add(head);

    // Expressive Eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), darkEyeMat);
    eyeL.position.set(-0.09, 1.57, -0.23); // Facing south (-Z) towards register counter
    this.mesh.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), darkEyeMat);
    eyeR.position.set(0.09, 1.57, -0.23);
    this.mesh.add(eyeR);

    // Cheerful rosy cheeks
    const blushL = new THREE.Mesh(new THREE.CircleGeometry(0.03, 6), blushMat);
    blushL.position.set(-0.13, 1.50, -0.23);
    blushL.rotation.y = Math.PI;
    this.mesh.add(blushL);
    const blushR = new THREE.Mesh(new THREE.CircleGeometry(0.03, 6), blushMat);
    blushR.position.set(0.13, 1.50, -0.23);
    blushR.rotation.y = Math.PI;
    this.mesh.add(blushR);

    // Friendly smile
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.015, 4, 8, Math.PI), new THREE.MeshLambertMaterial({ color: 0xad1457 }));
    smile.position.set(0, 1.48, -0.24);
    this.mesh.add(smile);

    // 3. Hair & Cashier Headband / Sun Visor
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), hairMat);
    hair.position.set(0, 1.56, 0.02);
    this.mesh.add(hair);

    const visor = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 6, 16), capMat);
    visor.rotation.x = Math.PI / 2 + 0.1;
    visor.position.set(0, 1.66, 0);
    this.mesh.add(visor);

    const visorBrim = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.18), capMat);
    visorBrim.position.set(0, 1.67, -0.24);
    visorBrim.rotation.x = -0.15;
    this.mesh.add(visorBrim);

    // 4. Torso & Store Uniform
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.72, 10), shirtMat);
    torso.position.y = 1.0;
    torso.castShadow = true;
    this.mesh.add(torso);

    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.50, 0.42), vestMat);
    vest.position.set(0, 0.96, 0);
    vest.castShadow = true;
    this.mesh.add(vest);

    // Golden Name Badge on Chest
    const nameBadge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.03), badgeGoldMat);
    nameBadge.position.set(0.14, 1.08, -0.22);
    this.mesh.add(nameBadge);

    // 5. Articulated Arms Scanning at Counter
    const armGeo = new THREE.BoxGeometry(0.11, 0.44, 0.11);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.32, 1.22, 0);
    const lArmMesh = new THREE.Mesh(armGeo, shirtMat);
    lArmMesh.position.set(0, -0.15, -0.12);
    lArmMesh.rotation.x = -0.55;
    lArmMesh.castShadow = true;
    this.leftArm.add(lArmMesh);

    const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), skinMat);
    lHand.position.set(0, -0.32, -0.24);
    this.leftArm.add(lHand);
    this.mesh.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.32, 1.22, 0);
    const rArmMesh = new THREE.Mesh(armGeo, shirtMat);
    rArmMesh.position.set(0, -0.15, -0.12);
    rArmMesh.rotation.x = -0.55;
    rArmMesh.castShadow = true;
    this.rightArm.add(rArmMesh);

    const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), skinMat);
    rHand.position.set(0, -0.32, -0.24);
    this.rightArm.add(rHand);
    this.mesh.add(this.rightArm);

    // 6. Legs & Store Shoes
    const legGeo = new THREE.BoxGeometry(0.15, 0.48, 0.15);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.14, 0.65, 0);
    const lLegMesh = new THREE.Mesh(legGeo, pantsMat);
    lLegMesh.position.y = -0.24;
    lLegMesh.castShadow = true;
    this.leftLeg.add(lLegMesh);

    const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.24), shoeMat);
    lShoe.position.set(0, -0.50, -0.02);
    this.leftLeg.add(lShoe);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.14, 0.65, 0);
    const rLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rLegMesh.position.y = -0.24;
    rLegMesh.castShadow = true;
    this.rightLeg.add(rLegMesh);

    const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.24), shoeMat);
    rShoe.position.set(0, -0.50, -0.02);
    this.rightLeg.add(rShoe);
    this.mesh.add(this.rightLeg);

    this.mesh.visible = false;
    this.scene.add(this.mesh);
  }

  setUnlocked(unlocked) {
    this.unlocked = unlocked;
    this.mesh.visible = unlocked;
  }
}