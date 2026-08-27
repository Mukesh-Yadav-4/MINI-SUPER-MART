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
    foyer: new THREE.Vector3(-9.5, 0, -4.5)
  },
  NORTH: {
    spawn: new THREE.Vector3(-6.0, 0, -15.5),
    door: new THREE.Vector3(-6.0, 0, -13.5),
    foyer: new THREE.Vector3(-6.0, 0, -11.0)
  },
  EAST: {
    spawn: new THREE.Vector3(19.5, 0, -15.5),
    door: new THREE.Vector3(19.5, 0, -13.5),
    foyer: new THREE.Vector3(19.5, 0, -11.0)
  },
  EAST_EXIT: {
    foyer: new THREE.Vector3(19.5, 0, -4.5),
    door: new THREE.Vector3(22.0, 0, -4.5),
    spawn: new THREE.Vector3(25.0, 0, -4.5)
  }
};

function getCorridorPath(start, dest) {
  const waypoints = [];
  const startZ = start.z;
  const destZ = dest.z;

  const NORTH_CORRIDOR_Z = -11.0;
  const SOUTH_CORRIDOR_Z = -4.5;
  const arteries = [-6.0, 2.15, 7.45, 12.75, 19.5];

  const startInNorth = startZ < -8.5;
  const destInNorth = destZ < -8.5;

  if (startInNorth === destInNorth) {
    // Same corridor (e.g. North wall shelf to North wall shelf, or South to South)
    const corridorZ = startInNorth ? NORTH_CORRIDOR_Z : SOUTH_CORRIDOR_Z;
    if (Math.abs(start.x - dest.x) > 0.6) {
      waypoints.push(new THREE.Vector3(dest.x, 0, corridorZ));
    }
  } else {
    // Cross-aisle transition (North <-> South)
    let bestArtery = arteries[0];
    let minD = 999;
    for (let a of arteries) {
      const d = Math.abs(start.x - a) + Math.abs(dest.x - a);
      if (d < minD) { minD = d; bestArtery = a; }
    }
    const startCorridorZ = startInNorth ? NORTH_CORRIDOR_Z : SOUTH_CORRIDOR_Z;
    const destCorridorZ = destInNorth ? NORTH_CORRIDOR_Z : SOUTH_CORRIDOR_Z;

    waypoints.push(new THREE.Vector3(bestArtery, 0, startCorridorZ));
    waypoints.push(new THREE.Vector3(bestArtery, 0, destCorridorZ));
    if (Math.abs(bestArtery - dest.x) > 0.4) {
      waypoints.push(new THREE.Vector3(dest.x, 0, destCorridorZ));
    }
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

    // Determine entry gate
    this.gate = gateChoice || 'NORTH';
    if (!GATES[this.gate]) this.gate = 'NORTH';
    this.position = GATES[this.gate].spawn.clone();
    this.targetPos = this.position.clone();
    this.lastPosition.copy(this.position);

    // Initial entrance route - enters directly into foyer and begins shopping immediately
    this.waypoints = [
      GATES[this.gate].door.clone(),
      GATES[this.gate].foyer.clone()
    ];
    this.targetPos.copy(this.waypoints.shift());

    this.generateShoppingList();
    this.createMesh();
  }

  createMesh() {
    this.mesh = new THREE.Group();

    // Natural human skin tones
    const skinTones = [0xffe0bd, 0xfcd0a1, 0xe0ac69, 0xc68642, 0x8d5524];
    const skinColor = skinTones[Math.floor(Math.random() * skinTones.length)];

    // Stylish casual clothing palette
    const shirtColors = [0x38bdf8, 0xf43f5e, 0xa855f7, 0x10b981, 0xfbbf24, 0xf472b6, 0xf97316];
    const shirtColor = this.isVip ? 0xd97706 : shirtColors[Math.floor(Math.random() * shirtColors.length)];

    const pantsColors = [0x1e3a8a, 0x334155, 0x475569, 0x1e293b, 0x0284c7];
    const pantsColor = this.isVip ? 0x1e293b : pantsColors[Math.floor(Math.random() * pantsColors.length)];

    const hairColors = [0x1c1917, 0x451a03, 0x78350f, 0xb45309, 0xd97706, 0x18181b];
    const hairColor = this.isVip ? 0x1c1917 : hairColors[Math.floor(Math.random() * hairColors.length)];

    const skinMat = new THREE.MeshLambertMaterial({ color: skinColor });
    const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    const pantsMat = new THREE.MeshLambertMaterial({ color: pantsColor });
    const hairMat = new THREE.MeshLambertMaterial({ color: hairColor });
    const shoeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const darkEyeMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const blushMat = new THREE.MeshLambertMaterial({ color: 0xf472b6 });
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 });

    // 1. Soft contact shadow
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.38, 14), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.mesh.add(shadow);

    // 2. Human Head & Facial Features
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), skinMat);
    head.position.y = 1.44;
    head.castShadow = true;
    this.mesh.add(head);

    // Expressive Eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.038, 6, 6), darkEyeMat);
    eyeL.position.set(-0.08, 1.46, 0.21);
    this.mesh.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.038, 6, 6), darkEyeMat);
    eyeR.position.set(0.08, 1.46, 0.21);
    this.mesh.add(eyeR);

    // Cheerful rosy cheeks
    const blushL = new THREE.Mesh(new THREE.CircleGeometry(0.03, 6), blushMat);
    blushL.position.set(-0.12, 1.40, 0.21);
    this.mesh.add(blushL);
    const blushR = new THREE.Mesh(new THREE.CircleGeometry(0.03, 6), blushMat);
    blushR.position.set(0.12, 1.40, 0.21);
    this.mesh.add(blushR);

    // 3. Hair & Accessories (4 distinct hairstyles + VIP Golden Top Hat)
    const hairStyle = this.isVip ? 'tophat' : ['crop', 'bob', 'ponytail', 'beanie'][Math.floor(Math.random() * 4)];

    if (this.isVip) {
      // Distinguished 3D Golden Top Hat for VIP Golden Billionaires
      const hatMat = new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0xffb300, emissiveIntensity: 0.25 });
      const ribbonMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
      const goldBuckleMat = new THREE.MeshLambertMaterial({ color: 0xffea00 });

      // Brim
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.04, 16), hatMat);
      brim.position.y = 1.62;
      brim.castShadow = true;
      addSketchLines(brim, 0x111111);
      this.mesh.add(brim);

      // Tall Top Hat Crown
      const topHat = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.21, 0.32, 16), hatMat);
      topHat.position.y = 1.78;
      topHat.castShadow = true;
      addSketchLines(topHat, 0x111111);
      this.mesh.add(topHat);

      // Black Silk Ribbon Band
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.06, 16), ribbonMat);
      band.position.y = 1.66;
      this.mesh.add(band);

      // Gold Buckle on Hat
      const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.04), goldBuckleMat);
      buckle.position.set(0, 1.66, 0.23);
      this.mesh.add(buckle);

      // Golden Bowtie on Collar
      const bowtieMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
      const bowtie = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.05), bowtieMat);
      bowtie.position.set(0, 1.25, 0.16);
      this.mesh.add(bowtie);

    } else if (hairStyle === 'fedora') {
      const hatMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 16), hatMat);
      brim.position.y = 1.60;
      this.mesh.add(brim);

      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.18, 16), hatMat);
      crown.position.y = 1.70;
      this.mesh.add(crown);

      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.05, 16), new THREE.MeshLambertMaterial({ color: 0x991b1b }));
      band.position.y = 1.63;
      this.mesh.add(band);

    } else if (hairStyle === 'crop') {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), hairMat);
      hair.scale.set(1.02, 0.8, 1.05);
      hair.position.set(0, 1.54, -0.02);
      this.mesh.add(hair);

      const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.12), hairMat);
      bangs.position.set(0, 1.58, 0.16);
      this.mesh.add(bangs);

    } else if (hairStyle === 'bob') {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), hairMat);
      hair.position.set(0, 1.48, -0.04);
      this.mesh.add(hair);

      const leftSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.24), hairMat);
      leftSide.position.set(-0.22, 1.38, 0.02);
      this.mesh.add(leftSide);

      const rightSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.24), hairMat);
      rightSide.position.set(0.22, 1.38, 0.02);
      this.mesh.add(rightSide);

    } else if (hairStyle === 'ponytail') {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), hairMat);
      hair.position.set(0, 1.52, -0.02);
      this.mesh.add(hair);

      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 0.28, 8), hairMat);
      tail.rotation.x = -0.6;
      tail.position.set(0, 1.48, -0.26);
      this.mesh.add(tail);

      const scrunchie = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.025, 6, 12), new THREE.MeshLambertMaterial({ color: 0xf43f5e }));
      scrunchie.position.set(0, 1.56, -0.22);
      this.mesh.add(scrunchie);

    } else { // Beanie
      const beanieMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
      const beanie = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), beanieMat);
      beanie.position.set(0, 1.54, -0.02);
      this.mesh.add(beanie);
    }

    // 4. Human Torso & Stylish Clothes
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.65, 10), shirtMat);
    torso.position.y = 0.95;
    torso.castShadow = true;
    this.mesh.add(torso);

    // Collar / neckline detail
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 4, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 1.25, 0);
    this.mesh.add(collar);

    // 5. Articulated Human Arms
    const armGeo = new THREE.BoxGeometry(0.1, 0.42, 0.1);

    // Left Arm (Free swinging)
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.32, 1.2, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, shirtMat);
    leftArmMesh.position.y = -0.18;
    leftArmMesh.castShadow = true;
    this.leftArm.add(leftArmMesh);

    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), skinMat);
    leftHand.position.y = -0.4;
    this.leftArm.add(leftHand);
    this.mesh.add(this.leftArm);

    // Right Arm (Holding basket)
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.32, 1.2, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, shirtMat);
    rightArmMesh.position.y = -0.18;
    rightArmMesh.castShadow = true;
    this.rightArm.add(rightArmMesh);

    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), skinMat);
    rightHand.position.y = -0.4;
    this.rightArm.add(rightHand);
    this.mesh.add(this.rightArm);

    // 6. Human Legs & Stylish Sneakers
    const legGeo = new THREE.BoxGeometry(0.14, 0.46, 0.14);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.13, 0.62, 0);
    const lLegMesh = new THREE.Mesh(legGeo, pantsMat);
    lLegMesh.position.y = -0.23;
    lLegMesh.castShadow = true;
    this.leftLeg.add(lLegMesh);

    const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.22), shoeMat);
    lShoe.position.set(0, -0.48, 0.03);
    this.leftLeg.add(lShoe);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.13, 0.62, 0);
    const rLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rLegMesh.position.y = -0.23;
    rLegMesh.castShadow = true;
    this.rightLeg.add(rLegMesh);

    const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.22), shoeMat);
    rShoe.position.set(0, -0.48, 0.03);
    this.rightLeg.add(rShoe);
    this.mesh.add(this.rightLeg);

    // 7. Wicker Shopping Basket
    this.basketAnchor = new THREE.Group();
    this.basketAnchor.position.set(0.38, 0.72, 0.16);

    const basketMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    const basketMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.30), basketMat);
    basketMesh.castShadow = true;
    this.basketAnchor.add(basketMesh);

    // Basket Handle
    const handleMat = new THREE.MeshLambertMaterial({ color: 0x92400e });
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 4, 10), handleMat);
    handle.position.set(0, 0.12, 0);
    this.basketAnchor.add(handle);

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

    const itemCount = this.isVip ? (2 + Math.floor(Math.random() * 2)) : (1 + Math.floor(Math.random() * 2));
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
    ctx.strokeStyle = this.isVip ? '#ffb300' : (this.waitingForRestock ? '#ef4444' : '#111111');
    ctx.stroke();

    ctx.font = 'bold 36px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#111111';

    if (customText) {
      ctx.fillText(customText, 150, 50);
    } else if (this.state === 'QUEUE' || this.state === 'PAY') {
      ctx.fillText(`💵 $`, 150, 50);
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
    if (this.isVip) total = Math.max(1, Math.round(total * 5.0));
    if (sdk && sdk.boostActive) total = Math.round(total * (sdk.boostMultiplier || 2));
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

  spawnVipWave(count = 5) {
    const isEastOpen = CONFIG.UNLOCKS.door_east && CONFIG.UNLOCKS.door_east.unlocked;
    for (let c = 0; c < count; c++) {
      setTimeout(() => {
        const gate = (isEastOpen && c % 2 === 1) ? 'EAST' : 'NORTH';
        this.customers.push(new Customer(this.scene, true, gate));
      }, c * 600);
    }
  }

  update(dt, stands, cashRegisters, isCashier1Present, isCashier2Present = false, onCheckoutComplete = null, player = null, staffList = []) {
    // Backward compatibility if single boolean passed
    if (typeof isCashier2Present !== 'boolean') {
      onCheckoutComplete = isCashier2Present;
      isCashier2Present = false;
    }

    this.spawnTimer += dt;
    const maxCust = CONFIG.CUSTOMER.maxCustomers;
    const isEastOpen = CONFIG.UNLOCKS.door_east && CONFIG.UNLOCKS.door_east.unlocked && CONFIG.UNLOCKS.helper_cashier_2 && CONFIG.UNLOCKS.helper_cashier_2.unlocked;

    if (this.spawnTimer >= CONFIG.CUSTOMER.spawnInterval && this.customers.length < maxCust) {
      this.spawnTimer = 0;
      this.spawnCounter++;
      const isVip = Math.random() < CONFIG.CUSTOMER.vipChance;
      const gate = (isEastOpen && this.spawnCounter % 2 === 1) ? 'EAST' : 'NORTH';
      this.customers.push(new Customer(this.scene, isVip, gate));
    }

    for (let i = this.customers.length - 1; i >= 0; i--) {
      const cust = this.customers[i];

      // 1. Smooth Waypoint Movement with Predictive Obstacle Sidestepping
      const dx = cust.targetPos.x - cust.position.x;
      const dz = cust.targetPos.z - cust.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const stepDist = cust.speed * dt;

      if (dist > 0.05) {
        let moveX = dx / dist;
        let moveZ = dz / dist;

        // Dynamic Predictive Sidestepping: Only shoppers actively browsing steer around each other
        if (cust.state === 'SHOP') {
          for (let j = 0; j < this.customers.length; j++) {
            if (i === j) continue;
            const other = this.customers[j];
            const toOtherX = other.position.x - cust.position.x;
            const toOtherZ = other.position.z - cust.position.z;
            const otherDistSq = toOtherX * toOtherX + toOtherZ * toOtherZ;

            if (otherDistSq < 1.8 && otherDistSq > 0.01) {
              const otherDist = Math.sqrt(otherDistSq);
              const dot = (toOtherX / otherDist) * moveX + (toOtherZ / otherDist) * moveZ;
              // If other person is ahead in forward cone
              if (dot > 0.4) {
                const perpX = -moveZ;
                const perpZ = moveX;
                const steerWeight = (1.35 - otherDist) * 0.7;
                moveX += perpX * steerWeight;
                moveZ += perpZ * steerWeight;
              }
            }
          }
          // Re-normalize movement vector
          const moveLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
          if (moveLen > 0.001) {
            moveX /= moveLen;
            moveZ /= moveLen;
          }
        }

        cust.currentRotation = Math.atan2(moveX, moveZ);
        if (dist <= stepDist) {
          cust.position.x = cust.targetPos.x;
          cust.position.z = cust.targetPos.z;
        } else {
          cust.position.x += moveX * stepDist;
          cust.position.z += moveZ * stepDist;
        }
        cust.walkCycle += dt * 10;
        cust.leftLeg.rotation.x = Math.sin(cust.walkCycle) * 0.45;
        cust.rightLeg.rotation.x = -Math.sin(cust.walkCycle) * 0.45;
        cust.leftArm.rotation.x = -Math.sin(cust.walkCycle) * 0.35;
      } else {
        cust.leftLeg.rotation.x = 0;
        cust.rightLeg.rotation.x = 0;
        cust.leftArm.rotation.x = 0;
        if (cust.waypoints.length > 0) {
          cust.targetPos.copy(cust.waypoints.shift());
          cust.stuckTimer = 0;
        }
      }

      // Responsive Anti-Stuck Watchdog: Break circling and dislodge if delayed on same waypoint
      cust.stuckTimer += dt;
      if (cust.stuckTimer > 2.0 && (cust.state === 'SHOP' || cust.state === 'LEAVE')) {
        cust.stuckTimer = 0;
        if (cust.waypoints.length > 0) {
          cust.position.copy(cust.targetPos);
          cust.targetPos.copy(cust.waypoints.shift());
        } else if (cust.state === 'LEAVE') {
          // Force despawn if stuck near exit threshold
          cust.destroy();
          this.customers.splice(i, 1);
          continue;
        }
      }

      cust.mesh.position.copy(cust.position);
      cust.mesh.rotation.y = cust.currentRotation;

      // 2. State Machine (ENTER -> SHOP -> QUEUE -> PAY -> LEAVE)
      if (cust.state === 'ENTER') {
        const foyerTarget = GATES[cust.gate].foyer;
        if (cust.position.distanceTo(foyerTarget) < 0.8 || cust.waypoints.length === 0) {
          cust.state = 'SHOP';
          cust.waypoints = [];
          cust.stuckTimer = 0;
        }

      } else if (cust.state === 'SHOP') {
        if (cust.shoppingList.length > 0) {
          const nextItem = cust.shoppingList[0];
          const targetStand = stands.find(s => s.unlocked && s.config.itemId === nextItem);

          if (!targetStand || !targetStand.unlocked) {
            cust.shoppingList.shift();
            cust.updateThoughtBadge();
            continue;
          }

          const shelfFrontX = targetStand.pos.x;
          const shelfFrontZ = targetStand.pos.z + 1.1;
          const shelfTargetPos = new THREE.Vector3(shelfFrontX, 0, shelfFrontZ);

          if (cust.targetPos.distanceTo(shelfTargetPos) > 0.3 && cust.waypoints.length === 0) {
            cust.waypoints = getCorridorPath(cust.position, shelfTargetPos);
            cust.targetPos.copy(cust.waypoints.shift());
            cust.stuckTimer = 0;
          }

          const distFrontSq = (cust.position.x - shelfFrontX) ** 2 + (cust.position.z - shelfFrontZ) ** 2;
          const distCenterSq = (cust.position.x - targetStand.pos.x) ** 2 + (cust.position.z - targetStand.pos.z) ** 2;
          if (distFrontSq < 1.69 || distCenterSq < 4.84) {
            if (targetStand.hasStock()) {
              const item = targetStand.takeItem();
              if (item) {
                cust.basketItems.push(item);
                cust.shoppingList.shift();
                cust.waitingForRestock = false;
                cust.waypoints = [];
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

            // Route to Register #2 if unlocked and customer is on the East side
            const hasReg2 = cashRegisters.length > 1 && ((CONFIG.UNLOCKS.helper_cashier_2 && CONFIG.UNLOCKS.helper_cashier_2.unlocked) || isCashier2Present);
            if (hasReg2 && (cust.gate === 'EAST' || cust.position.x > 5.0)) {
              cust.assignedRegister = cashRegisters[1];
            } else {
              cust.assignedRegister = cashRegisters[0];
            }

            cust.waypoints = [];
            cust.updateThoughtBadge();
            cust.stuckTimer = 0;
          }
        }

      } else if (cust.state === 'QUEUE') {
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

        const regCheckoutPos = cust.assignedRegister.customerCheckoutPos;
        const distPaySq = (cust.position.x - regCheckoutPos.x) ** 2 + (cust.position.z - regCheckoutPos.z) ** 2;
        const isStandingAtCounter = distPaySq < 0.25;
        const isReg2 = (cashRegisters.length > 1 && cust.assignedRegister === cashRegisters[1]);
        const isStaffed = isReg2 ? isCashier2Present : isCashier1Present;

        if (isStandingAtCounter && isStaffed) {
          cust.checkoutTimer += dt;

          if (cust.checkoutTimer >= CONFIG.CUSTOMER.checkoutDuration) {
            cust.checkoutTimer = 0;
            const total = cust.calculateBill();
            cust.assignedRegister.addEarnedCash(total);

            if (onCheckoutComplete) onCheckoutComplete(cust, total);

            cust.basketItems = [];
            cust.state = 'LEAVE';
            cust.updateThoughtBadge();
            cust.stuckTimer = 0;

            if (isReg2) {
              // Exit via Right Wall Exit Gate (East Side Wall)
              cust.waypoints = [
                new THREE.Vector3(21.0, 0, cust.assignedRegister.customerCheckoutPos.z),
                new THREE.Vector3(21.0, 0, GATES.EAST_EXIT.door.z),
                new THREE.Vector3(24.5, 0, GATES.EAST_EXIT.door.z)
              ];
            } else {
              // Exit via West Gate: clean linear trajectory without backtracks
              const exitAisleX = -9.5;
              const exitDoorZ = -4.5;
              cust.waypoints = [
                new THREE.Vector3(exitAisleX, 0, cust.assignedRegister.customerCheckoutPos.z),
                new THREE.Vector3(exitAisleX, 0, exitDoorZ),
                new THREE.Vector3(-12.5, 0, exitDoorZ),
                new THREE.Vector3(-15.5, 0, exitDoorZ)
              ];
            }
            cust.targetPos.copy(cust.waypoints.shift());
          }
        } else {
          cust.checkoutTimer = 0;
        }

      } else if (cust.state === 'LEAVE') {
        // Immediate clean despawn if outside the building boundary
        const isOutsideWest = (cust.position.x <= -12.2);
        const isOutsideEast = (cust.position.x >= 22.2);
        const isOutsideNorth = (cust.position.z <= -14.2);

        if (isOutsideWest || isOutsideEast || isOutsideNorth || cust.waypoints.length === 0) {
          if (isOutsideWest || isOutsideEast || isOutsideNorth ||
              cust.position.distanceTo(GATES.WEST.spawn) < 1.2 ||
              cust.position.distanceTo(GATES.EAST_EXIT.spawn) < 1.2 ||
              cust.position.distanceTo(GATES.EAST.spawn) < 1.2 ||
              cust.position.distanceTo(GATES.NORTH.spawn) < 1.2) {
            cust.destroy();
            this.customers.splice(i, 1);
            continue;
          }
        }
      }
    }

    // 3. Mutual Soft Contact Separation with Fast Early-Rejection Bounding Box
    for (let i = 0; i < this.customers.length; i++) {
      for (let j = i + 1; j < this.customers.length; j++) {
        const c1 = this.customers[i];
        const c2 = this.customers[j];
        if (c1.state === 'PAY' && c2.state === 'PAY') continue;
        if (c1.state === 'QUEUE' && c2.state === 'QUEUE') continue;
        // Don't fight for space at doorways when both are leaving
        if (c1.state === 'LEAVE' && c2.state === 'LEAVE') continue;

        const dx = c1.position.x - c2.position.x;
        if (dx > 0.85 || dx < -0.85) continue;
        const dz = c1.position.z - c2.position.z;
        if (dz > 0.85 || dz < -0.85) continue;

        const distSq = dx * dx + dz * dz;
        const minDist = 0.85;
        const minDistSq = 0.7225; // 0.85 * 0.85

        if (distSq < minDistSq && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const overlap = (minDist - dist) * 0.5;
          const nx = dx / dist;
          const nz = dz / dist;

          const isC1Static = (c1.state === 'QUEUE' || c1.state === 'PAY');
          const isC2Static = (c2.state === 'QUEUE' || c2.state === 'PAY');
          const isC1Leaving = (c1.state === 'LEAVE');
          const isC2Leaving = (c2.state === 'LEAVE');

          if (isC1Static && !isC2Static) {
            c2.position.x -= nx * (overlap * 2.0);
            c2.position.z -= nz * (overlap * 2.0);
          } else if (!isC1Static && isC2Static) {
            c1.position.x += nx * (overlap * 2.0);
            c1.position.z += nz * (overlap * 2.0);
          } else if (isC1Leaving && !isC2Leaving) {
            // Shopper yields to exiting customer
            c2.position.x -= nx * (overlap * 2.0);
            c2.position.z -= nz * (overlap * 2.0);
          } else if (!isC1Leaving && isC2Leaving) {
            // Shopper yields to exiting customer
            c1.position.x += nx * (overlap * 2.0);
            c1.position.z += nz * (overlap * 2.0);
          } else {
            // Symmetric separation
            c1.position.x += nx * overlap;
            c1.position.z += nz * overlap;
            c2.position.x -= nx * overlap;
            c2.position.z -= nz * overlap;
          }
        }
      }
    }
  }
}