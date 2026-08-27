// 3D Player Character with Bold Black Cartoon Sketch-Pen Outlines & Large Hover Badges
function addSketchLines(mesh, color = 0x111111) {
  if (!mesh || !mesh.geometry) return;
  try {
    const edges = new THREE.EdgesGeometry(mesh.geometry, 28);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: color, linewidth: 2 }));
    mesh.add(line);
  } catch (e) {}
}

class Player {
  constructor(scene) {
    this.scene = scene;
    this.position = new THREE.Vector3(0, 0, 2);
    this.baseSpeed = 9.5;
    this.speed = 9.5;
    this.baseCapacity = 4;
    this.capacity = 4;
    this.stack = [];
    this.currentRotation = 0;
    this.walkCycle = 0;
    this.wobbleAngle = 0;
    this.wobbleVelocity = 0;

    this.createMesh();
  }

  createMesh() {
    this.mesh = new THREE.Group();

    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffd180 });
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0xe53935 });
    const overallsMat = new THREE.MeshLambertMaterial({ color: 0x1e88e5 });
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
    const strawMat = new THREE.MeshLambertMaterial({ color: 0xffd54f });
    const hatBandMat = new THREE.MeshLambertMaterial({ color: 0xb71c1c });
    const bootMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
    const darkEyeMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const blushMat = new THREE.MeshLambertMaterial({ color: 0xf472b6 });
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.65, side: THREE.DoubleSide });

    // Blob Contact Shadow
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.56, 16), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.mesh.add(shadow);

    // Glowing Player Selection Ring
    this.selectionRing = new THREE.Mesh(new THREE.RingGeometry(0.58, 0.68, 32), ringMat);
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.position.y = 0.025;
    this.mesh.add(this.selectionRing);

    // Human Head & Friendly Face
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

    // Cheerful rosy cheeks
    const blushL = new THREE.Mesh(new THREE.CircleGeometry(0.03, 6), blushMat);
    blushL.position.set(-0.13, 1.50, 0.23);
    this.mesh.add(blushL);
    const blushR = new THREE.Mesh(new THREE.CircleGeometry(0.03, 6), blushMat);
    blushR.position.set(0.13, 1.50, 0.23);
    this.mesh.add(blushR);

    // Friendly smile
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.015, 4, 8, Math.PI), new THREE.MeshLambertMaterial({ color: 0xb71c1c }));
    smile.rotation.x = Math.PI;
    smile.position.set(0, 1.48, 0.24);
    this.mesh.add(smile);

    // Styled Hair
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), hairMat);
    hair.position.set(0, 1.56, -0.03);
    this.mesh.add(hair);

    const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.07, 0.12), hairMat);
    bangs.position.set(0, 1.62, 0.16);
    this.mesh.add(bangs);

    // Smaller, stylish farmer straw hat
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.04, 16), strawMat);
    brim.position.y = 1.70;
    brim.castShadow = true;
    this.mesh.add(brim);

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.16, 16), strawMat);
    crown.position.y = 1.79;
    crown.castShadow = true;
    this.mesh.add(crown);

    const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.04, 16), hatBandMat);
    ribbon.position.y = 1.73;
    this.mesh.add(ribbon);

    // Torso & Overalls
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.30, 0.72, 10), shirtMat);
    torso.position.y = 1.0;
    torso.castShadow = true;
    this.mesh.add(torso);

    const overalls = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.52, 0.46), overallsMat);
    overalls.position.y = 0.88;
    overalls.castShadow = true;
    this.mesh.add(overalls);

    // Brass Buttons on Overalls
    const buttonMat = new THREE.MeshLambertMaterial({ color: 0xffd54f });
    const btnL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 6), buttonMat);
    btnL.rotation.x = Math.PI / 2;
    btnL.position.set(-0.16, 1.02, 0.24);
    this.mesh.add(btnL);
    const btnR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 6), buttonMat);
    btnR.rotation.x = Math.PI / 2;
    btnR.position.set(0.16, 1.02, 0.24);
    this.mesh.add(btnR);

    // Articulated Human Arms
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

    // Human Legs & Boots
    const legGeo = new THREE.BoxGeometry(0.16, 0.50, 0.16);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.16, 0.65, 0);
    const lLegMesh = new THREE.Mesh(legGeo, overallsMat);
    lLegMesh.position.y = -0.25;
    lLegMesh.castShadow = true;
    this.leftLeg.add(lLegMesh);

    const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.26), bootMat);
    lBoot.position.set(0, -0.52, 0.04);
    this.leftLeg.add(lBoot);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.16, 0.65, 0);
    const rLegMesh = new THREE.Mesh(legGeo, overallsMat);
    rLegMesh.position.y = -0.25;
    rLegMesh.castShadow = true;
    this.rightLeg.add(rLegMesh);

    const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.26), bootMat);
    rBoot.position.set(0, -0.52, 0.04);
    this.rightLeg.add(rBoot);
    this.mesh.add(this.rightLeg);

    // Leather Backpack on Back
    const leatherMat = new THREE.MeshLambertMaterial({ color: 0x6d4c41 });
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.54, 0.24), leatherMat);
    backpack.position.set(0, 0.95, -0.28);
    backpack.castShadow = true;
    this.mesh.add(backpack);

    // Stack anchor
    this.stackAnchor = new THREE.Group();
    this.stackAnchor.position.set(0, 1.15, -0.32);
    this.mesh.add(this.stackAnchor);

    // Large Crisp Canvas Badge Sprite for Head
    this.headCanvas = document.createElement('canvas');
    this.headCanvas.width = 300;
    this.headCanvas.height = 96;
    this.headCtx = this.headCanvas.getContext('2d');
    this.headTexture = new THREE.CanvasTexture(this.headCanvas);
    this.headTexture.minFilter = THREE.LinearFilter;

    const badgeMat = new THREE.SpriteMaterial({ map: this.headTexture, transparent: true, depthTest: false });
    this.headBadgeSprite = new THREE.Sprite(badgeMat);
    this.headBadgeSprite.scale.set(1.9, 0.62, 1);
    this.headBadgeSprite.position.set(0, 2.7, 0);
    this.headBadgeSprite.visible = false;
    this.mesh.add(this.headBadgeSprite);

    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  updateHeadBadge() {
    if (this.stack.length === 0) {
      this.headBadgeSprite.visible = false;
      return;
    }

    this.headBadgeSprite.visible = true;
    const isFull = this.isFull();
    const icon = isFull ? '⚠️' : '🎒';
    const text = isFull ? 'MAX' : `${this.stack.length}/${this.capacity}`;
    const bg = isFull ? '#e53935' : '#ffffff';
    const color = isFull ? '#ffffff' : '#111111';

    const ctx = this.headCtx;
    ctx.clearRect(0, 0, 300, 96);

    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(48, 48, 40, Math.PI / 2, Math.PI * 1.5);
    ctx.arc(252, 48, 40, -Math.PI / 2, Math.PI / 2);
    ctx.closePath();
    ctx.fill();

    ctx.lineWidth = 5;
    ctx.strokeStyle = '#111111';
    ctx.stroke();

    ctx.font = 'bold 44px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(`${icon} ${text}`, 150, 50);

    this.headTexture.needsUpdate = true;
  }

  static createItemMesh(itemId) {
    const group = new THREE.Group();
    const def = CONFIG.ITEMS[itemId];
    if (!def) return group;

    if (itemId === 'TOMATO') {
      const redMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });
      const stemMat = new THREE.MeshLambertMaterial({ color: 0x166534 });
      const leafMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });

      // Plump organic tomato body with slight squashed top and rounded lobes
      const tomatoBody = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), redMat);
      tomatoBody.scale.set(1.2, 0.95, 1.2);
      tomatoBody.position.y = 0.18;
      tomatoBody.castShadow = true;
      addSketchLines(tomatoBody, 0x111111);
      group.add(tomatoBody);

      // Top calyx star sepals (5 green leaves radiating outward)
      const calyxCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.02, 6), leafMat);
      calyxCenter.position.y = 0.36;
      group.add(calyxCenter);

      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const sepal = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 4), leafMat);
        sepal.rotation.x = Math.PI / 2 + 0.2;
        sepal.rotation.z = -angle;
        sepal.position.set(Math.cos(angle) * 0.09, 0.35, Math.sin(angle) * 0.09);
        addSketchLines(sepal, 0x111111);
        group.add(sepal);
      }

      // Curved realistic green vine stem
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.12, 6), stemMat);
      stem.position.set(0.02, 0.42, 0);
      stem.rotation.z = -0.25;
      addSketchLines(stem, 0x111111);
      group.add(stem);

      // Small fresh vine leaf
      const babyLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 3), leafMat);
      babyLeaf.rotation.z = -1.1;
      babyLeaf.position.set(0.07, 0.43, 0.02);
      group.add(babyLeaf);

    } else if (itemId === 'WHEAT') {
      const wheatMat = new THREE.MeshLambertMaterial({ color: def.color });
      const sheaf = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.45, 8), wheatMat);
      sheaf.castShadow = true;
      addSketchLines(sheaf, 0x111111);
      group.add(sheaf);

      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 8), new THREE.MeshLambertMaterial({ color: 0x8d6e63 }));
      band.position.y = -0.05;
      group.add(band);

    } else if (itemId === 'EGG') {
      const eggMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const egg = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), eggMat);
      egg.scale.set(0.88, 1.3, 0.88);
      egg.position.y = 0.16;
      egg.castShadow = true;
      addSketchLines(egg, 0x111111);
      group.add(egg);

      const nestMat = new THREE.MeshLambertMaterial({ color: 0xffca28 });
      const nestCushion = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.08, 12), nestMat);
      nestCushion.position.y = 0.04;
      addSketchLines(nestCushion, 0x111111);
      group.add(nestCushion);

    } else if (itemId === 'MILK') {
      const cartonMat = new THREE.MeshLambertMaterial({ color: 0x0288d1 });
      const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

      const carton = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 0.24), cartonMat);
      carton.castShadow = true;
      addSketchLines(carton, 0x111111);
      group.add(carton);

      const topSlant = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.12, 4), whiteMat);
      topSlant.rotation.y = Math.PI / 4;
      topSlant.position.y = 0.24;
      addSketchLines(topSlant, 0x111111);
      group.add(topSlant);

    } else if (itemId === 'BREAD') {
      const breadMat = new THREE.MeshLambertMaterial({ color: def.color });
      const loaf = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.24, 0.26), breadMat);
      loaf.castShadow = true;
      addSketchLines(loaf, 0x111111);
      group.add(loaf);

    } else if (itemId === 'JUICE') {
      const canMat = new THREE.MeshLambertMaterial({ color: def.color });
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.35, 10), canMat);
      can.castShadow = true;
      addSketchLines(can, 0x111111);
      group.add(can);

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
      cap.position.y = 0.2;
      group.add(cap);

    } else if (itemId === 'CAKE') {
      const cakeMat = new THREE.MeshLambertMaterial({ color: 0xfff0f5 });
      const icingMat = new THREE.MeshLambertMaterial({ color: 0xf06292 });
      const berryMat = new THREE.MeshLambertMaterial({ color: 0xe53935 });

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 12), cakeMat);
      base.castShadow = true;
      addSketchLines(base, 0x111111);
      group.add(base);

      const topTier = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12), icingMat);
      topTier.position.y = 0.14;
      topTier.castShadow = true;
      addSketchLines(topTier, 0x111111);
      group.add(topTier);

      const strawberry = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 6), berryMat);
      strawberry.position.y = 0.25;
      addSketchLines(strawberry, 0x111111);
      group.add(strawberry);

    } else {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshLambertMaterial({ color: def.color }));
      mesh.castShadow = true;
      addSketchLines(mesh, 0x111111);
      group.add(mesh);
    }

    return group;
  }

  refreshStats() {
    const capLevel = CONFIG.UPGRADES.capacity.currentLevel;
    const spdLevel = CONFIG.UPGRADES.speed.currentLevel;

    this.capacity = CONFIG.UPGRADES.capacity.levels[capLevel] + (sdk.boostActive ? 5 : 0);
    const baseSpd = CONFIG.UPGRADES.speed.levels[spdLevel];
    this.speed = baseSpd * (sdk.boostActive ? 1.35 : 1.0);
    if (this.selectionRing && this.selectionRing.material && this.selectionRing.material.color) {
      this.selectionRing.material.color.setHex(sdk.boostActive ? 0xffd700 : 0x00e5ff);
    }
    this.updateHeadBadge();
  }

  isFull() {
    return this.stack.length >= this.capacity;
  }

  addItem(itemId) {
    if (this.isFull()) return false;

    const mesh = Player.createItemMesh(itemId);
    mesh.position.set(0, this.stack.length * 0.32, 0);
    this.stackAnchor.add(mesh);

    this.stack.push({ type: itemId, mesh: mesh });

    this.wobbleVelocity += 0.35;
    sounds.playPop();
    this.updateHeadBadge();
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

    this.wobbleVelocity -= 0.25;
    this.updateHeadBadge();
    return removed.type;
  }

  hasItem(type) {
    return this.stack.some(i => i.type === type);
  }

  update(dt, inputVector) {
    this.refreshStats();

    const ix = (inputVector && typeof inputVector.x === 'number') ? inputVector.x : 0;
    const iz = (inputVector && typeof inputVector.z === 'number') ? inputVector.z : ((inputVector && typeof inputVector.y === 'number') ? inputVector.y : 0);
    const len = Math.sqrt(ix * ix + iz * iz);
    const isMoving = len > 0.05;

    if (isMoving) {
      const nx = ix / len;
      const nz = iz / len;
      this.position.x += nx * this.speed * dt;
      this.position.z += nz * this.speed * dt;

      const targetRotation = Math.atan2(nx, nz);
      let diff = targetRotation - this.currentRotation;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.currentRotation += diff * Math.min(1.0, 16 * dt);

      this.walkCycle += dt * 14;
      this.leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.6;
      this.rightLeg.rotation.x = -Math.sin(this.walkCycle) * 0.6;
      if (this.leftArm) this.leftArm.rotation.x = -Math.sin(this.walkCycle) * 0.5;
      if (this.rightArm) this.rightArm.rotation.x = Math.sin(this.walkCycle) * 0.5;

      this.wobbleVelocity += Math.sin(this.walkCycle * 0.5) * 1.5 * dt;
    } else {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      if (this.leftArm) this.leftArm.rotation.x = 0;
      if (this.rightArm) this.rightArm.rotation.x = 0;
    }

    const springK = 35.0;
    const damping = 7.0;
    const force = -springK * this.wobbleAngle;
    this.wobbleVelocity += force * dt;
    this.wobbleVelocity *= Math.exp(-damping * dt);
    this.wobbleAngle += this.wobbleVelocity * dt;

    this.stackAnchor.rotation.z = this.wobbleAngle;
    this.stackAnchor.rotation.x = isMoving ? 0.15 : 0;

    if (this.selectionRing) {
      const pulse = 1.0 + Math.sin(performance.now() * 0.005) * 0.08;
      this.selectionRing.scale.set(pulse, pulse, 1);
    }

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.currentRotation;
  }
}