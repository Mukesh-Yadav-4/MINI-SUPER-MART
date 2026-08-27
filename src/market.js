// 3D Market Furniture with Dynamic Shelf Upgrades, Black Outlines & Large Badges
function addStructureOutline(mesh, color = 0x111111) {
  if (!mesh || !mesh.geometry) return;
  try {
    const edges = new THREE.EdgesGeometry(mesh.geometry, 28);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: color, linewidth: 2.5 }));
    mesh.add(line);
    return line;
  } catch (e) {
    return null;
  }
}

class MarketStand {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.pos = new THREE.Vector3(config.pos.x, 0, config.pos.z);
    this.itemDef = CONFIG.ITEMS[config.itemId];
    this.unlocked = config.unlocked || false;
    this.stock = [];

    this.refreshStats();
    this.createMesh();
  }

  refreshStats() {
    const upg = CONFIG.UPGRADES.stand_capacity;
    const capLvl = Math.min(upg.currentLevel || 0, upg.levels.length - 1);
    this.capacity = upg.levels[capLvl] || 6;
    if (this.badgeCtx) this.updateBadge();
  }

  createMesh() {
    this.group = new THREE.Group();
    this.group.position.set(this.pos.x, 0, this.pos.z);

    const width = 2.4;
    const depth = 1.6;
    const itemId = this.config.itemId;

    // Contact Ground Shadow Decal
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x1b2e1b, transparent: true, opacity: 0.35 });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(width + 1.2, depth + 1.0), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.012;
    this.group.add(shadow);

    const matGeo = new THREE.PlaneGeometry(width + 0.8, depth + 0.8);
    const matMesh = new THREE.Mesh(matGeo, new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.FLOOR_MAT }));
    matMesh.rotation.x = -Math.PI / 2;
    matMesh.position.y = 0.018;
    matMesh.receiveShadow = true;
    addStructureOutline(matMesh, 0x111111);
    this.group.add(matMesh);

    if (itemId === 'MILK') {
      const fridgeMat = new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.BLUE_FRIDGE });
      const glassMat = new THREE.MeshLambertMaterial({ color: 0xe1f5fe, transparent: true, opacity: 0.85 });

      const frame = new THREE.Mesh(new THREE.BoxGeometry(width, 2.5, depth), fridgeMat);
      frame.position.y = 1.25;
      frame.castShadow = true;
      addStructureOutline(frame, 0x111111);
      this.group.add(frame);

      const glassLeft = new THREE.Mesh(new THREE.BoxGeometry(width/2 - 0.15, 1.8, 0.08), glassMat);
      glassLeft.position.set(-width/4, 1.3, depth/2 + 0.05);
      addStructureOutline(glassLeft, 0x111111);
      this.group.add(glassLeft);

      const glassRight = new THREE.Mesh(new THREE.BoxGeometry(width/2 - 0.15, 1.8, 0.08), glassMat);
      glassRight.position.set(width/4, 1.3, depth/2 + 0.05);
      addStructureOutline(glassRight, 0x111111);
      this.group.add(glassRight);

      const bottomVent = new THREE.Mesh(new THREE.BoxGeometry(width - 0.2, 0.35, 0.1), new THREE.MeshLambertMaterial({ color: 0xffffff }));
      bottomVent.position.set(0, 0.25, depth/2 + 0.05);
      addStructureOutline(bottomVent, 0x111111);
      this.group.add(bottomVent);

    } else if (itemId === 'EGG') {
      const woodMat = new THREE.MeshLambertMaterial({ color: 0xd7a15c });
      const darkWoodMat = new THREE.MeshLambertMaterial({ color: 0x6d3915 });

      const base = new THREE.Mesh(new THREE.BoxGeometry(width, 0.7, depth), woodMat);
      base.position.y = 0.35;
      base.castShadow = true;
      addStructureOutline(base, 0x111111);
      this.group.add(base);

      const counter = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, 0.12, depth + 0.2), darkWoodMat);
      counter.position.y = 0.76;
      counter.castShadow = true;
      addStructureOutline(counter, 0x111111);
      this.group.add(counter);

      const nestTier = new THREE.Mesh(new THREE.BoxGeometry(width - 0.3, 0.25, depth - 0.3), new THREE.MeshLambertMaterial({ color: 0xffe082 }));
      nestTier.position.y = 0.9;
      nestTier.castShadow = true;
      addStructureOutline(nestTier, 0x111111);
      this.group.add(nestTier);

    } else if (itemId === 'CAKE') {
      const standMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const goldMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
      const glassMat = new THREE.MeshLambertMaterial({ color: 0xe0f7fa, transparent: true, opacity: 0.65 });

      const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 0.7, 16), standMat);
      pedestal.position.y = 0.35;
      pedestal.castShadow = true;
      addStructureOutline(pedestal, 0x111111);
      this.group.add(pedestal);

      const goldRing = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.08, 16), goldMat);
      goldRing.position.y = 0.72;
      addStructureOutline(goldRing, 0x111111);
      this.group.add(goldRing);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
      dome.position.y = 0.76;
      addStructureOutline(dome, 0x111111);
      this.group.add(dome);

    } else if (itemId === 'WHEAT') {
      const woodMat = new THREE.MeshLambertMaterial({ color: 0xa1887f });
      const goldMat = new THREE.MeshLambertMaterial({ color: 0xffca28 });

      const crate = new THREE.Mesh(new THREE.BoxGeometry(width, 0.6, depth), woodMat);
      crate.position.y = 0.3;
      crate.castShadow = true;
      addStructureOutline(crate, 0x111111);
      this.group.add(crate);

      const sheafBanner = new THREE.Mesh(new THREE.BoxGeometry(width * 0.8, 0.35, 0.08), goldMat);
      sheafBanner.position.set(0, 0.8, -depth/2);
      addStructureOutline(sheafBanner, 0x111111);
      this.group.add(sheafBanner);

    } else {
      const woodMat = new THREE.MeshLambertMaterial({ color: 0xc8965a });
      const darkWoodMat = new THREE.MeshLambertMaterial({ color: 0x5a3818 });
      const strawBedMat = new THREE.MeshLambertMaterial({ color: 0xfde047 });
      const chalkMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });

      const base = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, depth), darkWoodMat);
      base.position.y = 0.2;
      base.castShadow = true;
      addStructureOutline(base, 0x111111);
      this.group.add(base);

      const lowerTray = new THREE.Mesh(new THREE.BoxGeometry(width, 0.35, depth), woodMat);
      lowerTray.position.y = 0.55;
      lowerTray.castShadow = true;
      addStructureOutline(lowerTray, 0x111111);
      this.group.add(lowerTray);

      // Straw bedding inside lower produce tray
      const strawBed = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, 0.05, depth - 0.1), strawBedMat);
      strawBed.position.y = 0.72;
      this.group.add(strawBed);

      // Front Chalkboard Price Tag Strip
      const priceStrip = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.12, 0.04), chalkMat);
      priceStrip.position.set(0, 0.55, depth / 2 + 0.02);
      this.group.add(priceStrip);

      const upperTier = new THREE.Mesh(new THREE.BoxGeometry(width, 0.28, depth * 0.7), woodMat);
      upperTier.position.set(0, 1.1, -0.2);
      upperTier.rotation.x = 0.15;
      upperTier.castShadow = true;
      addStructureOutline(upperTier, 0x111111);
      this.group.add(upperTier);

      const backboard = new THREE.Mesh(new THREE.BoxGeometry(width, 0.8, 0.1), woodMat);
      backboard.position.set(0, 1.6, -depth/2 + 0.05);
      backboard.castShadow = true;
      addStructureOutline(backboard, 0x111111);
      this.group.add(backboard);

      const plaque = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16), darkWoodMat);
      plaque.rotation.x = Math.PI / 2;
      plaque.position.set(0, 2.05, -depth/2 + 0.08);
      addStructureOutline(plaque, 0x111111);
      this.group.add(plaque);

      const itemIconBadge = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshLambertMaterial({ color: this.itemDef.color }));
      itemIconBadge.position.set(0, 2.05, -depth/2 + 0.14);
      addStructureOutline(itemIconBadge, 0x111111);
      this.group.add(itemIconBadge);
    }

    this.itemGridAnchor = new THREE.Group();
    this.itemGridAnchor.position.set(0, itemId === 'MILK' ? 0.6 : (itemId === 'EGG' ? 1.05 : 0.75), 0);
    this.group.add(this.itemGridAnchor);

    // Large Canvas Badge Sprite for Shelf Capacity
    this.badgeCanvas = document.createElement('canvas');
    this.badgeCanvas.width = 300;
    this.badgeCanvas.height = 96;
    this.badgeCtx = this.badgeCanvas.getContext('2d');
    this.badgeTexture = new THREE.CanvasTexture(this.badgeCanvas);
    this.badgeTexture.minFilter = THREE.LinearFilter;

    const badgeMat = new THREE.SpriteMaterial({ map: this.badgeTexture, transparent: true, depthTest: false });
    this.badgeSprite = new THREE.Sprite(badgeMat);
    this.badgeSprite.scale.set(1.5, 0.5, 1);
    this.badgeSprite.position.set(0, itemId === 'MILK' ? 3.0 : 2.65, 0);
    this.group.add(this.badgeSprite);

    this.updateBadge();

    this.group.visible = this.unlocked;
    this.scene.add(this.group);
  }

  updateBadge() {
    if (!this.badgeCtx) return;
    const count = this.stock.length;
    const isFull = count >= this.capacity;
    const bg = count === 0 ? '#ffcdd2' : (isFull ? '#c8e6c9' : '#ffffff');
    const textColor = count === 0 ? '#c62828' : (isFull ? '#2e7d32' : '#111111');

    const ctx = this.badgeCtx;
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
    ctx.fillStyle = textColor;
    ctx.fillText(`${this.itemDef.icon} ${count}/${this.capacity}`, 150, 50);

    this.badgeTexture.needsUpdate = true;
  }

  setUnlocked(unlocked) {
    this.unlocked = unlocked;
    this.group.visible = unlocked;
    if (unlocked) {
      this.refreshStats();
      this.updateBadge();
    }
  }

  getSlotPosition(index) {
    const cols = 3;
    const rows = 2;
    const col = index % cols;
    const row = Math.floor(index / cols) % rows;
    const layer = Math.floor(index / (cols * rows));

    const spacingX = 0.58;
    const spacingZ = 0.44;
    const spacingY = 0.28;

    return new THREE.Vector3(
      (col - 1) * spacingX,
      layer * spacingY + (row === 0 && this.config.itemId !== 'EGG' ? 0.32 : 0),
      (row - 0.5) * spacingZ
    );
  }

  addItem() {
    if (this.stock.length >= this.capacity) return false;

    const mesh = Player.createItemMesh(this.config.itemId);
    const targetPos = this.getSlotPosition(this.stock.length);
    mesh.position.copy(targetPos);
    mesh.scale.set(0.1, 0.1, 0.1);

    this.itemGridAnchor.add(mesh);
    this.stock.push({
      mesh: mesh,
      currentScale: 0.1
    });

    this.updateBadge();
    sounds.playPlace();
    return true;
  }

  takeItem() {
    if (this.stock.length === 0) return null;

    const item = this.stock.pop();
    this.itemGridAnchor.remove(item.mesh);
    this.updateBadge();
    return this.config.itemId;
  }

  isFull() {
    return this.stock.length >= this.capacity;
  }

  hasStock() {
    return this.stock.length > 0;
  }

  update(dt) {
    if (!this.unlocked) return;

    for (let item of this.stock) {
      if (item.currentScale < 1.0) {
        item.currentScale = Math.min(1.0, item.currentScale + dt * 6);
        item.mesh.scale.set(item.currentScale, item.currentScale, item.currentScale);
      }
    }
  }
}

// Cashier Counter with Turquoise Top, Black Outlines & POS Terminal
class CashRegister {
  constructor(scene, pos = { x: -6.5, z: 1.5 }) {
    this.scene = scene;
    this.pos = new THREE.Vector3(pos.x, 0, pos.z);
    this.moneyPiles = [];
    this.uncollectedCash = 0;
    this.hasCashier = false;

    this.createMesh();
  }

  createMesh() {
    this.group = new THREE.Group();
    this.group.position.set(this.pos.x, 0, this.pos.z);

    // Contact Ground Shadow Decal
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x1b2e1b, transparent: true, opacity: 0.35 });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.0), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.012;
    this.group.add(shadow);

    const floorMat = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.4), new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.FLOOR_MAT }));
    floorMat.rotation.x = -Math.PI / 2;
    floorMat.position.y = 0.018;
    floorMat.receiveShadow = true;
    addStructureOutline(floorMat, 0x111111);
    this.group.add(floorMat);

    // Counter Base
    const deskBase = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.85, 1.1), new THREE.MeshLambertMaterial({ color: 0xf8fafc }));
    deskBase.position.y = 0.425;
    deskBase.castShadow = true;
    addStructureOutline(deskBase, 0x111111);
    this.group.add(deskBase);

    // Turquoise Gloss Countertop
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.12, 1.2), new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.COUNTER_CYAN }));
    deskTop.position.y = 0.91;
    deskTop.castShadow = true;
    addStructureOutline(deskTop, 0x111111);
    this.group.add(deskTop);

    // Black Rubber Grocery Conveyor Belt
    const beltMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const railMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });

    const conveyor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.55), beltMat);
    conveyor.position.set(0.6, 0.99, 0);
    this.group.add(conveyor);

    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.03), railMat);
    rail1.position.set(0.6, 1.02, 0.28);
    this.group.add(rail1);
    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.03), railMat);
    rail2.position.set(0.6, 1.02, -0.28);
    this.group.add(rail2);

    // POS Screen & Register System
    const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.08), new THREE.MeshLambertMaterial({ color: 0x212121 }));
    monitor.position.set(-0.1, 1.3, 0);
    monitor.rotation.x = 0.2;
    addStructureOutline(monitor, 0x111111);
    this.group.add(monitor);

    const monitorScreen = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.34, 0.02), new THREE.MeshBasicMaterial({ color: 0x69f0ae }));
    monitorScreen.position.set(-0.1, 1.3, -0.05);
    monitorScreen.rotation.x = 0.2;
    this.group.add(monitorScreen);

    // Credit Card Reader & Pin Pad
    const pinPadMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const pinPad = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.24), pinPadMat);
    pinPad.position.set(-0.1, 1.0, -0.42);
    pinPad.rotation.x = -0.3;
    this.group.add(pinPad);

    // Handheld Barcode Laser Scanner
    const scanner = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.12), new THREE.MeshLambertMaterial({ color: 0xef4444 }));
    scanner.position.set(0.2, 1.02, -0.38);
    this.group.add(scanner);

    // Countertop Impulse Snack Display Rack
    const snackMat1 = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
    const snackMat2 = new THREE.MeshLambertMaterial({ color: 0x10b981 });
    const rack = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.22), new THREE.MeshLambertMaterial({ color: 0x64748b }));
    rack.position.set(1.2, 1.05, -0.35);
    this.group.add(rack);

    const pack1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.06), snackMat1);
    pack1.position.set(1.12, 1.16, -0.35);
    this.group.add(pack1);
    const pack2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.06), snackMat2);
    pack2.position.set(1.24, 1.16, -0.35);
    this.group.add(pack2);

    // Customer Queue Brass Stanchions & Velvet Guide Rope
    const brassMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
    const ropeMat = new THREE.MeshLambertMaterial({ color: 0x991b1b });

    const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.85, 8), brassMat);
    post1.position.set(-1.3, 0.425, -1.2);
    this.group.add(post1);
    const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.85, 8), brassMat);
    post2.position.set(1.3, 0.425, -1.2);
    this.group.add(post2);

    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.6, 6), ropeMat);
    rope.rotation.z = Math.PI / 2;
    rope.position.set(0, 0.72, -1.2);
    this.group.add(rope);

    this.cashAnchor = new THREE.Group();
    this.cashAnchor.position.set(-0.85, 0.97, 0);
    this.group.add(this.cashAnchor);

    // Pre-allocate 16 cash bill stacks in pool for zero-GC transactions
    this.cashMeshPool = [];
    const cashMat = new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.MONEY_GREEN });
    const bandMat = new THREE.MeshLambertMaterial({ color: 0xffeb3b });
    const billGeo = new THREE.BoxGeometry(0.42, 0.09, 0.24);
    const bandGeo = new THREE.BoxGeometry(0.12, 0.1, 0.25);

    for (let i = 0; i < 16; i++) {
      const meshGroup = new THREE.Group();
      const billStack = new THREE.Mesh(billGeo, cashMat);
      billStack.castShadow = true;
      addStructureOutline(billStack, 0x111111);
      meshGroup.add(billStack);

      const band = new THREE.Mesh(bandGeo, bandMat);
      addStructureOutline(band, 0x111111);
      meshGroup.add(band);

      const col = i % 2;
      const layer = Math.floor(i / 2);
      meshGroup.position.set((col - 0.5) * 0.46, layer * 0.09, 0);
      meshGroup.visible = false;

      this.cashAnchor.add(meshGroup);
      this.cashMeshPool.push(meshGroup);
    }

    this.cashierZonePos = new THREE.Vector3(this.pos.x, 0, this.pos.z + 0.85);
    this.customerCheckoutPos = new THREE.Vector3(this.pos.x, 0, this.pos.z - 0.85);
    this.cashCollectPos = new THREE.Vector3(this.pos.x - 0.85, 0, this.pos.z + 0.85);

    const cashierRing = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 0.8, 16),
      new THREE.MeshBasicMaterial({ color: 0x81c784, side: THREE.DoubleSide })
    );
    cashierRing.rotation.x = -Math.PI / 2;
    cashierRing.position.set(0, 0.02, 0.85);
    this.group.add(cashierRing);

    this.scene.add(this.group);
  }

  static createCashMesh() {
    const group = new THREE.Group();
    const billStack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, 0.24), new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.MONEY_GREEN }));
    billStack.castShadow = true;
    addStructureOutline(billStack, 0x111111);
    group.add(billStack);

    const band = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.25), new THREE.MeshLambertMaterial({ color: 0xffeb3b }));
    addStructureOutline(band, 0x111111);
    group.add(band);

    return group;
  }

  addEarnedCash(amount) {
    this.uncollectedCash += amount;
    const visibleCount = Math.min(16, Math.max(1, Math.ceil(this.uncollectedCash / 12)));
    for (let i = 0; i < this.cashMeshPool.length; i++) {
      this.cashMeshPool[i].visible = (i < visibleCount);
    }
  }

  collectAllCash() {
    if (this.uncollectedCash <= 0) return 0;
    const collected = this.uncollectedCash;
    this.uncollectedCash = 0;

    for (let i = 0; i < this.cashMeshPool.length; i++) {
      this.cashMeshPool[i].visible = false;
    }

    sounds.playCash();
    return collected;
  }
}

// Red Recycling Dustbin Box
class Dustbin {
  constructor(scene, pos = { x: -9.0, z: -9.5 }) {
    this.scene = scene;
    this.pos = new THREE.Vector3(pos.x, 0, pos.z);
    this.trashCooldown = 0;

    this.createMesh();
  }

  createMesh() {
    this.group = new THREE.Group();
    this.group.position.set(this.pos.x, 0, this.pos.z);

    const redMat = new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.RED_BIN });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x8a0000 });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.85), redMat);
    box.position.y = 0.475;
    box.castShadow = true;
    addStructureOutline(box, 0x111111);
    this.group.add(box);

    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.15, 0.94), darkMat);
    lid.position.y = 0.98;
    lid.castShadow = true;
    addStructureOutline(lid, 0x111111);
    this.group.add(lid);

    const icon = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.02), whiteMat);
    icon.position.set(0, 0.5, 0.44);
    addStructureOutline(icon, 0x111111);
    this.group.add(icon);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.05, 20),
      new THREE.MeshBasicMaterial({ color: 0xe53935, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    this.group.add(ring);

    this.scene.add(this.group);
  }

  update(dt, player, onTrashItem) {
    this.trashCooldown -= dt;

    const dist = player.position.distanceTo(this.pos);
    if (dist < 1.6 && player.stack.length > 0 && this.trashCooldown <= 0) {
      this.trashCooldown = 0.18;
      const trashed = player.popItem();
      if (trashed) {
        sounds.playTrash();
        if (onTrashItem) onTrashItem(trashed, this.pos);
      }
    }
  }
}

// Unlock Zone with Large Floating Price Card & Yellow Arrow
class UnlockZone {
  constructor(scene, config, onUnlocked) {
    this.scene = scene;
    this.config = config;
    this.pos = new THREE.Vector3(config.pos.x, 0, config.pos.z);
    this.remainingCost = config.cost;
    this.totalCost = config.cost;
    this.onUnlocked = onUnlocked;
    this.unlocked = config.unlocked || false;
    this.visible = false;
    this.animTimer = 0;

    this.createMesh();
  }

  createMesh() {
    this.group = new THREE.Group();
    this.group.position.set(this.pos.x, 0.02, this.pos.z);

    const bracketMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const size = 1.4;
    const thickness = 0.08;
    const armLen = 0.4;

    const createCorner = (x, z, rotY) => {
      const cornerGroup = new THREE.Group();
      cornerGroup.position.set(x, 0.02, z);
      cornerGroup.rotation.y = rotY;

      const arm1 = new THREE.Mesh(new THREE.PlaneGeometry(armLen, thickness), bracketMat);
      arm1.rotation.x = -Math.PI / 2;
      arm1.position.set(armLen/2, 0, 0);
      cornerGroup.add(arm1);

      const arm2 = new THREE.Mesh(new THREE.PlaneGeometry(thickness, armLen), bracketMat);
      arm2.rotation.x = -Math.PI / 2;
      arm2.position.set(0, 0, armLen/2);
      cornerGroup.add(arm2);

      return cornerGroup;
    };

    const half = size / 2;
    this.group.add(createCorner(-half, -half, 0));
    this.group.add(createCorner(half, -half, -Math.PI / 2));
    this.group.add(createCorner(half, half, Math.PI));
    this.group.add(createCorner(-half, half, Math.PI / 2));

    const centerGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 })
    );
    centerGlow.rotation.x = -Math.PI / 2;
    this.group.add(centerGlow);

    // Large Canvas Badge Sprite for Title & Price Card (Extra Large High Contrast Font)
    this.cardCanvas = document.createElement('canvas');
    this.cardCanvas.width = 520;
    this.cardCanvas.height = 200;
    this.cardCtx = this.cardCanvas.getContext('2d');
    this.cardTexture = new THREE.CanvasTexture(this.cardCanvas);
    this.cardTexture.minFilter = THREE.LinearFilter;

    const badgeMat = new THREE.SpriteMaterial({ map: this.cardTexture, transparent: true, depthTest: false });
    this.cardSprite = new THREE.Sprite(badgeMat);
    this.cardSprite.scale.set(3.4, 1.3, 1);
    this.cardSprite.position.set(0, 2.35, 0);
    this.group.add(this.cardSprite);

    this.updateCardBadge();

    // Bouncing Yellow Arrow (Positioned UNDER the floating text card, pointing down ⬇)
    const arrowMat = new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.ARROW_YELLOW });
    this.arrowMesh = new THREE.Group();

    const arrowShaft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.45, 0.24), arrowMat);
    arrowShaft.position.y = 0.5;
    addStructureOutline(arrowShaft, 0x111111);
    this.arrowMesh.add(arrowShaft);

    const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.45, 4), arrowMat);
    arrowHead.rotation.x = Math.PI;
    arrowHead.position.y = 0.18;
    addStructureOutline(arrowHead, 0x111111);
    this.arrowMesh.add(arrowHead);

    this.arrowMesh.position.y = 0.8;
    this.group.add(this.arrowMesh);

    this.group.visible = false;
    this.scene.add(this.group);
  }

  getIcon() {
    const id = this.config.id || '';
    if (id.includes('farmer')) return '👨‍🌾';
    if (id.includes('stocker')) return '📦';
    if (id.includes('cashier')) return '🏪';
    if (id.includes('harvester')) return '🚜';
    if (id.includes('chicken')) return '🐔';
    if (id.includes('cow')) return '🐄';
    if (id.includes('tomato')) return '🍅';
    if (id.includes('wheat')) return '🌾';
    if (id.includes('carrot')) return '🌽';
    if (id.includes('egg')) return '🥚';
    if (id.includes('juice') || id.includes('juicer')) return '🥫';
    if (id.includes('milk')) return '🥛';
    if (id.includes('bread') || id.includes('bakery')) return '🍞';
    if (id.includes('cake') || id.includes('cakery')) return '🎂';
    return '🏗️';
  }

  updateCardBadge() {
    if (!this.cardCtx) return;
    const ctx = this.cardCtx;
    const w = 520;
    const h = 200;
    const r = 32;
    ctx.clearRect(0, 0, w, h);

    // Draw Rounded Card Background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h - r);
    ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h);
    ctx.quadraticCurveTo(0, h, 0, h - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();

    // Bold Black Border
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    // Top Title (Building / Worker Name) - Extra Large Pitch Black (40px)
    const icon = this.getIcon();
    const titleText = `${icon} ${this.config.name || 'Expansion'}`;
    ctx.font = '900 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.fillText(titleText, w / 2, 56);

    // Divider Line
    ctx.strokeStyle = '#bbbbbb';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(28, 104);
    ctx.lineTo(w - 28, 104);
    ctx.stroke();

    // Bottom Price Tag - Extra Large Bold Dark Green (62px)
    const formattedCost = this.remainingCost >= 10000 
      ? `${(this.remainingCost / 1000).toFixed(1)}K` 
      : (this.remainingCost >= 1000 ? `${this.remainingCost.toLocaleString()}` : `${this.remainingCost}`);

    ctx.font = '900 62px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#1b5e20';
    ctx.fillText(`💵 $${formattedCost}`, w / 2, 154);

    this.cardTexture.needsUpdate = true;
  }

  setVisible(visible) {
    this.visible = visible;
    this.group.visible = visible && !this.unlocked;
    if (visible && !this.unlocked) this.updateCardBadge();
  }

  spendMoney(amount) {
    if (this.remainingCost <= 0 || this.unlocked) return 0;

    const actual = Math.min(amount, this.remainingCost);
    this.remainingCost -= actual;

    this.updateCardBadge();
    sounds.playCoin();

    if (this.remainingCost <= 0) {
      this.unlocked = true;
      this.group.visible = false;
      sounds.playUnlock();
      if (this.onUnlocked) this.onUnlocked(this.config.id);
    }

    return actual;
  }

  update(dt) {
    if (!this.visible || this.unlocked) return;

    this.animTimer += dt * 4;
    this.cardSprite.position.y = 2.35 + Math.sin(this.animTimer * 0.8) * 0.08;
    this.arrowMesh.position.y = 0.8 + Math.sin(this.animTimer) * 0.12;
  }
}