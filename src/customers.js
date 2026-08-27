// Customer AI Engine: Instant Shelf Pick, Lateral Sidestepping Separation & Anti-Stuck Watchdog
function addSketchLines(mesh, color = 0x111111) {
  if (!mesh || !mesh.geometry) return;
  try {
    const edges = new THREE.EdgesGeometry(mesh.geometry, 28);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: color, linewidth: 2 }));
    mesh.add(line);
  } catch (e) {}
}

const GATES = {
  WEST: {
    spawn: new THREE.Vector3(-15.0, 0, -4.5),
    door: new THREE.Vector3(-12.0, 0, -4.5),
    foyer: new THREE.Vector3(-9.5, 0, -4.5),
    entryAisle: new THREE.Vector3(-6.0, 0, -3.0)
  },
  NORTH: {
    spawn: new THREE.Vector3(-6.0, 0, -15.5),
    door: new THREE.Vector3(-6.0, 0, -13.5),
    foyer: new THREE.Vector3(-6.0, 0, -11.0),
    entryAisle: new THREE.Vector3(-6.0, 0, -7.0)
  }
};

function getCorridorPath(start, dest) {
  const waypoints = [];
  const startZ = start.z;
  const destZ = dest.z;

  // Clear vertical transit arteries: North Runway (-6.0), Aisle 1 (2.15), Aisle 2 (7.45), Aisle 3 (12.75), East Aisle (18.0)
  const arteries = [-6.0, 2.15, 7.45, 12.75, 18.0];
  let bestArtery = arteries[0];
  let minD = 999;
  for (let a of arteries) {
    const d = Math.abs(start.x - a) + Math.abs(dest.x - a);
    if (d < minD) { minD = d; bestArtery = a; }
  }

  // Only dogleg via artery if changing aisles
  if (Math.abs(startZ - destZ) > 0.8) {
    waypoints.push(new THREE.Vector3(bestArtery, 0, startZ));
    waypoints.push(new THREE.Vector3(bestArtery, 0, destZ));
  }
  waypoints.push(new THREE.Vector3(dest.x, 0, dest.z));
  return waypoints;
}

class Customer {
  constructor(scene, isVip = false, gateChoice = null) {
    this.scene = scene;
    this.isVip = isVip;
    this.speed = isVip ? 3.2 : 2.5;
    this.shoppingList = [];
    this.basketItems = [];
    this.totalNeeded = 1;
    this.state = 'ENTER'; // 'ENTER' | 'SHOP' | 'QUEUE' | 'PAY' | 'LEAVE'
    this.checkoutTimer = 0;
    this.assignedRegister = null;
    this.currentRotation = 0;
    this.walkCycle = 0;
    this.waypoints = [];
    this.waitingForRestock = false;
    this.stuckTimer = 0;
    this.lastPosition = new THREE.Vector3();

    // Enter through the Front Gate (North Glass Door)
    this.gate = 'NORTH';
    this.position = GATES[this.gate].spawn.clone();
    this.targetPos = this.position.clone();
    this.lastPosition.copy(this.position);

    // Initial entrance route
    this.waypoints = [
      GATES[this.gate].door.clone(),
      GATES[this.gate].foyer.clone(),
      GATES[this.gate].entryAisle.clone()
    ];
    this.targetPos.copy(this.waypoints.shift());

    this.generateShoppingList();
    this.createMesh();
  }

  createMesh() {
    this.mesh = new THREE.Group();

    const normalColors = [0x42a5f5, 0xab47bc, 0x26a69a, 0xff7043, 0x8d6e63, 0x78909c, 0xec407a];
    const bodyColor = this.isVip ? CONFIG.COLORS.VIP_GOLD : normalColors[Math.floor(Math.random() * normalColors.length)];

    const skinMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 });

    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.38, 12), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.mesh.add(shadow);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.7, 8), skinMat);
    torso.position.y = 0.9;
    torso.castShadow = true;
    addSketchLines(torso, 0x111111);
    this.mesh.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), skinMat);
    head.position.y = 1.45;
    head.castShadow = true;
    addSketchLines(head, 0x111111);
    this.mesh.add(head);

    const hatMat = new THREE.MeshLambertMaterial({ color: this.isVip ? 0xffd700 : 0x37474f });
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.12, 8), hatMat);
    hat.position.y = 1.62;
    addSketchLines(hat, 0x111111);
    this.mesh.add(hat);

    const legMat = new THREE.MeshLambertMaterial({ color: 0x263238 });
    const legGeo = new THREE.BoxGeometry(0.16, 0.55, 0.16);

    this.leftLeg = new THREE.Mesh(legGeo, legMat);
    this.leftLeg.position.set(-0.14, 0.35, 0);
    this.leftLeg.castShadow = true;
    addSketchLines(this.leftLeg, 0x111111);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, legMat);
    this.rightLeg.position.set(0.14, 0.35, 0);
    this.rightLeg.castShadow = true;
    addSketchLines(this.rightLeg, 0x111111);
    this.mesh.add(this.rightLeg);

    this.basketAnchor = new THREE.Group();
    this.basketAnchor.position.set(0.42, 0.75, 0.15);

    const basketMat = new THREE.MeshLambertMaterial({ color: 0xffb74d });
    const basketMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.32), basketMat);
    basketMesh.castShadow = true;
    addSketchLines(basketMesh, 0x111111);
    this.basketAnchor.add(basketMesh);

    this.mesh.add(this.basketAnchor);

    // Crisp Thought Canvas Badge
    this.thoughtCanvas = document.createElement('canvas');
    this.thoughtCanvas.width = 300;
    this.thoughtCanvas.height = 96;
    this.thoughtCtx = this.thoughtCanvas.getContext('2d');
    this.thoughtTexture = new THREE.CanvasTexture(this.thoughtCanvas);
    this.thoughtTexture.minFilter = THREE.LinearFilter;

    const badgeMat = new THREE.SpriteMaterial({ map: this.thoughtTexture, transparent: true, depthTest: false });
    this.thoughtBadgeSprite = new THREE.Sprite(badgeMat);
    this.thoughtBadgeSprite.scale.set(1.4, 0.48, 1);
    this.thoughtBadgeSprite.position.set(0, 2.35, 0);
    this.mesh.add(this.thoughtBadgeSprite);

    this.updateThoughtBadge();

    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  generateShoppingList() {
    const available = [];
    if (CONFIG.UNLOCKS.stand_tomato && CONFIG.UNLOCKS.stand_tomato.unlocked) available.push('TOMATO');
    if (CONFIG.UNLOCKS.stand_wheat && CONFIG.UNLOCKS.stand_wheat.unlocked) available.push('WHEAT');
    if (CONFIG.UNLOCKS.stand_egg && CONFIG.UNLOCKS.stand_egg.unlocked) available.push('EGG');
    if (CONFIG.UNLOCKS.stand_juice && CONFIG.UNLOCKS.stand_juice.unlocked) available.push('JUICE');
    if (CONFIG.UNLOCKS.stand_carrot && CONFIG.UNLOCKS.stand_carrot.unlocked) available.push('CARROT');
    if (CONFIG.UNLOCKS.stand_milk && CONFIG.UNLOCKS.stand_milk.unlocked) available.push('MILK');
    if (CONFIG.UNLOCKS.stand_bread && CONFIG.UNLOCKS.stand_bread.unlocked) available.push('BREAD');
    if (CONFIG.UNLOCKS.stand_cake && CONFIG.UNLOCKS.stand_cake.unlocked) available.push('CAKE');

    if (available.length === 0) available.push('TOMATO');

    const itemCount = this.isVip ? 2 : (1 + Math.floor(Math.random() * 2));
    this.totalNeeded = itemCount;

    for (let i = 0; i < itemCount; i++) {
      const choice = available[Math.floor(Math.random() * available.length)];
      this.shoppingList.push(choice);
    }
  }

  updateThoughtBadge(customText = null) {
    if (!this.thoughtCtx) return;

    if (this.state === 'LEAVE') {
      this.thoughtBadgeSprite.visible = false;
      return;
    }

    this.thoughtBadgeSprite.visible = true;
    let icon = '🛍️';
    if (this.shoppingList.length > 0) {
      const def = CONFIG.ITEMS[this.shoppingList[0]];
      if (def) icon = def.icon;
    } else if (this.basketItems.length > 0) {
      const def = CONFIG.ITEMS[this.basketItems[0]];
      if (def) icon = def.icon;
    }

    const ctx = this.thoughtCtx;
    ctx.clearRect(0, 0, 300, 96);

    ctx.fillStyle = this.isVip ? '#fff8e1' : (this.waitingForRestock ? '#ffebee' : '#ffffff');
    ctx.beginPath();
    ctx.arc(48, 48, 40, Math.PI / 2, Math.PI * 1.5);
    ctx.arc(252, 48, 40, -Math.PI / 2, Math.PI / 2);
    ctx.closePath();
    ctx.fill();

    ctx.lineWidth = 5;
    ctx.strokeStyle = this.isVip ? '#ffb300' : (this.waitingForRestock ? '#e53935' : '#111111');
    ctx.stroke();

    ctx.font = 'bold 44px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#111111';

    if (this.state === 'QUEUE' || this.state === 'PAY') {
      const total = this.calculateBill();
      ctx.fillText(`💵 $${total}`, 150, 50);
    } else if (this.waitingForRestock) {
      ctx.fillText(`${icon} ⏳`, 150, 50);
    } else {
      ctx.fillText(`${icon} ${this.basketItems.length}/${this.totalNeeded}`, 150, 50);
    }

    this.thoughtTexture.needsUpdate = true;
  }

  calculateBill() {
    let total = 0;
    this.basketItems.forEach(id => {
      total += (CONFIG.getItemSellPrice ? CONFIG.getItemSellPrice(id) : (CONFIG.ITEMS[id] ? CONFIG.ITEMS[id].sellPrice : 1));
    });
    if (this.isVip) total = Math.max(1, Math.round(total * 2.5));
    return Math.max(1, total);
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}

class CustomerManager {
  constructor(scene) {
    this.scene = scene;
    this.customers = [];
    this.spawnTimer = 0;
    this.spawnCounter = 0;
  }

  update(dt, stands, cashRegisters, isCashierPresent, onCheckoutComplete, player, staffList = []) {
    this.spawnTimer += dt;
    const maxCust = CONFIG.CUSTOMER.maxCustomers;

    if (this.spawnTimer >= CONFIG.CUSTOMER.spawnInterval && this.customers.length < maxCust) {
      this.spawnTimer = 0;
      this.spawnCounter++;
      const isVip = Math.random() < CONFIG.CUSTOMER.vipChance;
      this.customers.push(new Customer(this.scene, isVip, 'NORTH'));
    }

    const activeRegister = cashRegisters[0];

    for (let i = this.customers.length - 1; i >= 0; i--) {
      const cust = this.customers[i];

      // 1. Smooth Waypoint Movement with Snap-To-Target (No Overshoot Oscillation)
      const dx = cust.targetPos.x - cust.position.x;
      const dz = cust.targetPos.z - cust.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const stepDist = cust.speed * dt;

      if (dist <= stepDist || dist < 0.08) {
        cust.position.copy(cust.targetPos);
        if (cust.waypoints.length > 0) {
          cust.targetPos.copy(cust.waypoints.shift());
        }
        cust.leftLeg.rotation.x = 0;
        cust.rightLeg.rotation.x = 0;
      } else {
        const dirX = dx / dist;
        const dirZ = dz / dist;
        cust.position.x += dirX * stepDist;
        cust.position.z += dirZ * stepDist;

        const targetRot = Math.atan2(dirX, dirZ);
        let angleDiff = targetRot - cust.currentRotation;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        cust.currentRotation += angleDiff * Math.min(1.0, 10 * dt);

        cust.walkCycle += dt * 6.0;
        cust.leftLeg.rotation.x = Math.sin(cust.walkCycle) * 0.45;
        cust.rightLeg.rotation.x = -Math.sin(cust.walkCycle) * 0.45;
      }

      // Anti-Stuck Auto-Recovery Watchdog
      if (cust.position.distanceTo(cust.lastPosition) < 0.02 && cust.state !== 'PAY' && !cust.waitingForRestock) {
        cust.stuckTimer += dt;
        if (cust.stuckTimer > 2.5) {
          cust.stuckTimer = 0;
          cust.waypoints = []; // Clear waypoints to force fresh path recalculation
        }
      } else {
        cust.stuckTimer = 0;
        cust.lastPosition.copy(cust.position);
      }

      cust.mesh.position.copy(cust.position);
      cust.mesh.rotation.y = cust.currentRotation;

      // 2. State Machine (ENTER -> SHOP -> QUEUE -> PAY -> LEAVE)
      if (cust.state === 'ENTER') {
        const entryTarget = GATES[cust.gate].entryAisle;
        if (cust.position.distanceTo(entryTarget) < 0.4) {
          cust.state = 'SHOP';
        }

      } else if (cust.state === 'SHOP') {
        if (cust.shoppingList.length > 0) {
          const nextItem = cust.shoppingList[0];
          const targetStand = stands.find(s => s.unlocked && s.config.itemId === nextItem);

          if (!targetStand || !targetStand.unlocked) {
            // Stand not available -> skip item gracefully without stalling
            cust.shoppingList.shift();
            cust.updateThoughtBadge();
            continue;
          }

          // Dynamic front approach point: exactly 1.1m in front of any shelf (+Z side)
          const shelfFrontX = targetStand.pos.x;
          const shelfFrontZ = targetStand.pos.z + 1.1;
          const shelfTargetPos = new THREE.Vector3(shelfFrontX, 0, shelfFrontZ);

          if (cust.targetPos.distanceTo(shelfTargetPos) > 0.3 && cust.waypoints.length === 0) {
            cust.waypoints = getCorridorPath(cust.position, shelfTargetPos);
            cust.targetPos.copy(cust.waypoints.shift());
          }

          // Reach Check: Grabs product from shelf when near the front interaction point (1.3m) or center (2.2m)
          const distToFront = cust.position.distanceTo(shelfTargetPos);
          const distToCenter = cust.position.distanceTo(targetStand.pos);
          if (distToFront < 1.3 || distToCenter < 2.2) {
            if (targetStand.hasStock()) {
              const item = targetStand.takeItem();
              if (item) {
                cust.basketItems.push(item);
                cust.shoppingList.shift();
                cust.waitingForRestock = false;
                cust.waypoints = []; // Clear path for next item
                cust.updateThoughtBadge();
                sounds.playPop();
              }
            } else {
              cust.waitingForRestock = true;
              cust.updateThoughtBadge();
            }
          }
        } else {
          // Finished picking all items -> Proceed directly to payment queue
          if (cust.basketItems.length > 0) {
            cust.waitingForRestock = false;
            cust.state = 'QUEUE';
            cust.assignedRegister = activeRegister;
            cust.waypoints = [];
            cust.updateThoughtBadge();
          }
        }

      } else if (cust.state === 'QUEUE') {
        cust.assignedRegister = activeRegister;
        const queue = this.customers.filter(c => (c.state === 'QUEUE' || c.state === 'PAY') && c.assignedRegister === cust.assignedRegister);
        const indexInQueue = queue.indexOf(cust);

        if (indexInQueue === 0) {
          cust.state = 'PAY';
          cust.checkoutTimer = 0;
          cust.targetPos.copy(cust.assignedRegister.customerCheckoutPos);
          cust.currentRotation = 0;
          cust.updateThoughtBadge();
        } else {
          const baseZ = cust.assignedRegister.customerCheckoutPos.z;
          cust.targetPos.set(
            cust.assignedRegister.customerCheckoutPos.x,
            0,
            baseZ - indexInQueue * 1.25
          );
          cust.currentRotation = 0;
        }

      } else if (cust.state === 'PAY') {
        cust.targetPos.copy(cust.assignedRegister.customerCheckoutPos);
        cust.currentRotation = 0;

        // Customer MUST physically be standing right in front of the cash counter
        const isStandingAtCounter = cust.position.distanceTo(cust.assignedRegister.customerCheckoutPos) < 0.45;

        // ONLY process payment when customer is standing at counter AND cashier/player is present!
        if (isStandingAtCounter && isCashierPresent) {
          cust.checkoutTimer += dt;

          if (cust.checkoutTimer >= CONFIG.CUSTOMER.checkoutDuration) {
            cust.checkoutTimer = 0;
            const total = cust.calculateBill();
            cust.assignedRegister.addEarnedCash(total);

            if (onCheckoutComplete) onCheckoutComplete(cust, total);

            cust.basketItems = [];
            cust.state = 'LEAVE';
            cust.updateThoughtBadge();

            // One-way Exit Flow: Move to the LEFT (-X) of the counter first, then north to the West exit gate
            const exitLeftOfCounter = new THREE.Vector3(cust.assignedRegister.pos.x - 3.2, 0, cust.assignedRegister.customerCheckoutPos.z);
            const exitAisleAvenue = new THREE.Vector3(cust.assignedRegister.pos.x - 3.2, 0, GATES.WEST.foyer.z);

            cust.waypoints = [
              exitLeftOfCounter,
              exitAisleAvenue,
              GATES.WEST.foyer.clone(),
              GATES.WEST.door.clone(),
              GATES.WEST.spawn.clone()
            ];
            cust.targetPos.copy(cust.waypoints.shift());
          }
        } else {
          cust.checkoutTimer = 0;
        }

      } else if (cust.state === 'LEAVE') {
        if (cust.waypoints.length === 0 && cust.position.distanceTo(GATES.WEST.spawn) < 0.6) {
          cust.destroy();
          this.customers.splice(i, 1);
        }
      }
    }

    // 3. Lateral Sidestepping Spatial Separation (Prevents head-on stalemates & freezing)
    for (let i = 0; i < this.customers.length; i++) {
      for (let j = i + 1; j < this.customers.length; j++) {
        const c1 = this.customers[i];
        const c2 = this.customers[j];
        if (c1.state === 'PAY' && c2.state === 'PAY') continue;
        if (c1.state === 'QUEUE' && c2.state === 'QUEUE' && c1.targetPos.distanceTo(c2.targetPos) > 0.5) continue;

        const dist = c1.position.distanceTo(c2.position);
        const minDist = 0.85;
        if (dist < minDist && dist > 0.001) {
          const overlap = (minDist - dist) * 0.5;
          const nx = (c1.position.x - c2.position.x) / dist;
          const nz = (c1.position.z - c2.position.z) / dist;

          // Perpendicular lateral deflection vector lets shoppers slip past each other smoothly
          const perpX = -nz * 0.35;
          const perpZ = nx * 0.35;

          c1.position.x += (nx * 0.65 + perpX) * overlap;
          c1.position.z += (nz * 0.65 + perpZ) * overlap;
          c2.position.x -= (nx * 0.65 - perpX) * overlap;
          c2.position.z -= (nz * 0.65 - perpZ) * overlap;
        }
      }
    }
  }
}