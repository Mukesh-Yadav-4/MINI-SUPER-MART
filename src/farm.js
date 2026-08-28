// 3D Farm Elements: Dynamic Machine Hoppers (4->7), Flock/Herd Upgrades, Wind & Pulse Animations
function addSketchLines(mesh, color = 0x111111) {
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

class CropPatch {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.pos = new THREE.Vector3(config.pos.x, 0, config.pos.z);
    this.unlocked = config.unlocked || false;
    this.crops = [];
    this.growthInterval = config.growthInterval || (CONFIG.ITEMS[config.itemId] ? CONFIG.ITEMS[config.itemId].growthTime : 2.5);
    this.harvestCooldown = 0;
    this.animTimer = Math.random() * 10;

    this.createMesh();
    this.initCrops();
  }

  createMesh() {
    this.group = new THREE.Group();
    this.group.position.set(this.config.pos.x, 0, this.config.pos.z);

    // Contact Ground Shadow Decal
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x1b2e1b, transparent: true, opacity: 0.32 });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.8), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.015;
    this.group.add(shadow);

    const bedGeo = new THREE.BoxGeometry(4.2, 0.22, 2.2);
    const bedMat = new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.DIRT_BROWN });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.position.y = 0.11;
    bed.receiveShadow = true;
    addSketchLines(bed, 0x111111);
    this.group.add(bed);

    const borderGeo = new THREE.BoxGeometry(4.4, 0.28, 2.4);
    const borderMat = new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.WOOD_BORDER });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.y = 0.1;
    border.receiveShadow = true;
    addSketchLines(border, 0x111111);
    this.group.add(border);

    // Corner Brass Brackets
    const bracketMat = new THREE.MeshLambertMaterial({ color: 0xffd54f });
    const corners = [[-2.2, -1.2], [2.2, -1.2], [-2.2, 1.2], [2.2, 1.2]];
    corners.forEach(c => {
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), bracketMat);
      br.position.set(c[0], 0.12, c[1]);
      this.group.add(br);
    });

    this.group.visible = this.unlocked;
    this.scene.add(this.group);
  }

  initCrops() {
    const rows = 2;
    const cols = 4;
    const spacingX = 0.95;
    const spacingZ = 0.75;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cropData = this.createSingleCropMesh(c, r);
        const posX = (c - (cols - 1) / 2) * spacingX;
        const posZ = (r - (rows - 1) / 2) * spacingZ;
        cropData.group.position.set(posX, 0.22, posZ);
        cropData.group.scale.set(0, 0, 0);

        this.group.add(cropData.group);
        this.crops.push({
          mesh: cropData.group,
          parts: cropData.parts,
          posX: posX,
          posZ: posZ,
          progress: Math.random() * 0.8,
          ready: false,
          growthRate: 1.0 / this.growthInterval
        });
      }
    }
  }

  createSingleCropMesh(col, row) {
    const group = new THREE.Group();
    const isTomato = this.config.itemId === 'TOMATO';
    const isCorn = this.config.itemId === 'CARROT';
    const parts = {};

    if (isTomato) {
      const plantMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
      const leafMat = new THREE.MeshLambertMaterial({ color: 0x388e3c });
      const darkStemMat = new THREE.MeshLambertMaterial({ color: 0x1b5e20 });

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.45, 6), darkStemMat);
      stem.position.y = 0.22;
      stem.castShadow = true;
      addSketchLines(stem, 0x111111);
      group.add(stem);

      const bush1 = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), plantMat);
      bush1.position.set(0, 0.38, 0);
      bush1.scale.set(1.2, 0.8, 1.1);
      bush1.castShadow = true;
      addSketchLines(bush1, 0x111111);
      group.add(bush1);

      const bush2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 7, 7), leafMat);
      bush2.position.set(0, 0.54, 0);
      bush2.castShadow = true;
      addSketchLines(bush2, 0x111111);
      group.add(bush2);

      const redMat = new THREE.MeshLambertMaterial({ color: 0xe53935 });
      const sepalMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 });

      const createTomatoFruit = (x, y, z, scale = 1.0) => {
        const fruitGroup = new THREE.Group();
        fruitGroup.position.set(x, y, z);
        fruitGroup.scale.set(scale, scale, scale);

        const tomatoBody = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), redMat);
        tomatoBody.scale.set(1.1, 0.95, 1.1);
        tomatoBody.castShadow = true;
        addSketchLines(tomatoBody, 0x111111);
        fruitGroup.add(tomatoBody);

        const calyx = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.05, 5), sepalMat);
        calyx.position.y = 0.13;
        addSketchLines(calyx, 0x111111);
        fruitGroup.add(calyx);

        return fruitGroup;
      };

      const t1 = createTomatoFruit(0.16, 0.34, 0.14, 1.1);
      const t2 = createTomatoFruit(-0.16, 0.36, -0.12, 0.95);
      const t3 = createTomatoFruit(-0.12, 0.44, 0.16, 0.85);

      group.add(t1);
      group.add(t2);
      group.add(t3);

      parts.tomatoes = [t1, t2, t3];
      parts.bush = bush1;

    } else if (isCorn) {
      // Golden Sweetcorn Stalk with Large Yellow Ears
      const stalkMat = new THREE.MeshLambertMaterial({ color: 0x43a047 });
      const huskMat = new THREE.MeshLambertMaterial({ color: 0x66bb6a });
      const cornMat = new THREE.MeshLambertMaterial({ color: 0xffb300 });

      const stalkGroup = new THREE.Group();

      const mainStalk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.95, 6), stalkMat);
      mainStalk.position.y = 0.475;
      mainStalk.castShadow = true;
      addSketchLines(mainStalk, 0x111111);
      stalkGroup.add(mainStalk);

      // Corn Cob 1
      const cob1 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.4, 8), cornMat);
      cob1.position.set(0.14, 0.52, 0.08);
      cob1.rotation.z = -0.3;
      cob1.castShadow = true;
      addSketchLines(cob1, 0x111111);
      stalkGroup.add(cob1);

      // Corn Cob 2
      const cob2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.36, 8), cornMat);
      cob2.position.set(-0.14, 0.65, -0.06);
      cob2.rotation.z = 0.3;
      cob2.castShadow = true;
      addSketchLines(cob2, 0x111111);
      stalkGroup.add(cob2);

      // Green Leaves
      const leaf1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.14), huskMat);
      leaf1.position.set(0.18, 0.4, 0);
      leaf1.rotation.z = -0.5;
      stalkGroup.add(leaf1);

      const leaf2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.14), huskMat);
      leaf2.position.set(-0.18, 0.55, 0);
      leaf2.rotation.z = 0.5;
      stalkGroup.add(leaf2);

      group.add(stalkGroup);
      parts.stalkGroup = stalkGroup;

    } else {
      const wheatGoldMat = new THREE.MeshLambertMaterial({ color: 0xffca28 });
      const darkGoldMat = new THREE.MeshLambertMaterial({ color: 0xf57f17 });

      const stalkGroup = new THREE.Group();

      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.75, 6), darkGoldMat);
      stalk.position.y = 0.375;
      stalk.castShadow = true;
      addSketchLines(stalk, 0x111111);
      stalkGroup.add(stalk);

      for (let i = 0; i < 3; i++) {
        const kernel = new THREE.Mesh(new THREE.ConeGeometry(0.16 - i * 0.03, 0.22, 6), wheatGoldMat);
        kernel.position.set(0, 0.65 + i * 0.16, 0);
        kernel.castShadow = true;
        addSketchLines(kernel, 0x111111);
        stalkGroup.add(kernel);
      }

      const awn1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4), darkGoldMat);
      awn1.rotation.z = 0.4;
      awn1.position.set(0.12, 0.95, 0);
      stalkGroup.add(awn1);

      const awn2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4), darkGoldMat);
      awn2.rotation.z = -0.4;
      awn2.position.set(-0.12, 0.95, 0);
      stalkGroup.add(awn2);

      group.add(stalkGroup);
      parts.stalkGroup = stalkGroup;
    }

    return { group, parts };
  }

  update(dt, growthMultiplier = 1.0) {
    if (!this.unlocked) return;

    this.harvestCooldown -= dt;
    this.animTimer += dt;

    const isTomato = this.config.itemId === 'TOMATO';

    for (let crop of this.crops) {
      if (!crop.ready) {
        crop.progress += crop.growthRate * dt * growthMultiplier;
        if (crop.progress >= 1.0) {
          crop.progress = 1.0;
          crop.ready = true;
        }
        const s = Math.min(1.0, crop.progress);
        crop.mesh.scale.set(s, s, s);
      }

      if (crop.ready) {
        if (isTomato) {
          const bounce = 1.0 + Math.sin(this.animTimer * 4.0 + crop.posX * 2) * 0.06;
          crop.mesh.scale.set(bounce, bounce, bounce);
        } else {
          const wind = Math.sin(this.animTimer * 3.0 + crop.posX * 1.5 + crop.posZ * 2.0) * 0.14;
          if (crop.parts.stalkGroup) {
            crop.parts.stalkGroup.rotation.z = wind;
            crop.parts.stalkGroup.rotation.x = Math.cos(this.animTimer * 2.5 + crop.posX) * 0.06;
          }
        }
      }
    }
  }

  hasReadyCrops() {
    return this.crops.some(c => c.ready);
  }

  harvestOne() {
    if (this.harvestCooldown > 0) return null;
    const readyCrop = this.crops.find(c => c.ready);
    if (readyCrop) {
      readyCrop.ready = false;
      readyCrop.progress = 0;
      readyCrop.mesh.scale.set(0.01, 0.01, 0.01);
      this.harvestCooldown = 0.08;
      sounds.playHarvest();

      if (typeof window !== 'undefined' && window.particleSystem) {
        const isTomato = this.config.itemId === 'TOMATO';
        const color = isTomato ? 0xef5350 : (this.config.itemId === 'CARROT' ? 0xffb74d : 0xffea00);
        window.particleSystem.spawnHarvestSparkles(this.pos.x + readyCrop.posX, 0.4, this.pos.z + readyCrop.posZ, color, 8);
      }

      if (typeof questManager !== 'undefined') {
        questManager.recordEvent('cropsHarvested', 1);
      }

      if (typeof sounds !== 'undefined' && sounds.triggerHaptic) {
        sounds.triggerHaptic('light');
      }

      return this.config.itemId;
    }
    return null;
  }

  instantHarvestAll() {
    this.crops.forEach(c => {
      c.ready = true;
      c.progress = 1.0;
      c.mesh.scale.set(1, 1, 1);
    });
  }

  setUnlocked(unlocked) {
    this.unlocked = unlocked;
    this.group.visible = unlocked;
  }
}

class AnimalPen {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.pos = new THREE.Vector3(config.pos.x, 0, config.pos.z);
    this.unlocked = config.unlocked || false;
    this.produceStock = 0;
    this.feedStock = 0;
    this.productionTimer = 0;
    this.animTimer = Math.random() * 10;
    this.soundCooldown = 0;
    this.animals = [];

    this.refreshStats();
    this.createMesh();
  }

  refreshStats() {
    const isChicken = this.config.type === 'CHICKEN';

    if (isChicken) {
      const flockLvl = CONFIG.UPGRADES.chicken_count.currentLevel;
      this.animalCount = CONFIG.UPGRADES.chicken_count.levels[flockLvl];

      const eggSpdLvl = CONFIG.UPGRADES.egg_speed.currentLevel;
      this.speedMult = CONFIG.UPGRADES.egg_speed.levels[eggSpdLvl];

      this.feedCapacity = Math.max(6, this.animalCount * 2);
      this.produceCapacity = Math.max(6, this.animalCount * 2);
    } else {
      const herdLvl = CONFIG.UPGRADES.cow_count.currentLevel;
      this.animalCount = CONFIG.UPGRADES.cow_count.levels[herdLvl];

      const milkSpdLvl = CONFIG.UPGRADES.milk_speed.currentLevel;
      this.speedMult = CONFIG.UPGRADES.milk_speed.levels[milkSpdLvl];

      this.feedCapacity = Math.max(12, this.animalCount * 4);
      this.produceCapacity = Math.max(12, this.animalCount * 4);
    }

    if (this.animalContainer) {
      this.rebuildAnimals();
      this.updateBadges();
    }
  }

  createMesh() {
    this.group = new THREE.Group();
    this.group.position.set(this.config.pos.x, 0, this.config.pos.z);

    const isChicken = this.config.type === 'CHICKEN';

    if (isChicken) {
      const coopFloor = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 3.8), new THREE.MeshLambertMaterial({ color: 0xfff9c4 }));
      coopFloor.rotation.x = -Math.PI / 2;
      coopFloor.position.y = 0.015;
      coopFloor.receiveShadow = true;
      this.group.add(coopFloor);

      const fenceMat = new THREE.MeshLambertMaterial({ color: 0x8d5b32 });
      const fenceBack = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.6, 0.1), fenceMat);
      fenceBack.position.set(0, 0.3, -1.9);
      addSketchLines(fenceBack, 0x111111);
      this.group.add(fenceBack);

      const fenceLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 3.8), fenceMat);
      fenceLeft.position.set(-2.4, 0.3, 0);
      addSketchLines(fenceLeft, 0x111111);
      this.group.add(fenceLeft);

    } else {
      const grassMat = new THREE.MeshLambertMaterial({ color: 0x81c784 });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 3.8), grassMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0.015;
      floor.receiveShadow = true;
      this.group.add(floor);

      const fenceMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
      const fence = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.8, 0.1), fenceMat);
      fence.position.set(0, 0.4, -1.9);
      addSketchLines(fence, 0x111111);
      this.group.add(fence);
    }

    this.animalContainer = new THREE.Group();
    this.group.add(this.animalContainer);
    this.rebuildAnimals();

    this.feederMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.6), new THREE.MeshLambertMaterial({ color: 0x8d6e63 }));
    this.feederMesh.position.set(-1.4, 0.18, 1.4);
    addSketchLines(this.feederMesh, 0x111111);
    this.group.add(this.feederMesh);

    this.produceMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.6), new THREE.MeshLambertMaterial({ color: 0x90caf9 }));
    this.produceMesh.position.set(1.4, 0.18, 1.4);
    addSketchLines(this.produceMesh, 0x111111);
    this.group.add(this.produceMesh);

    this.feederPos = new THREE.Vector3(this.config.pos.x - 1.4, 0, this.config.pos.z + 1.4);
    this.pickupPos = new THREE.Vector3(this.config.pos.x + 1.4, 0, this.config.pos.z + 1.4);

    this.feedCanvas = document.createElement('canvas');
    this.feedCanvas.width = 280;
    this.feedCanvas.height = 96;
    this.feedCtx = this.feedCanvas.getContext('2d');
    this.feedTexture = new THREE.CanvasTexture(this.feedCanvas);
    this.feedTexture.minFilter = THREE.LinearFilter;

    const feedBadgeMat = new THREE.SpriteMaterial({ map: this.feedTexture, transparent: true, depthTest: false });
    this.feedBadge = new THREE.Sprite(feedBadgeMat);
    this.feedBadge.scale.set(1.9, 0.62, 1);
    this.feedBadge.position.set(-1.4, 1.1, 1.4);
    this.group.add(this.feedBadge);

    this.produceCanvas = document.createElement('canvas');
    this.produceCanvas.width = 280;
    this.produceCanvas.height = 96;
    this.produceCtx = this.produceCanvas.getContext('2d');
    this.produceTexture = new THREE.CanvasTexture(this.produceCanvas);
    this.produceTexture.minFilter = THREE.LinearFilter;

    const prodBadgeMat = new THREE.SpriteMaterial({ map: this.produceTexture, transparent: true, depthTest: false });
    this.produceBadge = new THREE.Sprite(prodBadgeMat);
    this.produceBadge.scale.set(1.9, 0.62, 1);
    this.produceBadge.position.set(1.4, 1.1, 1.4);
    this.group.add(this.produceBadge);

    this.updateBadges();

    this.group.visible = this.unlocked;
    this.scene.add(this.group);
  }

  rebuildAnimals() {
    while (this.animalContainer.children.length > 0) {
      this.animalContainer.remove(this.animalContainer.children[0]);
    }
    this.animals = [];

    const isChicken = this.config.type === 'CHICKEN';

    if (isChicken) {
      const whiteFeatherMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const redCombMat = new THREE.MeshLambertMaterial({ color: 0xe53935 });
      const yellowBeakMat = new THREE.MeshLambertMaterial({ color: 0xffb300 });
      const blackEyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const footMat = new THREE.MeshLambertMaterial({ color: 0xff9800 });

      const count = this.animalCount || 3;
      for (let i = 0; i < count; i++) {
        const chick = new THREE.Group();

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), whiteFeatherMat);
        body.scale.set(1.0, 0.95, 1.25);
        body.position.y = 0.28;
        body.castShadow = true;
        addSketchLines(body, 0x111111);
        chick.add(body);

        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.38, 0.22);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), whiteFeatherMat);
        head.castShadow = true;
        addSketchLines(head, 0x111111);
        headGroup.add(head);

        const comb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.2), redCombMat);
        comb.position.set(0, 0.18, -0.02);
        addSketchLines(comb, 0x111111);
        headGroup.add(comb);

        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), yellowBeakMat);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, -0.02, 0.18);
        addSketchLines(beak, 0x111111);
        headGroup.add(beak);

        const wattle = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), redCombMat);
        wattle.scale.set(0.7, 1.4, 0.7);
        wattle.position.set(0, -0.09, 0.14);
        headGroup.add(wattle);

        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), blackEyeMat);
        eyeL.position.set(0.12, 0.05, 0.08);
        headGroup.add(eyeL);

        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), blackEyeMat);
        eyeR.position.set(-0.12, 0.05, 0.08);
        headGroup.add(eyeR);

        chick.add(headGroup);

        const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.28), whiteFeatherMat);
        wingL.position.set(0.28, 0.28, 0);
        addSketchLines(wingL, 0x111111);
        chick.add(wingL);

        const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.28), whiteFeatherMat);
        wingR.position.set(-0.28, 0.28, 0);
        addSketchLines(wingR, 0x111111);
        chick.add(wingR);

        const footL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.12), footMat);
        footL.position.set(0.1, 0.02, 0);
        chick.add(footL);

        const footR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.12), footMat);
        footR.position.set(-0.1, 0.02, 0);
        chick.add(footR);

        const col = i % 3;
        const row = Math.floor(i / 3);
        chick.position.set(-1.3 + col * 1.3, 0, -0.8 + row * 0.9);
        chick.rotation.y = (Math.random() - 0.5) * 0.8;

        this.animalContainer.add(chick);
        this.animals.push({
          mesh: chick,
          headGroup: headGroup,
          wingL: wingL,
          wingR: wingR,
          animOffset: i * 1.8
        });
      }

    } else {
      const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const spotMat = new THREE.MeshLambertMaterial({ color: 0x212121 });
      const pinkMuzzleMat = new THREE.MeshLambertMaterial({ color: 0xff80ab });
      const hornMat = new THREE.MeshLambertMaterial({ color: 0xffecb3 });
      const hoofMat = new THREE.MeshLambertMaterial({ color: 0x37474f });
      const blackEyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

      const count = this.animalCount || 1;
      for (let i = 0; i < count; i++) {
        const cow = new THREE.Group();

        const cowBody = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.95, 0.9), whiteMat);
        cowBody.position.y = 0.95;
        cowBody.castShadow = true;
        addSketchLines(cowBody, 0x111111);
        cow.add(cowBody);

        const spot1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.92), spotMat);
        spot1.position.set(0.2, 1.0, 0);
        cow.add(spot1);

        const spot2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.92), spotMat);
        spot2.position.set(-0.35, 0.9, 0);
        cow.add(spot2);

        const legGeo = new THREE.BoxGeometry(0.2, 0.55, 0.2);
        const legPositions = [
          [-0.5, 0.28, -0.3],
          [0.5, 0.28, -0.3],
          [-0.5, 0.28, 0.3],
          [0.5, 0.28, 0.3]
        ];
        legPositions.forEach(p => {
          const leg = new THREE.Mesh(legGeo, whiteMat);
          leg.position.set(p[0], p[1], p[2]);
          leg.castShadow = true;
          addSketchLines(leg, 0x111111);

          const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.22), hoofMat);
          hoof.position.set(0, -0.22, 0);
          addSketchLines(hoof, 0x111111);
          leg.add(hoof);

          cow.add(leg);
        });

        const udder = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.32), pinkMuzzleMat);
        udder.position.set(-0.15, 0.45, 0);
        cow.add(udder);

        const headGroup = new THREE.Group();
        headGroup.position.set(0.9, 1.3, 0);

        const cowHead = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 0.6), whiteMat);
        cowHead.castShadow = true;
        addSketchLines(cowHead, 0x111111);
        headGroup.add(cowHead);

        const headPatch = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 0.62), spotMat);
        headPatch.position.set(0.1, 0.12, 0);
        headGroup.add(headPatch);

        const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.5), pinkMuzzleMat);
        muzzle.position.set(0.4, -0.1, 0);
        addSketchLines(muzzle, 0x111111);
        headGroup.add(muzzle);

        const nostrilL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), spotMat);
        nostrilL.position.set(0.55, -0.06, 0.12);
        headGroup.add(nostrilL);

        const nostrilR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), spotMat);
        nostrilR.position.set(0.55, -0.06, -0.12);
        headGroup.add(nostrilR);

        const earL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.08), whiteMat);
        earL.position.set(-0.1, 0.2, 0.36);
        earL.rotation.x = 0.5;
        addSketchLines(earL, 0x111111);
        headGroup.add(earL);

        const earR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.08), spotMat);
        earR.position.set(-0.1, 0.2, -0.36);
        earR.rotation.x = -0.5;
        addSketchLines(earR, 0x111111);
        headGroup.add(earR);

        const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 6), hornMat);
        hornL.position.set(-0.05, 0.38, 0.2);
        hornL.rotation.z = -0.3;
        addSketchLines(hornL, 0x111111);
        headGroup.add(hornL);

        const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 6), hornMat);
        hornR.position.set(-0.05, 0.38, -0.2);
        hornR.rotation.z = -0.3;
        addSketchLines(hornR, 0x111111);
        headGroup.add(hornR);

        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), blackEyeMat);
        eyeL.position.set(0.22, 0.1, 0.32);
        headGroup.add(eyeL);

        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), blackEyeMat);
        eyeR.position.set(0.22, 0.1, -0.32);
        headGroup.add(eyeR);

        cow.add(headGroup);

        const tailGroup = new THREE.Group();
        tailGroup.position.set(-0.78, 1.2, 0);

        const tailStrand = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 6), whiteMat);
        tailStrand.position.set(0, -0.26, 0);
        tailStrand.rotation.z = 0.15;
        tailGroup.add(tailStrand);

        const tailTuft = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 6), spotMat);
        tailTuft.position.set(0.04, -0.55, 0);
        tailGroup.add(tailTuft);

        cow.add(tailGroup);

        const col = i % 2;
        const row = Math.floor(i / 2);
        cow.position.set(-0.8 + col * 1.8, 0, -0.4 + row * 1.2);
        cow.scale.set(0.88, 0.88, 0.88);

        this.animalContainer.add(cow);
        this.animals.push({
          mesh: cow,
          headGroup: headGroup,
          tailGroup: tailGroup,
          body: cowBody,
          animOffset: i * 2.1
        });
      }
    }
  }

  updateBadges() {
    if (!this.feedCtx || !this.produceCtx) return;

    const fCtx = this.feedCtx;
    fCtx.clearRect(0, 0, 280, 96);
    fCtx.fillStyle = this.feedStock === 0 ? '#ffcdd2' : '#ffffff';
    fCtx.beginPath();
    fCtx.arc(48, 48, 40, Math.PI / 2, Math.PI * 1.5);
    fCtx.arc(232, 48, 40, -Math.PI / 2, Math.PI / 2);
    fCtx.closePath();
    fCtx.fill();
    fCtx.lineWidth = 5;
    fCtx.strokeStyle = '#111111';
    fCtx.stroke();
    fCtx.font = 'bold 42px sans-serif';
    fCtx.textAlign = 'center';
    fCtx.textBaseline = 'middle';
    fCtx.fillStyle = this.feedStock === 0 ? '#c62828' : '#111111';
    fCtx.fillText(`🌾 ${this.feedStock}/${this.feedCapacity}`, 140, 50);
    this.feedTexture.needsUpdate = true;

    const pIcon = this.config.produceId === 'EGG' ? '🥚' : '🥛';
    const pCtx = this.produceCtx;
    pCtx.clearRect(0, 0, 280, 96);
    pCtx.fillStyle = this.produceStock >= this.produceCapacity ? '#c8e6c9' : '#ffffff';
    pCtx.beginPath();
    pCtx.arc(48, 48, 40, Math.PI / 2, Math.PI * 1.5);
    pCtx.arc(232, 48, 40, -Math.PI / 2, Math.PI / 2);
    pCtx.closePath();
    pCtx.fill();
    pCtx.lineWidth = 5;
    pCtx.strokeStyle = '#111111';
    pCtx.stroke();
    pCtx.font = 'bold 42px sans-serif';
    pCtx.textAlign = 'center';
    pCtx.textBaseline = 'middle';
    pCtx.fillStyle = this.produceStock >= this.produceCapacity ? '#2e7d32' : '#111111';
    pCtx.fillText(`${pIcon} ${this.produceStock}/${this.produceCapacity}`, 140, 50);
    this.produceTexture.needsUpdate = true;
  }

  update(dt, growthMultiplier = 1.0) {
    if (!this.unlocked) return;

    this.animTimer += dt;
    const isChicken = this.config.type === 'CHICKEN';

    this.animals.forEach(a => {
      if (isChicken) {
        const peck = Math.sin(this.animTimer * 4.5 + a.animOffset) * 0.35;
        a.headGroup.rotation.x = Math.max(0, peck);

        const wingFlap = Math.sin(this.animTimer * 6.0 + a.animOffset) * 0.25;
        a.wingL.rotation.z = Math.max(0, wingFlap);
        a.wingR.rotation.z = -Math.max(0, wingFlap);
      } else {
        a.headGroup.rotation.y = Math.sin(this.animTimer * 2.2 + a.animOffset) * 0.12;
        a.headGroup.rotation.x = Math.sin(this.animTimer * 1.8 + a.animOffset) * 0.08;
        a.tailGroup.rotation.z = Math.sin(this.animTimer * 4.0 + a.animOffset) * 0.32;
        a.body.scale.y = 1.0 + Math.sin(this.animTimer * 1.5 + a.animOffset) * 0.02;
      }
    });

    this.soundCooldown = Math.max(0, this.soundCooldown - dt);

    if (this.feedStock > 0 && this.produceStock < this.produceCapacity) {
      const effSpeed = (this.speedMult || 1.0) * growthMultiplier;
      this.productionTimer += dt * effSpeed;

      const baseDuration = isChicken ? 3.0 : 4.5;
      if (this.productionTimer >= baseDuration) {
        this.productionTimer = 0;
        this.feedStock--;
        this.produceStock++;
        this.updateBadges();

        // Only one single gentle moo occasionally (at most once every 20 seconds)
        if (!isChicken && this.soundCooldown <= 0) {
          this.soundCooldown = 20.0;
          if (typeof sounds !== 'undefined' && sounds.playMoo) {
            sounds.playMoo();
          }
        }
      }
    }
  }

  addFeed(amount = 1) {
    if (this.feedStock >= this.feedCapacity) return 0;
    const added = Math.min(amount, this.feedCapacity - this.feedStock);
    this.feedStock += added;
    this.updateBadges();
    if (typeof sounds !== 'undefined') {
      sounds.playPlace();
    }
    return added;
  }

  harvestProduce() {
    if (this.produceStock <= 0) return null;
    this.produceStock--;
    this.updateBadges();

    if (typeof window !== 'undefined' && window.particleSystem) {
      const color = (this.config.type === 'CHICKEN') ? 0xfff9c4 : 0x81d4fa;
      window.particleSystem.spawnHarvestSparkles(this.pickupPos.x, 0.5, this.pickupPos.z, color, 8);
    }

    if (typeof sounds !== 'undefined' && sounds.triggerHaptic) {
      sounds.triggerHaptic('light');
    }

    return this.config.produceId;
  }

  setUnlocked(unlocked) {
    this.unlocked = unlocked;
    this.group.visible = unlocked;
    if (unlocked) {
      this.refreshStats();
      this.updateBadges();
    }
  }
}

// Processing Machine: Dynamic Input Hopper Capacity (Base 4 -> Max 7)
class ProcessingMachine {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.unlocked = config.unlocked || false;
    this.ingredients = []; // Array of ingredient strings, e.g. ['TOMATO', 'TOMATO'] or ['WHEAT', 'EGG']
    this.outputStock = 0;
    this.outputCapacity = 12;
    this.processTimer = 0;

    this.refreshStats();
    this.createMesh();
  }

  refreshStats() {
    const lvl = (CONFIG.UPGRADES.appliance_capacity && CONFIG.UPGRADES.appliance_capacity.currentLevel) || 0;
    this.inputCapacity = (CONFIG.UPGRADES.appliance_capacity && CONFIG.UPGRADES.appliance_capacity.levels[lvl]) || 6;
    if (this.inCtx) this.updateBadges();
  }

  createMesh() {
    this.group = new THREE.Group();
    this.group.position.set(this.config.pos.x, 0, this.config.pos.z);

    // Contact Ground Shadow Decal
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x1b2e1b, transparent: true, opacity: 0.35 });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.0), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.015;
    this.group.add(shadow);

    const isJuicer = this.config.type === 'JUICER';
    const isCakery = this.config.type === 'CAKERY';
    const isBakery = this.config.type === 'BAKERY';
    const mainColor = isJuicer ? 0xff7043 : (isCakery ? 0xf48fb1 : 0xbcaaa4);
    const accentColor = isJuicer ? 0xd84315 : (isCakery ? 0xd81b60 : 0x4e342e);

    // Heavy Wooden / Metallic Base Pedestal
    const basePlate = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.4), new THREE.MeshLambertMaterial({ color: 0x37474f }));
    basePlate.position.y = 0.06;
    basePlate.receiveShadow = true;
    addSketchLines(basePlate, 0x111111);
    this.group.add(basePlate);

    const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.74, 1.2), new THREE.MeshLambertMaterial({ color: mainColor }));
    base.position.y = 0.45;
    base.castShadow = true;
    addSketchLines(base, 0x111111);
    this.group.add(base);

    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 1.3), new THREE.MeshLambertMaterial({ color: accentColor }));
    counter.position.y = 0.87;
    counter.castShadow = true;
    addSketchLines(counter, 0x111111);
    this.group.add(counter);

    // Status Indicator Light Gem
    this.statusLightMat = new THREE.MeshLambertMaterial({ color: 0xffb300, emissive: 0xff8f00, emissiveIntensity: 0.5 });
    this.statusLight = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 8), this.statusLightMat);
    this.statusLight.position.set(0, 0.96, 0.55);
    addSketchLines(this.statusLight, 0x111111);
    this.group.add(this.statusLight);

    if (isBakery) {
      // Warm Glowing Oven Fire Window
      const hearthGeo = new THREE.BoxGeometry(0.8, 0.35, 0.06);
      this.hearthMat = new THREE.MeshLambertMaterial({ color: 0xff6f00, emissive: 0xff3d00, emissiveIntensity: 0.6 });
      const hearth = new THREE.Mesh(hearthGeo, this.hearthMat);
      hearth.position.set(0, 0.45, 0.61);
      this.group.add(hearth);
    }

    // Funnel / Hopper on left
    const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.25, 0.6, 12), new THREE.MeshLambertMaterial({ color: 0x90a4ae }));
    funnel.position.set(-0.7, 1.15, 0);
    funnel.castShadow = true;
    addSketchLines(funnel, 0x111111);
    this.group.add(funnel);

    if (isJuicer) {
      this.presser = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.4, 8), new THREE.MeshLambertMaterial({ color: 0x37474f }));
      this.presser.position.set(-0.7, 1.45, 0);
      this.group.add(this.presser);

      // Contextual: Small wooden box of ripe tomatoes next to juicer
      const sideCrate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.42), new THREE.MeshLambertMaterial({ color: 0xbcaaa4 }));
      sideCrate.position.set(-1.1, 0.14, 0.2);
      addSketchLines(sideCrate, 0x111111);
      this.group.add(sideCrate);

      const tomatoProp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), new THREE.MeshLambertMaterial({ color: 0xf44336 }));
      tomatoProp.position.set(-1.1, 0.32, 0.2);
      this.group.add(tomatoProp);

    } else if (isBakery) {
      // Contextual: Flour sack next to bakery
      const sack = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.48, 8), new THREE.MeshLambertMaterial({ color: 0xd7ccc8 }));
      sack.position.set(-1.1, 0.24, 0.2);
      addSketchLines(sack, 0x111111);
      this.group.add(sack);

    } else if (isCakery) {
      this.whisk = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshLambertMaterial({ color: 0xffd54f }));
      this.whisk.position.set(-0.7, 1.35, 0);
      this.group.add(this.whisk);

      // Contextual: Milk pitcher / Sugar canister beside mixer
      const canister = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.38, 8), new THREE.MeshLambertMaterial({ color: 0xe0e0e0 }));
      canister.position.set(-1.1, 0.19, 0.2);
      addSketchLines(canister, 0x111111);
      this.group.add(canister);
    }

    // Output tray
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.6), new THREE.MeshLambertMaterial({ color: 0xcfd8dc }));
    tray.position.set(0.7, 0.7, 0.4);
    addSketchLines(tray, 0x111111);
    this.group.add(tray);

    this.inputZonePos = new THREE.Vector3(this.config.pos.x - 0.7, 0, this.config.pos.z + 0.9);
    this.outputZonePos = new THREE.Vector3(this.config.pos.x + 0.7, 0, this.config.pos.z + 0.9);

    this.inCanvas = document.createElement('canvas');
    this.inCanvas.width = 280;
    this.inCanvas.height = 96;
    this.inCtx = this.inCanvas.getContext('2d');
    this.inTexture = new THREE.CanvasTexture(this.inCanvas);
    this.inTexture.minFilter = THREE.LinearFilter;

    const inBadgeMat = new THREE.SpriteMaterial({ map: this.inTexture, transparent: true, depthTest: false });
    this.inBadge = new THREE.Sprite(inBadgeMat);
    this.inBadge.scale.set(1.4, 0.48, 1);
    this.inBadge.position.set(-0.7, 1.85, 0);
    this.group.add(this.inBadge);

    this.outCanvas = document.createElement('canvas');
    this.outCanvas.width = 280;
    this.outCanvas.height = 96;
    this.outCtx = this.outCanvas.getContext('2d');
    this.outTexture = new THREE.CanvasTexture(this.outCanvas);
    this.outTexture.minFilter = THREE.LinearFilter;

    const outBadgeMat = new THREE.SpriteMaterial({ map: this.outTexture, transparent: true, depthTest: false });
    this.outBadge = new THREE.Sprite(outBadgeMat);
    this.outBadge.scale.set(1.4, 0.48, 1);
    this.outBadge.position.set(0.7, 1.85, 0);
    this.group.add(this.outBadge);

    this.updateBadges();

    this.group.visible = this.unlocked;
    this.scene.add(this.group);
  }

  get inputStock() {
    return this.ingredients.length;
  }

  isInputFull() {
    return this.ingredients.length >= this.inputCapacity;
  }

  canAcceptIngredient(itemType) {
    if (this.isInputFull()) return false;
    if (this.config.type === 'JUICER') {
      return itemType === 'TOMATO';
    } else if (this.config.type === 'BAKERY') {
      const wheatCount = this.ingredients.filter(i => i === 'WHEAT').length;
      const eggCount = this.ingredients.filter(i => i === 'EGG').length;
      const maxPerType = Math.max(3, Math.floor(this.inputCapacity / 2));
      if (itemType === 'WHEAT') return wheatCount < maxPerType;
      if (itemType === 'EGG') return eggCount < maxPerType;
      return false;
    } else if (this.config.type === 'CAKERY') {
      const milkCount = this.ingredients.filter(i => i === 'MILK').length;
      const eggCount = this.ingredients.filter(i => i === 'EGG').length;
      const breadCount = this.ingredients.filter(i => i === 'BREAD').length;
      const maxPerType = Math.max(2, Math.floor(this.inputCapacity / 3));
      if (itemType === 'MILK') return milkCount < maxPerType;
      if (itemType === 'EGG') return eggCount < maxPerType;
      if (itemType === 'BREAD') return breadCount < maxPerType;
      return false;
    }
    return false;
  }

  addIngredient(item) {
    if (!this.canAcceptIngredient(item)) return false;
    this.ingredients.push(item);
    this.updateBadges();
    sounds.playPlace();
    return true;
  }

  updateBadges() {
    if (!this.inCtx || !this.outCtx) return;

    const isJuicer = this.config.type === 'JUICER';
    const isCakery = this.config.type === 'CAKERY';
    const inIcon = isJuicer ? '🍅' : (isCakery ? '🥛🥚🍞' : '🌾🥚');
    const outIcon = this.config.outputId === 'JUICE' ? '🥫' : (this.config.outputId === 'CAKE' ? '🎂' : '🍞');

    const inCtx = this.inCtx;
    inCtx.clearRect(0, 0, 280, 96);
    inCtx.fillStyle = this.isInputFull() ? '#fff9c4' : '#ffffff';
    inCtx.beginPath();
    inCtx.arc(48, 48, 40, Math.PI / 2, Math.PI * 1.5);
    inCtx.arc(232, 48, 40, -Math.PI / 2, Math.PI / 2);
    inCtx.closePath();
    inCtx.fill();
    inCtx.lineWidth = 5;
    inCtx.strokeStyle = '#111111';
    inCtx.stroke();
    inCtx.font = 'bold 36px -apple-system, sans-serif';
    inCtx.textAlign = 'center';
    inCtx.textBaseline = 'middle';
    inCtx.fillStyle = '#111111';

    let inText = `${inIcon} ${this.ingredients.length}/${this.inputCapacity}`;
    if (isCakery) {
      const m = this.ingredients.filter(i => i === 'MILK').length;
      const e = this.ingredients.filter(i => i === 'EGG').length;
      const b = this.ingredients.filter(i => i === 'BREAD').length;
      inText = `🥛${m} 🥚${e} 🍞${b}`;
    }
    inCtx.fillText(inText, 140, 50);
    this.inTexture.needsUpdate = true;

    const outCtx = this.outCtx;
    outCtx.clearRect(0, 0, 280, 96);
    outCtx.fillStyle = this.outputStock > 0 ? '#e8f5e9' : '#ffffff';
    outCtx.beginPath();
    outCtx.arc(48, 48, 40, Math.PI / 2, Math.PI * 1.5);
    outCtx.arc(232, 48, 40, -Math.PI / 2, Math.PI / 2);
    outCtx.closePath();
    outCtx.fill();
    outCtx.lineWidth = 5;
    outCtx.strokeStyle = '#111111';
    outCtx.stroke();
    outCtx.font = 'bold 36px -apple-system, sans-serif';
    outCtx.textAlign = 'center';
    outCtx.textBaseline = 'middle';
    outCtx.fillStyle = '#111111';
    outCtx.fillText(`${outIcon} ${this.outputStock}/${this.outputCapacity}`, 140, 50);
    this.outTexture.needsUpdate = true;
  }

  update(dt, growthMultiplier = 1.0) {
    if (!this.unlocked) return;

    if (this.outputStock >= this.outputCapacity) return;

    const isJuicer = this.config.type === 'JUICER';
    const isCakery = this.config.type === 'CAKERY';

    if (isJuicer) {
      if (this.ingredients.length >= 2) {
        this.processTimer += dt * growthMultiplier;
        if (this.processTimer >= 4.0) {
          this.processTimer = 0;
          this.ingredients.splice(0, 2);
          this.outputStock++;
          this.updateBadges();

          if (typeof window !== 'undefined' && window.particleSystem) {
            window.particleSystem.spawnFlourPuff(this.config.pos.x + 0.7, 0.5, this.config.pos.z + 0.9, 6, false);
          }
        }
      }
    } else if (isCakery) {
      // Cake Recipe: 1 MILK + 1 EGG + 1 BREAD (or fallback: 1 Milk + 2 Eggs)
      const hasMilk = this.ingredients.includes('MILK');
      const hasEgg = this.ingredients.includes('EGG');
      const hasBread = this.ingredients.includes('BREAD');

      const eggCount = this.ingredients.filter(i => i === 'EGG').length;

      const hasStandardRecipe = (hasMilk && hasEgg && hasBread);
      const hasFallbackRecipe = (!hasBread && hasMilk && eggCount >= 2);

      if (hasStandardRecipe || hasFallbackRecipe) {
        this.processTimer += dt * growthMultiplier;
        if (this.processTimer >= 4.5) {
          this.processTimer = 0;
          if (hasStandardRecipe) {
            this.ingredients.splice(this.ingredients.indexOf('MILK'), 1);
            this.ingredients.splice(this.ingredients.indexOf('EGG'), 1);
            this.ingredients.splice(this.ingredients.indexOf('BREAD'), 1);
          } else {
            this.ingredients.splice(this.ingredients.indexOf('MILK'), 1);
            this.ingredients.splice(this.ingredients.indexOf('EGG'), 1);
            this.ingredients.splice(this.ingredients.indexOf('EGG'), 1);
          }
          this.outputStock++;
          this.updateBadges();

          if (typeof window !== 'undefined' && window.particleSystem) {
            window.particleSystem.spawnFlourPuff(this.config.pos.x + 0.7, 0.5, this.config.pos.z + 0.9, 8, true);
          }

          if (typeof questManager !== 'undefined') {
            questManager.recordEvent('cakesBaked', 1);
          }
        }
      }
    } else {
      // Bakery: 1 Wheat + 1 Egg (or 2 Wheat)
      const hasWheat = this.ingredients.includes('WHEAT');
      const hasEgg = this.ingredients.includes('EGG');

      if ((hasWheat && hasEgg) || this.ingredients.filter(i => i === 'WHEAT').length >= 2) {
        this.processTimer += dt * growthMultiplier;
        if (this.processTimer >= 5.0) {
          this.processTimer = 0;
          if (hasWheat && hasEgg) {
            this.ingredients.splice(this.ingredients.indexOf('WHEAT'), 1);
            this.ingredients.splice(this.ingredients.indexOf('EGG'), 1);
          } else {
            this.ingredients.splice(this.ingredients.indexOf('WHEAT'), 1);
            this.ingredients.splice(this.ingredients.indexOf('WHEAT'), 1);
          }
          this.outputStock++;
          this.updateBadges();

          if (typeof window !== 'undefined' && window.particleSystem) {
            window.particleSystem.spawnFlourPuff(this.config.pos.x + 0.7, 0.5, this.config.pos.z + 0.9, 8, false);
          }

          if (typeof questManager !== 'undefined') {
            questManager.recordEvent('breadBaked', 1);
          }
        }
      }
    }

    // Visual Machine Micro-Animations (Juicer press, Whisk spin, Hearth flame pulse, Indicator Gem)
    const isActivelyProcessing = this.processTimer > 0;
    if (this.statusLightMat) {
      if (this.outputStock > 0 || isActivelyProcessing) {
        this.statusLightMat.color.setHex(0x43a047);
        this.statusLightMat.emissive.setHex(0x2e7d32);
      } else {
        this.statusLightMat.color.setHex(0xffb300);
        this.statusLightMat.emissive.setHex(0xff8f00);
      }
    }

    if (isJuicer && this.presser) {
      this.presser.position.y = isActivelyProcessing 
        ? (1.45 + Math.sin(performance.now() * 0.01) * 0.12)
        : 1.45;
    } else if (isCakery && this.whisk) {
      if (isActivelyProcessing) {
        this.whisk.rotation.y += dt * 15;
      }
    } else if (this.hearthMat) {
      this.hearthMat.emissiveIntensity = isActivelyProcessing 
        ? (0.7 + Math.sin(performance.now() * 0.008) * 0.3)
        : 0.3;
    }
  }

  hasRecipeIngredients() {
    return this.isInputFull();
  }

  harvestOutput() {
    if (this.outputStock <= 0) return null;
    this.outputStock--;
    this.updateBadges();
    sounds.playHarvest();
    return this.config.outputId;
  }

  setUnlocked(unlocked) {
    this.unlocked = unlocked;
    this.group.visible = unlocked;
    if (unlocked) {
      this.refreshStats();
      this.updateBadges();
    }
  }
}

// Future Expansion Area — Grand Café Visual & Progression Teaser
class CafeTeaser {
  constructor(scene, pos = { x: 28.0, z: -8.5 }) {
    this.scene = scene;
    this.pos = new THREE.Vector3(pos.x, 0, pos.z);
    this.isTransformed = false;
    this.hintTimer = 15;
    this.animTimer = 0;

    this.group = new THREE.Group();
    this.group.position.set(pos.x, 0, pos.z);

    this.constructionGroup = new THREE.Group();
    this.transformedGroup = new THREE.Group();

    this.initConstructionMesh();
    this.initTransformedMesh();

    this.group.add(this.constructionGroup);
    this.group.add(this.transformedGroup);

    this.setTransformed(false);
    this.scene.add(this.group);
  }

  initConstructionMesh() {
    const darkWoodMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
    const plankMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
    const canvasTarpMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const crateMat = new THREE.MeshLambertMaterial({ color: 0xbcaaa4 });

    // 1. Excavation / Gravel Foundation Ground Decal
    const gravelMat = new THREE.MeshLambertMaterial({ color: 0xc4b5a0 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 6.8), gravelMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.012;
    ground.receiveShadow = true;
    addSketchLines(ground, 0x333333);
    this.constructionGroup.add(ground);

    // 2. Wooden Perimeter Construction Safety Fence
    const fencePosts = [
      [-3.8, -3.0], [3.8, -3.0], [-3.8, 3.0], [3.8, 3.0],
      [-3.8, 0], [3.8, 0], [0, -3.0], [0, 3.0]
    ];
    fencePosts.forEach(fp => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.2, 6), darkWoodMat);
      post.position.set(fp[0], 0.6, fp[1]);
      post.castShadow = true;
      addSketchLines(post, 0x111111);
      this.constructionGroup.add(post);
    });

    // Cross Rails
    const rails = [
      { w: 7.6, h: 0.1, d: 0.06, x: 0, y: 0.9, z: -3.0 },
      { w: 7.6, h: 0.1, d: 0.06, x: 0, y: 0.45, z: -3.0 },
      { w: 0.06, h: 0.1, d: 6.0, x: -3.8, y: 0.9, z: 0 },
      { w: 0.06, h: 0.1, d: 6.0, x: -3.8, y: 0.45, z: 0 },
      { w: 0.06, h: 0.1, d: 6.0, x: 3.8, y: 0.9, z: 0 },
      { w: 0.06, h: 0.1, d: 6.0, x: 3.8, y: 0.45, z: 0 }
    ];
    rails.forEach(r => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(r.w, r.h, r.d), plankMat);
      rail.position.set(r.x, r.y, r.z);
      rail.castShadow = true;
      addSketchLines(rail, 0x111111);
      this.constructionGroup.add(rail);
    });

    // 3. Stacked Lumber & Tarped Materials Structure
    const lumber1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 1.2), plankMat);
    lumber1.position.set(-1.2, 0.18, -1.2);
    lumber1.castShadow = true;
    addSketchLines(lumber1, 0x111111);
    this.constructionGroup.add(lumber1);

    const lumber2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 0.9), plankMat);
    lumber2.position.set(-1.1, 0.48, -1.2);
    lumber2.rotation.y = 0.08;
    lumber2.castShadow = true;
    addSketchLines(lumber2, 0x111111);
    this.constructionGroup.add(lumber2);

    const tarpedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 1.8), canvasTarpMat);
    tarpedFrame.position.set(1.5, 0.8, -1.0);
    tarpedFrame.castShadow = true;
    addSketchLines(tarpedFrame, 0x111111);
    this.constructionGroup.add(tarpedFrame);

    const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), crateMat);
    crate1.position.set(2.4, 0.35, 0.8);
    crate1.rotation.y = 0.25;
    crate1.castShadow = true;
    addSketchLines(crate1, 0x111111);
    this.constructionGroup.add(crate1);

    // 4. Architectural Drafting Easel with Blueprint
    const easelGroup = new THREE.Group();
    easelGroup.position.set(-1.8, 0, 1.2);
    easelGroup.rotation.y = -0.35;

    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 5), darkWoodMat);
    leg1.position.set(-0.35, 0.75, -0.1);
    leg1.rotation.z = -0.12;
    easelGroup.add(leg1);

    const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 5), darkWoodMat);
    leg2.position.set(0.35, 0.75, -0.1);
    leg2.rotation.z = 0.12;
    easelGroup.add(leg2);

    const legBack = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 5), darkWoodMat);
    legBack.position.set(0, 0.7, 0.35);
    legBack.rotation.x = 0.28;
    easelGroup.add(legBack);

    // Blueprint Board
    const createBlueprintTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 384;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#1e3a8a'; // Deep Blueprint Blue
      ctx.fillRect(0, 0, 512, 384);

      // White grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 512; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 384); ctx.stroke();
      }
      for (let y = 0; y < 384; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
      }

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 30, 452, 324);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('☕ GRAND CAFÉ BLUEPRINT', 256, 75);

      ctx.font = '18px sans-serif';
      ctx.fillText('• BISTRO PATIO & ESPRESSO BAR', 256, 125);
      ctx.fillText('• ARTISAN PASTRY SHOWCASE', 256, 160);
      ctx.fillText('• CHEF JEAN\'S SECRET RECIPES', 256, 195);

      ctx.strokeStyle = '#93c5fd';
      ctx.strokeRect(100, 220, 312, 90);
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('✨ EXPANSION COMING SOON ✨', 256, 275);

      return new THREE.CanvasTexture(canvas);
    };

    const board = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.05), new THREE.MeshLambertMaterial({ map: createBlueprintTexture() }));
    board.position.set(0, 0.95, -0.05);
    board.rotation.x = -0.15;
    board.castShadow = true;
    addSketchLines(board, 0x111111);
    easelGroup.add(board);
    this.constructionGroup.add(easelGroup);

    // 5. Main Handcrafted Wooden Teaser Signpost
    const signGroup = new THREE.Group();
    signGroup.position.set(0.5, 0, 2.2);

    const signPostL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 2.2, 6), darkWoodMat);
    signPostL.position.set(-1.1, 1.1, 0);
    signPostL.castShadow = true;
    addSketchLines(signPostL, 0x111111);
    signGroup.add(signPostL);

    const signPostR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 2.2, 6), darkWoodMat);
    signPostR.position.set(1.1, 1.1, 0);
    signPostR.castShadow = true;
    addSketchLines(signPostR, 0x111111);
    signGroup.add(signPostR);

    const createTeaserSignTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#3e2723'; // Dark Walnut
      ctx.fillRect(0, 0, 512, 256);

      ctx.strokeStyle = '#f59e0b'; // Gold border
      ctx.lineWidth = 8;
      ctx.strokeRect(16, 16, 480, 224);

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('☕ GRAND CAFÉ', 256, 80);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('COMING SOON', 256, 140);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'italic 20px sans-serif';
      ctx.fillText('"Something delicious is brewing..."', 256, 195);

      return new THREE.CanvasTexture(canvas);
    };

    const mainSign = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 0.12), new THREE.MeshLambertMaterial({ map: createTeaserSignTexture() }));
    mainSign.position.set(0, 1.4, 0);
    mainSign.castShadow = true;
    addSketchLines(mainSign, 0x111111);
    signGroup.add(mainSign);

    // Warm construction lantern
    const lanternMat = new THREE.MeshLambertMaterial({ color: 0xffecb3, emissive: 0xffb300, emissiveIntensity: 0.75 });
    const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.22), lanternMat);
    lantern.position.set(1.1, 1.9, 0.2);
    addSketchLines(lantern, 0x111111);
    signGroup.add(lantern);

    this.constructionGroup.add(signGroup);
  }

  initTransformedMesh() {
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
    const darkWoodMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
    const facadeMat = new THREE.MeshLambertMaterial({ color: 0xfaf5ee });
    const roofTrimMat = new THREE.MeshLambertMaterial({ color: 0x8d5b32 });
    const goldMat = new THREE.MeshLambertMaterial({ color: 0xffd54f });

    // 1. Terracotta Flagstone Patio Floor
    const patioMat = new THREE.MeshLambertMaterial({ color: 0xc2714f });
    const patio = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 7.2), patioMat);
    patio.rotation.x = -Math.PI / 2;
    patio.position.y = 0.015;
    patio.receiveShadow = true;
    addSketchLines(patio, 0x111111);
    this.transformedGroup.add(patio);

    // Dark wood border trim
    const border = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 7.4), woodMat);
    border.rotation.x = -Math.PI / 2;
    border.position.y = 0.008;
    this.transformedGroup.add(border);

    // 2. Charming Café Pavilion Facade
    const facade = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.2, 1.4), facadeMat);
    facade.position.set(0, 1.6, -2.4);
    facade.castShadow = true;
    addSketchLines(facade, 0x111111);
    this.transformedGroup.add(facade);

    // Corner timber pillars
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.3, 0.3), woodMat);
    p1.position.set(-2.8, 1.65, -1.7);
    addSketchLines(p1, 0x111111);
    this.transformedGroup.add(p1);

    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.3, 0.3), woodMat);
    p2.position.set(2.8, 1.65, -1.7);
    addSketchLines(p2, 0x111111);
    this.transformedGroup.add(p2);

    // Frosted French Double Doors
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x4a3b32 });
    const doorGlassMat = new THREE.MeshLambertMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.75 });

    const doorsFrame = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.2, 0.1), doorMat);
    doorsFrame.position.set(0, 1.1, -1.65);
    addSketchLines(doorsFrame, 0x111111);
    this.transformedGroup.add(doorsFrame);

    const doorGlassL = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.8), doorGlassMat);
    doorGlassL.position.set(-0.45, 1.1, -1.59);
    this.transformedGroup.add(doorGlassL);

    const doorGlassR = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.8), doorGlassMat);
    doorGlassR.position.set(0.45, 1.1, -1.59);
    this.transformedGroup.add(doorGlassR);

    // Side Warm Glowing Windows
    const winGlassMat = new THREE.MeshLambertMaterial({ color: 0xfef08a, emissive: 0xffb74d, emissiveIntensity: 0.6 });
    const winL = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.08), winGlassMat);
    winL.position.set(-1.8, 1.6, -1.68);
    addSketchLines(winL, 0x111111);
    this.transformedGroup.add(winL);

    const winR = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.08), winGlassMat);
    winR.position.set(1.8, 1.6, -1.68);
    addSketchLines(winR, 0x111111);
    this.transformedGroup.add(winR);

    // 3. Striped Café Awning
    const awningGroup = new THREE.Group();
    awningGroup.position.set(0, 2.7, -1.7);
    const stripeCount = 10;
    const stripeW = 0.58;
    for (let i = 0; i < stripeCount; i++) {
      const isRed = i % 2 === 0;
      const stripeMat = new THREE.MeshLambertMaterial({ color: isRed ? 0x991b1b : 0xfef3c7 });
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(stripeW, 0.08, 1.4), stripeMat);
      stripe.position.set((i - stripeCount / 2 + 0.5) * stripeW, 0, 0.6);
      stripe.rotation.x = 0.32;
      stripe.castShadow = true;
      addSketchLines(stripe, 0x111111);
      awningGroup.add(stripe);
    }
    this.transformedGroup.add(awningGroup);

    // 4. Polished Grand Café Header Sign
    const createGrandCafeSignTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#271810'; // Deep Espresso Walnut
      ctx.fillRect(0, 0, 512, 160);

      ctx.strokeStyle = '#f59e0b'; // Gold trim
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, 492, 140);

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 42px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('☕ GRAND CAFÉ ☕', 256, 65);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('✨ GRAND OPENING SOON ✨', 256, 115);

      return new THREE.CanvasTexture(canvas);
    };

    const headerSign = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.1, 0.12), new THREE.MeshLambertMaterial({ map: createGrandCafeSignTexture() }));
    headerSign.position.set(0, 3.4, -1.65);
    headerSign.castShadow = true;
    addSketchLines(headerSign, 0x111111);
    this.transformedGroup.add(headerSign);

    // 5. Outdoor Bistro Patio Furniture (2 Round Tables, Parasols, Chairs & Treats)
    const createBistroSet = (x, z, parasolColorHex = 0x991b1b) => {
      const setGroup = new THREE.Group();
      setGroup.position.set(x, 0, z);

      // Table Top
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.08, 16), woodMat);
      table.position.y = 0.75;
      table.castShadow = true;
      addSketchLines(table, 0x111111);
      setGroup.add(table);

      // Pedestal Stem & Base
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.75, 8), darkWoodMat);
      stem.position.y = 0.375;
      setGroup.add(stem);

      // Striped Parasol Umbrella
      const umbrellaPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), woodMat);
      umbrellaPole.position.y = 1.1;
      setGroup.add(umbrellaPole);

      const umbrellaCone = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 8), new THREE.MeshLambertMaterial({ color: parasolColorHex }));
      umbrellaCone.position.y = 2.1;
      umbrellaCone.castShadow = true;
      addSketchLines(umbrellaCone, 0x111111);
      setGroup.add(umbrellaCone);

      // 2 Chairs with pastel cushions
      const createChair = (cx, cz, rotY) => {
        const chairGroup = new THREE.Group();
        chairGroup.position.set(cx, 0, cz);
        chairGroup.rotation.y = rotY;

        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), new THREE.MeshLambertMaterial({ color: 0xfbcfe8 }));
        seat.position.y = 0.44;
        chairGroup.add(seat);

        const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.44, 4);
        [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].forEach(lp => {
          const l = new THREE.Mesh(legGeo, darkWoodMat);
          l.position.set(lp[0], 0.22, lp[1]);
          chairGroup.add(l);
        });

        const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.05), woodMat);
        back.position.set(0, 0.68, -0.18);
        chairGroup.add(back);

        return chairGroup;
      };

      setGroup.add(createChair(0, -0.75, 0));
      setGroup.add(createChair(0, 0.75, Math.PI));

      return setGroup;
    };

    const table1 = createBistroSet(-1.8, 0.8, 0x991b1b);
    const table2 = createBistroSet(1.8, 0.8, 0x0284c7);
    this.transformedGroup.add(table1);
    this.transformedGroup.add(table2);

    // Coffee cups on Table 1
    const cupMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.1, 8), cupMat);
    cup.position.set(-1.8, 0.84, 0.8);
    this.transformedGroup.add(cup);

    // Decorative Pastry Cloche on Table 2
    const clocheTray = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 8), goldMat);
    clocheTray.position.set(1.8, 0.81, 0.8);
    this.transformedGroup.add(clocheTray);

    const clocheGlass = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.6 }));
    clocheGlass.position.set(1.8, 0.83, 0.8);
    this.transformedGroup.add(clocheGlass);

    // 6. Burlap Coffee Sacks & Delivery Crates
    const sackMat = new THREE.MeshLambertMaterial({ color: 0xd7ccc8 });
    const sack1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.65, 8), sackMat);
    sack1.position.set(-3.2, 0.325, 1.8);
    sack1.rotation.z = 0.15;
    sack1.castShadow = true;
    addSketchLines(sack1, 0x111111);
    this.transformedGroup.add(sack1);

    const sack2 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.6, 8), sackMat);
    sack2.position.set(-3.1, 0.3, 2.4);
    sack2.castShadow = true;
    addSketchLines(sack2, 0x111111);
    this.transformedGroup.add(sack2);

    // 7. Potted Flowering Plants at Entrance
    const planterMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const plantMat = new THREE.MeshLambertMaterial({ color: 0xa855f7 }); // Lavender purple

    [-3.8, 3.8].forEach(px => {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.6, 8), planterMat);
      pot.position.set(px, 0.3, 2.6);
      pot.castShadow = true;
      addSketchLines(pot, 0x111111);
      this.transformedGroup.add(pot);

      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), plantMat);
      bush.position.set(px, 0.75, 2.6);
      this.transformedGroup.add(bush);
    });

    // 8. Festoon String Lights Ambient Point Light
    this.fairyLight = new THREE.PointLight(0xffedd5, 1.0, 8);
    this.fairyLight.position.set(0, 2.4, 0.5);
    this.transformedGroup.add(this.fairyLight);
  }

  update(dt, playerPos, ui) {
    this.animTimer += dt;
    this.hintTimer += dt;

    // Subtle gentle fairy lights micro-pulse
    if (this.fairyLight) {
      this.fairyLight.intensity = 0.9 + Math.sin(this.animTimer * 2.5) * 0.12;
    }

    // Informational Proximity Hint when player walks near teaser sign
    if (playerPos && ui) {
      const dist = this.pos.distanceTo(playerPos);
      if (dist < 2.8 && this.hintTimer > 25) {
        this.hintTimer = 0;
        if (this.isTransformed) {
          ui.showNotification(`☕ GRAND CAFÉ — COMING SOON! ✨ Chef Jean's secret coffee & dessert menu is in the works!`);
        } else {
          ui.showNotification(`☕ Future Grand Café Site — Construction in planning!`);
        }
      }
    }
  }

  setTransformed(transformed) {
    this.isTransformed = transformed;
    this.constructionGroup.visible = !transformed;
    this.transformedGroup.visible = transformed;
  }
}