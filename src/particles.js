// ============================================================================
// Particle System & Ambient Visual Polish Engine (Zero-GC Pooling)
// ============================================================================

class ParticleSystem {
  constructor(scene) {
    this.scene = scene;

    // Particle Pools
    this.maxSparkles = 60;
    this.sparkles = [];
    this.sparkleIndex = 0;

    this.maxPuffs = 40;
    this.puffs = [];
    this.puffIndex = 0;

    this.maxCoins = 50;
    this.coins = [];
    this.coinIndex = 0;

    this.initSparkles();
    this.initPuffs();
    this.initCoins();
    this.initSunRays();
    this.initCozyLanterns();
  }

  // ============================================================================
  // 1. GOLDEN HARVEST SPARKLES (Crops, Eggs, Milk)
  // ============================================================================
  initSparkles() {
    const starGeo = new THREE.OctahedronGeometry(0.12, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffea00, transparent: true, opacity: 0.95 });

    this.sparkleGroup = new THREE.Group();
    this.scene.add(this.sparkleGroup);

    for (let i = 0; i < this.maxSparkles; i++) {
      const mesh = new THREE.Mesh(starGeo, starMat.clone());
      mesh.visible = false;
      mesh.castShadow = false;
      this.sparkleGroup.add(mesh);

      this.sparkles.push({
        mesh: mesh,
        active: false,
        vel: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.65
      });
    }
  }

  spawnHarvestSparkles(x, y, z, colorHex = 0xffd54f, count = 8) {
    for (let i = 0; i < count; i++) {
      const p = this.sparkles[this.sparkleIndex];
      this.sparkleIndex = (this.sparkleIndex + 1) % this.maxSparkles;

      p.active = true;
      p.mesh.visible = true;
      p.mesh.position.set(x + (Math.random() - 0.5) * 0.4, y + 0.3 + Math.random() * 0.3, z + (Math.random() - 0.5) * 0.4);
      p.mesh.scale.set(1, 1, 1);
      p.mesh.material.color.setHex(colorHex);
      p.mesh.material.opacity = 1.0;

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 2.2;
      p.vel.set(Math.cos(angle) * speed, 2.5 + Math.random() * 2.5, Math.sin(angle) * speed);
      p.rotVel.set(Math.random() * 10, Math.random() * 10, Math.random() * 10);
      p.life = 0;
      p.maxLife = 0.55 + Math.random() * 0.3;
    }
  }

  // ============================================================================
  // 2. SOFT FLOUR PUFFS & STEAM (Bakery Bread & Pastry Cake Mixer)
  // ============================================================================
  initPuffs() {
    const puffGeo = new THREE.DodecahedronGeometry(0.24, 1);
    const puffMat = new THREE.MeshLambertMaterial({ color: 0xfff8e1, transparent: true, opacity: 0.85 });

    this.puffGroup = new THREE.Group();
    this.scene.add(this.puffGroup);

    for (let i = 0; i < this.maxPuffs; i++) {
      const mesh = new THREE.Mesh(puffGeo, puffMat.clone());
      mesh.visible = false;
      this.puffGroup.add(mesh);

      this.puffs.push({
        mesh: mesh,
        active: false,
        vel: new THREE.Vector3(),
        scaleGrowth: 1.0,
        life: 0,
        maxLife: 0.8
      });
    }
  }

  spawnFlourPuff(x, y, z, count = 6, isGolden = false) {
    const colorHex = isGolden ? 0xffecb3 : 0xffffff;
    for (let i = 0; i < count; i++) {
      const p = this.puffs[this.puffIndex];
      this.puffIndex = (this.puffIndex + 1) % this.maxPuffs;

      p.active = true;
      p.mesh.visible = true;
      p.mesh.position.set(x + (Math.random() - 0.5) * 0.6, y + 0.5 + Math.random() * 0.4, z + (Math.random() - 0.5) * 0.6);
      p.mesh.scale.set(0.6, 0.6, 0.6);
      p.mesh.material.color.setHex(colorHex);
      p.mesh.material.opacity = 0.8;

      const spread = 0.6 + Math.random() * 0.8;
      const angle = Math.random() * Math.PI * 2;
      p.vel.set(Math.cos(angle) * spread, 1.2 + Math.random() * 1.5, Math.sin(angle) * spread);
      p.scaleGrowth = 1.8 + Math.random() * 1.2;
      p.life = 0;
      p.maxLife = 0.7 + Math.random() * 0.35;
    }
  }

  // ============================================================================
  // 3. CELEBRATORY COIN SPLASHES (Cashier Register Checkout)
  // ============================================================================
  initCoins() {
    const coinGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.04, 8);
    coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0xffb300, emissiveIntensity: 0.35 });

    this.coinGroup = new THREE.Group();
    this.scene.add(this.coinGroup);

    for (let i = 0; i < this.maxCoins; i++) {
      const mesh = new THREE.Mesh(coinGeo, coinMat.clone());
      mesh.visible = false;
      this.coinGroup.add(mesh);

      this.coins.push({
        mesh: mesh,
        active: false,
        vel: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.75
      });
    }
  }

  spawnCoinSplash(x, y, z, count = 10) {
    for (let i = 0; i < count; i++) {
      const p = this.coins[this.coinIndex];
      this.coinIndex = (this.coinIndex + 1) % this.maxCoins;

      p.active = true;
      p.mesh.visible = true;
      p.mesh.position.set(x + (Math.random() - 0.5) * 0.3, y + 1.1, z + (Math.random() - 0.5) * 0.3);
      p.mesh.scale.set(1, 1, 1);
      p.mesh.material.opacity = 1.0;

      const angle = Math.random() * Math.PI * 2;
      const hSpeed = 1.2 + Math.random() * 1.8;
      p.vel.set(Math.cos(angle) * hSpeed, 3.2 + Math.random() * 2.8, Math.sin(angle) * hSpeed);
      p.rotVel.set(Math.random() * 15, Math.random() * 15, Math.random() * 15);
      p.life = 0;
      p.maxLife = 0.65 + Math.random() * 0.3;
    }
  }

  // ============================================================================
  // 4. VOLUMETRIC AMBIENT SUN RAYS
  // ============================================================================
  initSunRays() {
    this.sunRayGroup = new THREE.Group();
    this.scene.add(this.sunRayGroup);

    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xfff9c4,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const rayGeo = new THREE.PlaneGeometry(3.5, 30);

    const rayConfigs = [
      { x: -8, z: -10, rotY: 0.4, rotX: 0.8 },
      { x: 0, z: -8, rotY: 0.35, rotX: 0.82 },
      { x: 8, z: -10, rotY: 0.3, rotX: 0.78 }
    ];

    this.rays = [];
    rayConfigs.forEach(cfg => {
      const ray = new THREE.Mesh(rayGeo, rayMat.clone());
      ray.position.set(cfg.x, 8, cfg.z);
      ray.rotation.set(cfg.rotX, cfg.rotY, 0.35);
      this.sunRayGroup.add(ray);
      this.rays.push(ray);
    });
  }

  // ============================================================================
  // 5. COZY GLOWING MART LANTERNS
  // ============================================================================
  initCozyLanterns() {
    this.lanternGroup = new THREE.Group();
    this.scene.add(this.lanternGroup);

    const postMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
    const brassMat = new THREE.MeshLambertMaterial({ color: 0xd7ccc8 });
    const glowGlassMat = new THREE.MeshBasicMaterial({ color: 0xffb74d });

    const lanternPositions = [
      { x: -5.8, z: 4.8 }, // West Entrance
      { x: 5.8, z: 4.8 },  // East Entrance
      { x: -14.2, z: 0.0 }, // West Field Corner
      { x: 14.2, z: 0.0 }   // East Field Corner
    ];

    lanternPositions.forEach(pos => {
      const post = new THREE.Group();
      post.position.set(pos.x, 0, pos.z);

      // Wooden Pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.6, 6), postMat);
      pole.position.y = 1.3;
      pole.castShadow = true;
      post.add(pole);

      // Arm
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.08), brassMat);
      arm.position.set(0.2, 2.45, 0);
      post.add(arm);

      // Lantern Body
      const lanternBox = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.28), glowGlassMat);
      lanternBox.position.set(0.42, 2.25, 0);
      post.add(lanternBox);

      // Soft Warm Light
      const warmLight = new THREE.PointLight(0xffb74d, 0.8, 6.5);
      warmLight.position.set(0.42, 2.25, 0);
      post.add(warmLight);

      this.lanternGroup.add(post);
    });
  }

  // ============================================================================
  // PER-FRAME UPDATE LOOP
  // ============================================================================
  update(dt) {
    const time = performance.now() * 0.001;

    // Update Sparkles
    for (let i = 0; i < this.maxSparkles; i++) {
      const p = this.sparkles[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      p.vel.y -= 9.8 * dt; // Gravity
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += p.rotVel.x * dt;
      p.mesh.rotation.y += p.rotVel.y * dt;

      const progress = p.life / p.maxLife;
      const scale = (1 - progress) * (1 + progress * 0.4);
      p.mesh.scale.set(scale, scale, scale);
      p.mesh.material.opacity = Math.max(0, 1 - progress);
    }

    // Update Puffs
    for (let i = 0; i < this.maxPuffs; i++) {
      const p = this.puffs[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      p.mesh.position.addScaledVector(p.vel, dt);
      p.vel.y += 0.4 * dt; // Gentle thermal rise

      const progress = p.life / p.maxLife;
      const scale = 0.6 + progress * p.scaleGrowth;
      p.mesh.scale.set(scale, scale, scale);
      p.mesh.material.opacity = Math.max(0, 0.85 * (1 - progress));
    }

    // Update Coins
    for (let i = 0; i < this.maxCoins; i++) {
      const p = this.coins[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      p.vel.y -= 14.0 * dt; // Coin gravity
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += p.rotVel.x * dt;
      p.mesh.rotation.y += p.rotVel.y * dt;

      const progress = p.life / p.maxLife;
      p.mesh.material.opacity = Math.max(0, 1.0 - progress * 0.8);
    }

    // Ambient Sun Rays Shimmer
    if (this.rays) {
      this.rays.forEach((ray, idx) => {
        const pulse = Math.sin(time * 1.2 + idx * 1.4) * 0.04 + 0.11;
        ray.material.opacity = pulse;
      });
    }
  }
}

// Global Export
if (typeof window !== 'undefined') {
  window.ParticleSystem = ParticleSystem;
}
if (typeof module !== 'undefined') {
  module.exports = { ParticleSystem };
}
