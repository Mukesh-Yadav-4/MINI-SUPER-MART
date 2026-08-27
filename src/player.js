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
    this.baseCapacity = 6;
    this.capacity = 6;
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
    const strawMat = new THREE.MeshLambertMaterial({ color: 0xffd54f });
    const hatBandMat = new THREE.MeshLambertMaterial({ color: 0xb71c1c });
    const bootMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
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

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.42), shirtMat);
    torso.position.y = 0.95;
    torso.castShadow = true;
    addSketchLines(torso, 0x111111);
    this.mesh.add(torso);

    const overalls = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.5, 0.44), overallsMat);
    overalls.position.y = 0.8;
    overalls.castShadow = true;
    addSketchLines(overalls, 0x0d47a1);
    this.mesh.add(overalls);

    // Brass Buttons on Overalls
    const buttonMat = new THREE.MeshLambertMaterial({ color: 0xffd54f });
    const btnL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 6), buttonMat);
    btnL.rotation.x = Math.PI / 2;
    btnL.position.set(-0.2, 0.92, 0.23);
    this.mesh.add(btnL);
    const btnR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 6), buttonMat);
    btnR.rotation.x = Math.PI / 2;
    btnR.position.set(0.2, 0.92, 0.23);
    this.mesh.add(btnR);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), skinMat);
    head.position.y = 1.62;
    head.castShadow = true;
    addSketchLines(head, 0x111111);
    this.mesh.add(head);

    // Straw Hat with Crisp Outline
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.07, 16), strawMat);
    brim.position.y = 1.78;
    brim.castShadow = true;
    addSketchLines(brim, 0x111111);
    this.mesh.add(brim);

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.34, 16), strawMat);
    crown.position.y = 1.95;
    crown.castShadow = true;
    addSketchLines(crown, 0x111111);
    this.mesh.add(crown);

    const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.445, 0.445, 0.08, 16), hatBandMat);
    ribbon.position.y = 1.84;
    addSketchLines(ribbon, 0x111111);
    this.mesh.add(ribbon);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.24, 0.6, 0.24);
    this.leftLeg = new THREE.Mesh(legGeo, bootMat);
    this.leftLeg.position.set(-0.2, 0.4, 0);
    this.leftLeg.castShadow = true;
    addSketchLines(this.leftLeg, 0x111111);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, bootMat);
    this.rightLeg.position.set(0.2, 0.4, 0);
    this.rightLeg.castShadow = true;
    addSketchLines(this.rightLeg, 0x111111);
    this.mesh.add(this.rightLeg);

    // Leather Backpack on Back
    const leatherMat = new THREE.MeshLambertMaterial({ color: 0x6d4c41 });
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.54, 0.24), leatherMat);
    backpack.position.set(0, 0.95, -0.28);
    backpack.castShadow = true;
    addSketchLines(backpack, 0x111111);
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
      const redMat = new THREE.MeshLambertMaterial({ color: def.color });
      const stemMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });

      const tomato = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), redMat);
      tomato.castShadow = true;
      addSketchLines(tomato, 0x111111);
      group.add(tomato);

      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.08, 5), stemMat);
      leaf.position.y = 0.18;
      addSketchLines(leaf, 0x111111);
      group.add(leaf);

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

    this.capacity = CONFIG.UPGRADES.capacity.levels[capLevel];
    const baseSpd = CONFIG.UPGRADES.speed.levels[spdLevel];
    this.speed = baseSpd * (sdk.boostActive ? 1.5 : 1.0);
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

      this.wobbleVelocity += Math.sin(this.walkCycle * 0.5) * 1.5 * dt;
    } else {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
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