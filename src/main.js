// Master Game Engine with Alluring Cartoon Visuals, Black Sketch Outlines & Dynamic Upgrades
class GameEngine {
  constructor() {
    this.money = 0;
    this.growthMultiplier = 1.0;
    this.lastTime = performance.now();
    this.saveTimer = 0;
    this.isCashierPresent = false;

    this.initThree();
    this.initEnvironment();
    this.initGameObjects();
    this.initParticles();

    this.ui = new UIManager(this);

    this.loadGame();

    sdk.gameplayStart();
    requestAnimationFrame((t) => this.loop(t));
  }

  initThree() {
    this.container = document.getElementById('game-container');
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONFIG.COLORS.GRASS);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 140);
    this.cameraOffset = new THREE.Vector3(0, 26, 19);
    this.camera.position.set(0, 26, 19);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.NoToneMapping;

    this.container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xfff8e7, 0.42);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xfffaed, 0x33691e, 0.45);
    hemiLight.position.set(0, 25, 0);
    this.scene.add(hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff5e0, 0.68);
    this.sunLight.position.set(18, 34, 18);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 80;
    this.sunLight.shadow.bias = -0.0005;
    const shadowD = 32;
    this.sunLight.shadow.camera.left = -shadowD;
    this.sunLight.shadow.camera.right = shadowD;
    this.sunLight.shadow.camera.top = shadowD;
    this.sunLight.shadow.camera.bottom = -shadowD;
    this.scene.add(this.sunLight);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initEnvironment() {
    const addSketch = (mesh, color = 0x111111) => {
      try {
        const edges = new THREE.EdgesGeometry(mesh.geometry, 28);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: color, linewidth: 2.5 }));
        mesh.add(line);
      } catch (e) {}
    };

    // 1. Lush Green Ground with Contact Shadow Grid
    const groundGeo = new THREE.PlaneGeometry(140, 140);
    const groundMat = new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.GRASS });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Decorative Stepping Stone Pathways (Warm Ivory & Pale Limestone)
    const stoneMat1 = new THREE.MeshLambertMaterial({ color: 0xe0d5c1 });
    const stoneMat2 = new THREE.MeshLambertMaterial({ color: 0xd4c8b2 });
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x1b2e1b, transparent: true, opacity: 0.22 });

    const createPaver = (x, z, w = 0.75, d = 0.6, isAlt = false) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), isAlt ? stoneMat2 : stoneMat1);
      p.position.set(x, 0.016, z);
      p.receiveShadow = true;
      addSketch(p, 0x5d4037);
      this.scene.add(p);
    };

    // Main Market Entry Path (From West Gate into Main Aisle)
    for (let x = -11.2; x <= -6.0; x += 0.95) {
      createPaver(x, -6.65, 0.78, 0.9, Math.abs(x) % 2 > 1);
    }
    // Main Cash Register Walkway
    for (let x = -8.0; x <= 14.0; x += 1.1) {
      createPaver(x, 2.0, 0.85, 0.65, Math.abs(x) % 2 > 1);
    }
    // Farm Trails to Plots & Pens
    for (let z = 3.2; z <= 5.8; z += 0.95) {
      createPaver(-11.5, z, 0.85, 0.65);      // Chicken coop trail
      createPaver(-5.5, z, 0.8, 0.65, z > 5); // Tomato trail (under Left Register #1)
      createPaver(2.25, z, 0.8, 0.65, z < 5); // Wheat trail
      createPaver(10.0, z, 0.8, 0.65);        // Sweetcorn trail
      createPaver(18.0, z, 0.85, 0.65);       // Cow pasture trail (under Right Register #2)
    }

    // 3. Flower Tufts & Grass Clusters in Outdoors
    const flowerMatYellow = new THREE.MeshLambertMaterial({ color: 0xffeb3b });
    const flowerMatWhite = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x388e3c });
    const pebbleMat = new THREE.MeshLambertMaterial({ color: 0x9e9e9e });

    const outdoorDecorCoords = [
      [-14, 9], [-8, 12], [-1, 11], [6, 12], [14, 11], [15, 2], [15, -7],
      [-14, 3], [-14, -10], [12, -12], [-3, 13], [8, 13]
    ];

    outdoorDecorCoords.forEach((coord, idx) => {
      const group = new THREE.Group();
      group.position.set(coord[0], 0, coord[1]);

      // Grass patch
      const grassPatch = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.8, 0.02, 7), new THREE.MeshLambertMaterial({ color: 0x4cae2a }));
      grassPatch.position.y = 0.015;
      group.add(grassPatch);

      // Flowers or Pebbles
      if (idx % 2 === 0) {
        for (let f = 0; f < 3; f++) {
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 4), leafMat);
          stem.position.set((f - 1) * 0.18, 0.08, (f % 2 === 0 ? 0.1 : -0.1));
          group.add(stem);

          const petal = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), idx % 4 === 0 ? flowerMatYellow : flowerMatWhite);
          petal.position.set((f - 1) * 0.18, 0.16, (f % 2 === 0 ? 0.1 : -0.1));
          group.add(petal);
        }
      } else {
        const pebble = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), pebbleMat);
        pebble.scale.set(1.4, 0.6, 1.1);
        pebble.position.y = 0.06;
        addSketch(pebble, 0x111111);
        group.add(pebble);
      }

      this.scene.add(group);
    });

    // 4. Low-Poly Cozy Cartoon Trees with Sway
    this.animatedTrees = [];
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
    const foliageMat1 = new THREE.MeshLambertMaterial({ color: 0x43a047 });
    const foliageMat2 = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });

    const treePositions = [
      [-16.5, 7.5], [-16.5, -3.5], [-16.5, -12.5],
      [24.0, 7.5], [24.0, -2.5],
      [-8.5, 14.5], [0.0, 15.0], [7.5, 14.5], [14.0, 15.0]
    ];

    treePositions.forEach(pos => {
      const tree = new THREE.Group();
      tree.position.set(pos[0], 0, pos[1]);

      // Tree contact shadow
      const tShadow = new THREE.Mesh(new THREE.CircleGeometry(1.2, 12), shadowMat);
      tShadow.rotation.x = -Math.PI / 2;
      tShadow.position.y = 0.02;
      tree.add(tShadow);

      // Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.38, 1.6, 6), trunkMat);
      trunk.position.y = 0.8;
      trunk.castShadow = true;
      addSketch(trunk, 0x111111);
      tree.add(trunk);

      // Puffy Foliage
      const foliageGroup = new THREE.Group();
      foliageGroup.position.y = 1.6;

      const f1 = new THREE.Mesh(new THREE.SphereGeometry(1.0, 7, 7), foliageMat1);
      f1.position.set(0, 0.4, 0);
      f1.castShadow = true;
      addSketch(f1, 0x111111);
      foliageGroup.add(f1);

      const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.75, 7, 7), foliageMat2);
      f2.position.set(0.3, 1.0, 0.1);
      f2.castShadow = true;
      addSketch(f2, 0x111111);
      foliageGroup.add(f2);

      const f3 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 6, 6), foliageMat1);
      f3.position.set(-0.25, 1.3, -0.1);
      f3.castShadow = true;
      addSketch(f3, 0x111111);
      foliageGroup.add(f3);

      tree.add(foliageGroup);
      this.scene.add(tree);
      this.animatedTrees.push({ group: tree, foliage: foliageGroup, offset: Math.random() * 5 });
    });

    // 5. Polished Warm Dark Hardwood Market Floor (Softened, Subtle Planks)
    const createWoodFloorTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Base warm dark honey-walnut tone
      ctx.fillStyle = '#4a3328';
      ctx.fillRect(0, 0, 512, 512);

      const plankHeight = 64;
      const plankColors = ['#5e4235', '#533a2d', '#593e32', '#4e3529', '#63473a', '#573d31'];

      for (let y = 0; y < 512; y += plankHeight) {
        const rowIdx = Math.floor(y / plankHeight);
        const colShift = (rowIdx % 2) * 160;

        for (let x = -256; x < 768; x += 256) {
          const plankX = x + colShift;
          const color = plankColors[(rowIdx * 3 + Math.floor((x + 256) / 256)) % plankColors.length];
          
          // Plank fill
          ctx.fillStyle = color;
          ctx.fillRect(plankX + 1, y + 1, 254, plankHeight - 2);

          // Woodgrain fiber lines
          ctx.fillStyle = 'rgba(20, 10, 6, 0.12)';
          ctx.fillRect(plankX + 1, y + Math.floor(plankHeight * 0.3), 254, 1.5);
          ctx.fillRect(plankX + 1, y + Math.floor(plankHeight * 0.7), 254, 1.2);

          // Subtle wood knot
          if ((rowIdx + Math.floor(x / 256)) % 3 === 0) {
            ctx.fillStyle = 'rgba(28, 14, 8, 0.22)';
            ctx.beginPath();
            ctx.arc(plankX + 60, y + plankHeight / 2, 5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Top highlight bevel
          ctx.fillStyle = 'rgba(255, 235, 215, 0.08)';
          ctx.fillRect(plankX + 1, y + 1, 254, 2);

          // Plank joint shadows
          ctx.strokeStyle = 'rgba(25, 12, 8, 0.55)';
          ctx.lineWidth = 2.0;
          ctx.strokeRect(plankX + 0.5, y + 0.5, 255, plankHeight - 1);
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(12, 6);
      return texture;
    };

    const woodTexture = createWoodFloorTexture();
    const floorGeo = new THREE.PlaneGeometry(34, 18);
    const marketFloor = new THREE.Mesh(floorGeo, new THREE.MeshLambertMaterial({ map: woodTexture }));
    marketFloor.rotation.x = -Math.PI / 2;
    marketFloor.position.set(5.0, 0.01, -4.5);
    marketFloor.receiveShadow = true;
    this.scene.add(marketFloor);

    // Floor Beveled Wood Perimeter Trim
    const borderMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
    const floorBorder = new THREE.Mesh(new THREE.PlaneGeometry(34.4, 18.4), borderMat);
    floorBorder.rotation.x = -Math.PI / 2;
    floorBorder.position.set(5.0, 0.005, -4.5);
    floorBorder.receiveShadow = true;
    addSketch(floorBorder, 0x111111);
    this.scene.add(floorBorder);

    // Customer Checkout Walkway Runner (Terracotta & Cream Tile Pattern)
    const createTileRunnerTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#b45309'; // Warm terracotta
      ctx.fillRect(0, 0, 256, 256);

      const tileSize = 64;
      for (let y = 0; y < 256; y += tileSize) {
        for (let x = 0; x < 256; x += tileSize) {
          if ((x / tileSize + y / tileSize) % 2 === 0) {
            ctx.fillStyle = '#fef3c7'; // Cream mosaic accent
            ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
          } else {
            ctx.fillStyle = '#d97706';
            ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
          }
          ctx.strokeStyle = 'rgba(69, 26, 3, 0.4)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, tileSize, tileSize);
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(8, 1);
      return texture;
    };

    const runnerGeo = new THREE.PlaneGeometry(30.0, 1.8);
    const runnerMat = new THREE.MeshLambertMaterial({ map: createTileRunnerTexture() });
    const walkwayRunner = new THREE.Mesh(runnerGeo, runnerMat);
    walkwayRunner.rotation.x = -Math.PI / 2;
    walkwayRunner.position.set(6.5, 0.015, 2.0);
    walkwayRunner.receiveShadow = true;
    this.scene.add(walkwayRunner);

    // Entrance Coir Welcome Mat
    const createWelcomeMatTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#854d0e'; // Coconut coir brown
      ctx.fillRect(0, 0, 512, 256);

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 10;
      ctx.strokeRect(16, 16, 480, 224);

      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('🌿 ORGANIC FARM MART 🌿', 256, 128);

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };

    const welcomeMat = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), new THREE.MeshLambertMaterial({ map: createWelcomeMatTexture() }));
    welcomeMat.rotation.x = -Math.PI / 2;
    welcomeMat.position.set(-6.0, 0.018, -13.5);
    welcomeMat.receiveShadow = true;
    this.scene.add(welcomeMat);

    // 6. Directional Wooden Tycoon Signposts
    const createSignpost = (x, z, signs = []) => {
      const spGroup = new THREE.Group();
      spGroup.position.set(x, 0, z);

      const postShadow = new THREE.Mesh(new THREE.CircleGeometry(0.4, 8), shadowMat);
      postShadow.rotation.x = -Math.PI / 2;
      postShadow.position.y = 0.02;
      spGroup.add(postShadow);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.8, 6), trunkMat);
      post.position.y = 0.9;
      post.castShadow = true;
      addSketch(post, 0x111111);
      spGroup.add(post);

      signs.forEach((s, sIdx) => {
        const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.28, 0.08), borderMat);
        signBoard.position.set(0, 1.4 - sIdx * 0.35, 0);
        signBoard.rotation.y = s.rotY || 0;
        signBoard.castShadow = true;
        addSketch(signBoard, 0x111111);
        spGroup.add(signBoard);
      });

      this.scene.add(spGroup);
    };

    createSignpost(-7.5, 3.2, [{ text: '🛒 MART', rotY: 0 }, { text: '🌾 FARM', rotY: Math.PI / 2 }]);
    createSignpost(11.5, 3.2, [{ text: '💵 CASHIER', rotY: 0 }, { text: '🐄 DAIRY', rotY: -Math.PI / 2 }]);

    // 7. Decorative Crates & Barrels
    const crateMat = new THREE.MeshLambertMaterial({ color: 0xbcaaa4 });
    const darkWoodMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });

    const createCrate = (x, z, rot = 0) => {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 0.7), crateMat);
      crate.position.set(x, 0.325, z);
      crate.rotation.y = rot;
      crate.castShadow = true;
      addSketch(crate, 0x111111);
      this.scene.add(crate);
    };

    const createBarrel = (x, z) => {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.32, 0.75, 8), darkWoodMat);
      barrel.position.set(x, 0.375, z);
      barrel.castShadow = true;
      addSketch(barrel, 0x111111);
      this.scene.add(barrel);
    };

    createCrate(-11.2, -8.0, 0.2);
    createCrate(-11.2, -8.7, -0.1);
    createBarrel(-11.2, -10.0);
    createCrate(17.5, -4.5, 0.15);
    createBarrel(17.5, -6.0);

    // 8. Walls, Windows, Trim & Glass Door
    // A. Left North Wall (to the left of Left North Gate)
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.8, 0.2), new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.BACK_WALL }));
    wallLeft.position.set(-10.0, 1.4, -13.5);
    wallLeft.castShadow = true;
    addSketch(wallLeft, 0x111111);
    this.scene.add(wallLeft);

    // B. Center North Wall (between Left North Gate and Right North Gate, behind market shelves)
    const wallCenter = new THREE.Mesh(new THREE.BoxGeometry(21.5, 2.8, 0.2), new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.BACK_WALL }));
    wallCenter.position.set(6.75, 1.4, -13.5);
    wallCenter.castShadow = true;
    addSketch(wallCenter, 0x111111);
    this.scene.add(wallCenter);

    // C. Right North Corner Wall (to the right of Right North Gate)
    const wallRightEnd = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.8, 0.2), new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.BACK_WALL }));
    wallRightEnd.position.set(21.8, 1.4, -13.5);
    wallRightEnd.castShadow = true;
    addSketch(wallRightEnd, 0x111111);
    this.scene.add(wallRightEnd);

    // D. Continuous Top Wall Trim running along the entire North Wall
    const trimGeo = new THREE.BoxGeometry(34.2, 0.24, 0.24);
    const wallTrim = new THREE.Mesh(trimGeo, new THREE.MeshLambertMaterial({ color: 0x795548 }));
    wallTrim.position.set(5.0, 2.7, -13.5);
    addSketch(wallTrim, 0x111111);
    this.scene.add(wallTrim);

    // E. East Side Wall (Top & Bottom segments flanking the Right Side Exit Doorway)
    const rightWallTop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.8, 6.5), new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.BACK_WALL }));
    rightWallTop.position.set(22.0, 1.4, -10.25);
    rightWallTop.castShadow = true;
    addSketch(rightWallTop, 0x111111);
    this.scene.add(rightWallTop);

    const rightTrimTop = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 6.5), new THREE.MeshLambertMaterial({ color: 0x795548 }));
    rightTrimTop.position.set(22.0, 2.7, -10.25);
    addSketch(rightTrimTop, 0x111111);
    this.scene.add(rightTrimTop);

    const rightWallBottom = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.8, 6.0), new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.BACK_WALL }));
    rightWallBottom.position.set(22.0, 1.4, 1.0);
    rightWallBottom.castShadow = true;
    addSketch(rightWallBottom, 0x111111);
    this.scene.add(rightWallBottom);

    const rightTrimBottom = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 6.0), new THREE.MeshLambertMaterial({ color: 0x795548 }));
    rightTrimBottom.position.set(22.0, 2.7, 1.0);
    addSketch(rightTrimBottom, 0x111111);
    this.scene.add(rightTrimBottom);

    // Architectural Timber Pillars & Cozy Wall Sconces framing gates & departments
    const timberMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
    const lanternMat = new THREE.MeshLambertMaterial({ color: 0xffecb3, emissive: 0xffb300, emissiveIntensity: 0.65 });
    const columnXCoords = [-11.8, -8.0, -4.0, 1.0, 7.45, 12.75, 17.5, 21.8];

    columnXCoords.forEach(x => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.8, 0.26), timberMat);
      col.position.set(x, 1.4, -13.4);
      col.castShadow = true;
      addSketch(col, 0x111111);
      this.scene.add(col);

      // Cozy wall sconce lantern
      const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.16), lanternMat);
      lantern.position.set(x, 2.1, -13.22);
      addSketch(lantern, 0x111111);
      this.scene.add(lantern);
    });

    // Hanging Overhead Industrial Copper Dome Pendant Lamps
    const copperMat = new THREE.MeshLambertMaterial({ color: 0xb87333 });
    const bulbMat = new THREE.MeshLambertMaterial({ color: 0xfff9c4, emissive: 0xffd54f, emissiveIntensity: 0.85 });
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x212121 });

    const lampPositions = [
      [-6.5, 0.0], [-0.5, -4.5], [4.8, -4.5], [10.1, -4.5], [15.4, -4.5],
      [-0.5, -10.5], [4.8, -10.5], [10.1, -10.5], [15.4, -10.5], [19.5, 0.0]
    ];

    lampPositions.forEach(pos => {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(pos[0], 2.8, pos[1]);

      // Suspension wire
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 4), wireMat);
      wire.position.y = -0.4;
      lampGroup.add(wire);

      // Copper dome shade
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.22, 10, 1, true), copperMat);
      shade.position.y = -0.8;
      shade.rotation.x = Math.PI;
      lampGroup.add(shade);

      // Glowing warm bulb
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), bulbMat);
      bulb.position.y = -0.86;
      lampGroup.add(bulb);

      this.scene.add(lampGroup);
    });

    // Hanging Wooden Department Signs under Wall Trim
    const deptSignMat = new THREE.MeshLambertMaterial({ color: 0x8d5b32 });
    const deptSigns = [
      { text: '🥫 CANNERY', x: -0.5 },
      { text: '🥛 DAIRY', x: 4.8 },
      { text: '🍞 BAKERY', x: 10.1 },
      { text: '🎂 PATISSERIE', x: 15.4 }
    ];

    deptSigns.forEach(s => {
      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.38, 0.08), deptSignMat);
      signBoard.position.set(s.x, 2.45, -13.32);
      addSketch(signBoard, 0x111111);
      this.scene.add(signBoard);

      // Gold border trim on department sign
      const signTrim = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.42, 0.04), new THREE.MeshLambertMaterial({ color: 0xffd54f }));
      signTrim.position.set(s.x, 2.45, -13.34);
      this.scene.add(signTrim);
    });

    // Lush Indoor Potted Monstera & Ficus Plants
    const ceramicMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
    const soilMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
    const plantFoliageMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });

    const createIndoorPlant = (x, z) => {
      const potGroup = new THREE.Group();
      potGroup.position.set(x, 0, z);

      // White ceramic pot
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.55, 12), ceramicMat);
      pot.position.y = 0.275;
      pot.castShadow = true;
      potGroup.add(pot);

      // Soil inside
      const soil = new THREE.Mesh(new THREE.CircleGeometry(0.28, 12), soilMat);
      soil.rotation.x = -Math.PI / 2;
      soil.position.y = 0.54;
      potGroup.add(soil);

      // Lush tropical leaves
      for (let l = 0; l < 6; l++) {
        const leafAngle = (l / 6) * Math.PI * 2;
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), plantFoliageMat);
        leaf.scale.set(1.4, 0.3, 0.9);
        leaf.rotation.y = leafAngle;
        leaf.rotation.z = 0.45;
        leaf.position.set(Math.cos(leafAngle) * 0.22, 0.72 + (l % 2) * 0.1, Math.sin(leafAngle) * 0.22);
        leaf.castShadow = true;
        potGroup.add(leaf);
      }

      this.scene.add(potGroup);
    };

    createIndoorPlant(-11.5, -4.5);
    createIndoorPlant(-11.5, 0.5);
    createIndoorPlant(18.0, 0.5);

    // Contextual Farm Accessories (Watering Can & Terra Cotta Pots)
    const potMat = new THREE.MeshLambertMaterial({ color: 0xbcaaa4 });
    const createPot = (x, z, scale = 1.0) => {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.12 * scale, 0.32 * scale, 8), potMat);
      pot.position.set(x, 0.16 * scale, z);
      pot.castShadow = true;
      addSketch(pot, 0x111111);
      this.scene.add(pot);
    };

    createPot(-7.8, 7.2, 1.1);
    createPot(-7.5, 7.5, 0.85);

    const wateringCan = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.32, 8), new THREE.MeshLambertMaterial({ color: 0x78909c }));
    wateringCan.position.set(-7.5, 0.16, 6.8);
    wateringCan.castShadow = true;
    addSketch(wateringCan, 0x111111);
    this.scene.add(wateringCan);

    // Burlap Seed Sacks beside Wheat Plot
    const sackMat = new THREE.MeshLambertMaterial({ color: 0xd7ccc8 });
    const sack1 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.52, 8), sackMat);
    sack1.position.set(4.6, 0.26, 7.0);
    sack1.castShadow = true;
    addSketch(sack1, 0x111111);
    this.scene.add(sack1);

    // Vintage Silver Milk Cans beside Cow Pasture
    const milkCanMat = new THREE.MeshLambertMaterial({ color: 0xb0bec5 });
    const createMilkCan = (x, z) => {
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.54, 8), milkCanMat);
      can.position.set(x, 0.27, z);
      can.castShadow = true;
      addSketch(can, 0x111111);
      this.scene.add(can);
    };
    createMilkCan(15.2, 6.2);
    createMilkCan(15.6, 6.4);

    // Entrance Wicker Shopping Baskets & Chalkboard Stand
    const basketMat = new THREE.MeshLambertMaterial({ color: 0xc8a26e });
    for (let b = 0; b < 3; b++) {
      const basket = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.38), basketMat);
      basket.position.set(-10.8, 0.07 + b * 0.14, -5.8);
      basket.castShadow = true;
      addSketch(basket, 0x111111);
      this.scene.add(basket);
    }

    const chalkBoard = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.08), new THREE.MeshLambertMaterial({ color: 0x263238 }));
    chalkBoard.position.set(-10.8, 0.55, -7.4);
    chalkBoard.rotation.y = 0.2;
    chalkBoard.castShadow = true;
    addSketch(chalkBoard, 0x111111);
    this.scene.add(chalkBoard);

    // Interactive Butterflies in Outdoor Meadow
    this.animatedButterflies = [];
    const bColors = [0xffeb3b, 0x00e5ff, 0xff4081];
    const bCoords = [[-6.0, 8.0], [4.0, 8.5], [11.0, 7.5]];

    bCoords.forEach((coord, idx) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(coord[0], 0.6 + idx * 0.2, coord[1]);

      const wingMat = new THREE.MeshBasicMaterial({ color: bColors[idx], side: THREE.DoubleSide });
      const wingL = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.1), wingMat);
      wingL.position.set(-0.06, 0, 0);
      bGroup.add(wingL);

      const wingR = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.1), wingMat);
      wingR.position.set(0.06, 0, 0);
      bGroup.add(wingR);

      this.scene.add(bGroup);
      this.animatedButterflies.push({ group: bGroup, wingL, wingR, basePos: bGroup.position.clone(), seed: idx * 2.5 });
    });

    const doorMat = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.4), new THREE.MeshLambertMaterial({ color: 0xa07148 }));
    doorMat.rotation.x = -Math.PI / 2;
    doorMat.position.set(-6.0, 0.015, -13.5);
    doorMat.receiveShadow = true;
    addSketch(doorMat, 0x111111);
    this.scene.add(doorMat);

    const glassDoor = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.2, 0.08), new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.GLASS_DOOR, transparent: true, opacity: 0.65 }));
    glassDoor.position.set(-6.0, 1.6, -13.5);
    addSketch(glassDoor, 0x111111);
    this.scene.add(glassDoor);

    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.2), new THREE.MeshLambertMaterial({ color: 0x8d5b32 }));
    desk.position.set(-10.5, 0.4, -12.0);
    desk.castShadow = true;
    addSketch(desk, 0x111111);
    this.scene.add(desk);

    const officePC = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.08), new THREE.MeshLambertMaterial({ color: 0x212121 }));
    officePC.position.set(-10.5, 1.0, -10.8);
    addSketch(officePC, 0x111111);
    this.scene.add(officePC);

    const plantPot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.28, 8), new THREE.MeshLambertMaterial({ color: 0xd7ccc8 }));
    plantPot.position.set(-9.6, 0.94, -10.8);
    addSketch(plantPot, 0x111111);
    this.scene.add(plantPot);

    const plantLeaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), new THREE.MeshLambertMaterial({ color: 0x2e7d32 }));
    plantLeaf.position.set(-9.6, 1.15, -10.8);
    addSketch(plantLeaf, 0x111111);
    this.scene.add(plantLeaf);

    const leftWallTop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.8, 3.2), new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.BACK_WALL }));
    leftWallTop.position.set(-12.0, 1.4, -8.6);
    leftWallTop.castShadow = true;
    addSketch(leftWallTop, 0x111111);
    this.scene.add(leftWallTop);

    const leftWallBottom = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.8, 2.0), new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.BACK_WALL }));
    leftWallBottom.position.set(-12.0, 1.4, -1.0);
    leftWallBottom.castShadow = true;
    addSketch(leftWallBottom, 0x111111);
    this.scene.add(leftWallBottom);

    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x455a64 });
    const pillarHighlight = new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.WALL_TRIM });

    const pillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.8, 0.3), pillarMat);
    pillar1.position.set(-12.0, 1.4, -7.0);
    pillar1.castShadow = true;
    addSketch(pillar1, 0x111111);
    this.scene.add(pillar1);

    const pillar1Cap = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.35), pillarHighlight);
    pillar1Cap.position.set(-12.0, 2.8, -7.0);
    addSketch(pillar1Cap, 0x111111);
    this.scene.add(pillar1Cap);

    const pillar2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.8, 0.3), pillarMat);
    pillar2.position.set(-12.0, 1.4, -2.0);
    pillar2.castShadow = true;
    addSketch(pillar2, 0x111111);
    this.scene.add(pillar2);

    const pillar2Cap = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.35), pillarHighlight);
    pillar2Cap.position.set(-12.0, 2.8, -2.0);
    addSketch(pillar2Cap, 0x111111);
    this.scene.add(pillar2Cap);

    const entryMat = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.2), new THREE.MeshLambertMaterial({ color: 0xba8c59 }));
    entryMat.rotation.x = -Math.PI / 2;
    entryMat.position.set(-12.0, 0.018, -4.5);
    entryMat.receiveShadow = true;
    addSketch(entryMat, 0x111111);
    this.scene.add(entryMat);

    const awningGroup = new THREE.Group();
    awningGroup.position.set(-12.0, 2.4, -4.5);
    const stripeCount = 8;
    const stripeW = 0.45;
    for (let i = 0; i < stripeCount; i++) {
      const isRed = i % 2 === 0;
      const stripeMat = new THREE.MeshLambertMaterial({ color: isRed ? CONFIG.COLORS.AWNING_RED : CONFIG.COLORS.AWNING_WHITE });
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, stripeW), stripeMat);
      stripe.position.set(0.6, 0, (i - stripeCount/2 + 0.5) * stripeW);
      stripe.rotation.z = -0.35;
      stripe.castShadow = true;
      addSketch(stripe, 0x111111);
      awningGroup.add(stripe);
    }
    this.scene.add(awningGroup);

    // North-East Pastry Gate (Next to Royal Pastry Shelf on North Wall - just like Left North Gate)
    this.eastDoorGroup = new THREE.Group();

    const eastDoorMat = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.4), new THREE.MeshLambertMaterial({ color: 0xa07148 }));
    eastDoorMat.rotation.x = -Math.PI / 2;
    eastDoorMat.position.set(19.5, 0.015, -13.5);
    eastDoorMat.receiveShadow = true;
    addSketch(eastDoorMat, 0x111111);
    this.eastDoorGroup.add(eastDoorMat);

    const eastGlassDoor = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.2, 0.08), new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.GLASS_DOOR, transparent: true, opacity: 0.65 }));
    eastGlassDoor.position.set(19.5, 1.6, -13.5);
    addSketch(eastGlassDoor, 0x111111);
    this.eastDoorGroup.add(eastGlassDoor);

    this.eastDoorGroup.visible = false;
    this.scene.add(this.eastDoorGroup);

    // North-East Under-Renovation Barricade when locked
    this.eastBarricadeGroup = new THREE.Group();
    this.eastBarricadeGroup.position.set(19.5, 0, -13.5);
    for (let p = 0; p < 3; p++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.28, 0.2), new THREE.MeshLambertMaterial({ color: 0xa1887f }));
      plank.position.set(0, 0.5 + p * 0.6, 0);
      plank.castShadow = true;
      addSketch(plank, 0x111111);
      this.eastBarricadeGroup.add(plank);
    }
    this.scene.add(this.eastBarricadeGroup);

    // Right Side Wall Exit Gate (East Side Wall at x = 22.0, z = -4.5)
    const eastPillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.8, 0.3), pillarMat);
    eastPillar1.position.set(22.0, 1.4, -7.0);
    eastPillar1.castShadow = true;
    addSketch(eastPillar1, 0x111111);
    this.scene.add(eastPillar1);

    const eastPillar1Cap = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.35), pillarHighlight);
    eastPillar1Cap.position.set(22.0, 2.8, -7.0);
    addSketch(eastPillar1Cap, 0x111111);
    this.scene.add(eastPillar1Cap);

    const eastPillar2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.8, 0.3), pillarMat);
    eastPillar2.position.set(22.0, 1.4, -2.0);
    eastPillar2.castShadow = true;
    addSketch(eastPillar2, 0x111111);
    this.scene.add(eastPillar2);

    const eastPillar2Cap = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.35), pillarHighlight);
    eastPillar2Cap.position.set(22.0, 2.8, -2.0);
    addSketch(eastPillar2Cap, 0x111111);
    this.scene.add(eastPillar2Cap);

    this.eastExitGroup = new THREE.Group();
    const eastExitMat = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.2), new THREE.MeshLambertMaterial({ color: 0xba8c59 }));
    eastExitMat.rotation.x = -Math.PI / 2;
    eastExitMat.position.set(22.0, 0.018, -4.5);
    eastExitMat.receiveShadow = true;
    addSketch(eastExitMat, 0x111111);
    this.eastExitGroup.add(eastExitMat);

    const eastExitAwningGroup = new THREE.Group();
    eastExitAwningGroup.position.set(22.0, 2.4, -4.5);
    for (let i = 0; i < stripeCount; i++) {
      const isRed = i % 2 === 0;
      const stripeMat = new THREE.MeshLambertMaterial({ color: isRed ? CONFIG.COLORS.AWNING_RED : CONFIG.COLORS.AWNING_WHITE });
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, stripeW), stripeMat);
      stripe.position.set(-0.6, 0, (i - stripeCount/2 + 0.5) * stripeW);
      stripe.rotation.z = 0.35;
      stripe.castShadow = true;
      addSketch(stripe, 0x111111);
      eastExitAwningGroup.add(stripe);
    }
    this.eastExitGroup.add(eastExitAwningGroup);
    this.eastExitGroup.visible = false;
    this.scene.add(this.eastExitGroup);

    // East Exit Under-Renovation Barricade when locked
    this.eastExitBarricade = new THREE.Group();
    this.eastExitBarricade.position.set(22.0, 0, -4.5);
    for (let p = 0; p < 3; p++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 4.4), new THREE.MeshLambertMaterial({ color: 0xa1887f }));
      plank.position.set(0, 0.5 + p * 0.6, 0);
      plank.castShadow = true;
      addSketch(plank, 0x111111);
      this.eastExitBarricade.add(plank);
    }
    this.scene.add(this.eastExitBarricade);
  }

  initGameObjects() {
    this.player = new Player(this.scene);

    this.cropPatches = [
      new CropPatch(this.scene, { id: 'plot_tomato', itemId: 'TOMATO', growthInterval: 3.0, pos: { x: -5.5, z: 7.0 }, unlocked: true }),
      new CropPatch(this.scene, { id: 'plot_wheat', itemId: 'WHEAT', growthInterval: 4.5, pos: { x: 2.25, z: 7.0 }, unlocked: false }),
      new CropPatch(this.scene, { id: 'plot_carrot', itemId: 'CARROT', growthInterval: 7.5, pos: { x: 10.0, z: 7.0 }, unlocked: false })
    ];

    this.animalPens = [
      new AnimalPen(this.scene, { id: 'pen_chicken', type: 'CHICKEN', produceId: 'EGG', pos: { x: -11.5, z: 6.5 }, unlocked: false }),
      new AnimalPen(this.scene, { id: 'pen_cow', type: 'COW', produceId: 'MILK', pos: { x: 18.0, z: 6.5 }, unlocked: false })
    ];

    this.processingMachines = [
      new ProcessingMachine(this.scene, { id: 'machine_juicer', type: 'JUICER', outputId: 'JUICE', pos: { x: -0.5, z: -0.8 }, unlocked: false }),
      new ProcessingMachine(this.scene, { id: 'machine_bakery', type: 'BAKERY', outputId: 'BREAD', pos: { x: 4.8, z: -0.8 }, unlocked: false }),
      new ProcessingMachine(this.scene, { id: 'machine_cakery', type: 'CAKERY', outputId: 'CAKE', pos: { x: 10.1, z: -0.8 }, unlocked: false })
    ];

    this.marketStands = [
      new MarketStand(this.scene, { id: 'stand_egg', itemId: 'EGG', pos: { x: -0.5, z: -6.65 }, unlocked: false }),
      new MarketStand(this.scene, { id: 'stand_tomato', itemId: 'TOMATO', pos: { x: 4.8, z: -6.65 }, unlocked: true }),
      new MarketStand(this.scene, { id: 'stand_wheat', itemId: 'WHEAT', pos: { x: 10.1, z: -6.65 }, unlocked: false }),
      new MarketStand(this.scene, { id: 'stand_carrot', itemId: 'CARROT', pos: { x: 15.4, z: -6.65 }, unlocked: false }),
      new MarketStand(this.scene, { id: 'stand_juice', itemId: 'JUICE', pos: { x: -0.5, z: -12.5 }, unlocked: false }),
      new MarketStand(this.scene, { id: 'stand_milk', itemId: 'MILK', pos: { x: 4.8, z: -12.5 }, unlocked: false }),
      new MarketStand(this.scene, { id: 'stand_bread', itemId: 'BREAD', pos: { x: 10.1, z: -12.5 }, unlocked: false }),
      new MarketStand(this.scene, { id: 'stand_cake', itemId: 'CAKE', pos: { x: 15.4, z: -12.5 }, unlocked: false })
    ];

    this.cashRegisters = [
      new CashRegister(this.scene, { x: -6.5, z: 2.0 }),
      new CashRegister(this.scene, { x: 19.5, z: 2.0 })
    ];

    // Single central dustbin (rightmost removed as requested)
    this.dustbins = [
      new Dustbin(this.scene, { x: 2.4, z: -12.8 })
    ];

    this.staffStocker = new HelperWorker(this.scene, 'STOCKER', { x: -5.0, z: 0.5 });
    this.staffFarmer = new HelperWorker(this.scene, 'FARMER', { x: -1.5, z: 4.5 });
    this.staffHarvester = new HelperWorker(this.scene, 'HARVESTER', { x: 6.0, z: 4.5 });
    this.staffChef = new HelperWorker(this.scene, 'CHEF', { x: 10.1, z: 2.5 });
    this.staffCashier = new HelperCashier(this.scene, { x: -6.5, z: 2.35 }, 0x8e24aa, 0xab47bc, 0x6a1b9a);
    this.staffCashier2 = new HelperCashier(this.scene, { x: 19.5, z: 2.35 }, 0x0284c7, 0x38bdf8, 0x0369a1);

    this.customerManager = new CustomerManager(this.scene);

    this.unlockZones = [];
    Object.values(CONFIG.UNLOCKS).forEach(cfg => {
      if (cfg.cost > 0) {
        const zone = new UnlockZone(this.scene, cfg, (id) => this.onZoneUnlocked(id));
        this.unlockZones.push(zone);
      }
    });

    this.refreshUnlockZoneVisibility();
  }

  refreshAllUpgrades() {
    if (this.player) this.player.refreshStats();
    if (this.animalPens) this.animalPens.forEach(p => p.refreshStats());
    if (this.processingMachines) this.processingMachines.forEach(m => m.refreshStats());
    if (this.marketStands) this.marketStands.forEach(s => s.refreshStats());
    if (this.staffStocker) this.staffStocker.refreshStats();
    if (this.staffHarvester) this.staffHarvester.refreshStats();
    if (this.staffFarmer) this.staffFarmer.refreshStats();
    if (this.staffChef) this.staffChef.refreshStats();
  }

  initParticles() {
    this.particles = [];
    this.particleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  }

  spawnConfetti(pos) {
    const colors = [0xffea00, 0x00e676, 0x00e5ff, 0xff1744, 0xff9100];
    for (let i = 0; i < 28; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
      const p = new THREE.Mesh(this.particleGeo, mat);
      p.position.set(pos.x, pos.y + 0.8, pos.z);
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4.0;
      
      this.scene.add(p);
      this.particles.push({
        mesh: p,
        vx: Math.cos(angle) * speed,
        vy: 4.0 + Math.random() * 3.5,
        vz: Math.sin(angle) * speed,
        rotVx: (Math.random() - 0.5) * 10,
        rotVy: (Math.random() - 0.5) * 10,
        life: 1.5,
        maxLife: 1.5
      });
    }
  }

  spawnTrashPuff(pos) {
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x78909c });
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 4), mat);
      p.position.set(pos.x, pos.y + 0.6, pos.z);
      this.scene.add(p);
      this.particles.push({
        mesh: p,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 1.2 + Math.random() * 1.0,
        vz: (Math.random() - 0.5) * 1.5,
        rotVx: 0,
        rotVy: 0,
        life: 0.6,
        maxLife: 0.6
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 9.8 * dt;

      p.mesh.rotation.x += p.rotVx * dt;
      p.mesh.rotation.y += p.rotVy * dt;

      const scale = Math.max(0, p.life / p.maxLife);
      p.mesh.scale.set(scale, scale, scale);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  resolveObstacleCollisions(entityPos, radius = 0.42, includeShelves = true) {
    if (includeShelves) {
      this.marketStands.forEach(stand => {
        if (!stand.unlocked) return;
        // Shelves: Edges, corners, and ends are walkthrough; only compact central spine has collision
        this.resolveBoxCollision(entityPos, stand.pos, 0.5, 0.3, radius);
      });
    }

    // Cash Registers: Edges and flanks are walkthrough, only compact central core has collision
    this.cashRegisters.forEach(reg => {
      this.resolveBoxCollision(entityPos, reg.pos, 0.55, 0.35, radius);
    });

    if (this.staffCashier && this.staffCashier.unlocked) {
      this.resolveBoxCollision(entityPos, this.staffCashier.pos, 0.25, 0.25, radius);
    }
    if (this.staffCashier2 && this.staffCashier2.unlocked) {
      this.resolveBoxCollision(entityPos, this.staffCashier2.pos, 0.25, 0.25, radius);
    }

    // Animal pens (Chicken Coop & Cow Booth) are fully walkthrough for player & helpers
    // No box collision blocking movement inside pens

    this.processingMachines.forEach(m => {
      if (!m.unlocked) return;
      // Processing Machines: Edges walkthrough
      this.resolveBoxCollision(entityPos, m.config.pos, 0.65, 0.35, radius);
    });

    this.dustbins.forEach(bin => {
      this.resolveBoxCollision(entityPos, bin.pos, 0.45, 0.45, radius);
    });

    this.resolveBoxCollision(entityPos, { x: -12.0, z: -8.6 }, 0.2, 1.6, radius);
    this.resolveBoxCollision(entityPos, { x: -12.0, z: -1.0 }, 0.2, 1.0, radius);

    // North Wall Segments (Left, Center between gates, Right Corner)
    this.resolveBoxCollision(entityPos, { x: -10.0, z: -13.5 }, 2.0, 0.2, radius);
    this.resolveBoxCollision(entityPos, { x: 6.75, z: -13.5 }, 10.75, 0.2, radius);
    this.resolveBoxCollision(entityPos, { x: 21.8, z: -13.5 }, 0.3, 0.2, radius);

    // East Side Wall Segments (Top & Bottom flanking the Right Wall Exit Door at z = -4.5)
    this.resolveBoxCollision(entityPos, { x: 22.0, z: -10.25 }, 0.2, 3.25, radius);
    this.resolveBoxCollision(entityPos, { x: 22.0, z: 1.0 }, 0.2, 3.0, radius);

    // Barricade collisions when locked (North Entry & East Exit)
    if (CONFIG.UNLOCKS.door_east && !CONFIG.UNLOCKS.door_east.unlocked) {
      this.resolveBoxCollision(entityPos, { x: 19.5, z: -13.5 }, 1.9, 0.2, radius);
      this.resolveBoxCollision(entityPos, { x: 22.0, z: -4.5 }, 0.2, 2.5, radius);
    }
  }

  resolveBoxCollision(entityPos, boxCenter, halfW, halfD, radius) {
    const minX = boxCenter.x - halfW - radius;
    const maxX = boxCenter.x + halfW + radius;
    const minZ = boxCenter.z - halfD - radius;
    const maxZ = boxCenter.z + halfD + radius;

    if (entityPos.x > minX && entityPos.x < maxX && entityPos.z > minZ && entityPos.z < maxZ) {
      const distL = entityPos.x - minX;
      const distR = maxX - entityPos.x;
      const distT = entityPos.z - minZ;
      const distB = maxZ - entityPos.z;

      const minDist = Math.min(distL, distR, distT, distB);
      if (minDist === distL) entityPos.x = minX;
      else if (minDist === distR) entityPos.x = maxX;
      else if (minDist === distT) entityPos.z = minZ;
      else entityPos.z = maxZ;
    }
  }

  applyUnlock(zoneId) {
    if (CONFIG.UNLOCKS[zoneId]) CONFIG.UNLOCKS[zoneId].unlocked = true;

    if (zoneId === 'plot_wheat') {
      const p = this.cropPatches.find(cp => cp.config.id === 'plot_wheat');
      if (p) p.setUnlocked(true);
    } else if (zoneId === 'plot_carrot') {
      const p = this.cropPatches.find(cp => cp.config.id === 'plot_carrot');
      if (p) p.setUnlocked(true);
    } else if (zoneId === 'pen_chicken') {
      const pen = this.animalPens.find(ap => ap.config.id === 'pen_chicken');
      if (pen) pen.setUnlocked(true);
    } else if (zoneId === 'pen_cow') {
      const pen = this.animalPens.find(ap => ap.config.id === 'pen_cow');
      if (pen) pen.setUnlocked(true);
    } else if (zoneId === 'machine_juicer') {
      const m = this.processingMachines.find(pm => pm.config.id === 'machine_juicer');
      if (m) m.setUnlocked(true);
    } else if (zoneId === 'machine_bakery') {
      const m = this.processingMachines.find(pm => pm.config.id === 'machine_bakery');
      if (m) m.setUnlocked(true);
    } else if (zoneId === 'machine_cakery') {
      const m = this.processingMachines.find(pm => pm.config.id === 'machine_cakery');
      if (m) m.setUnlocked(true);
    } else if (zoneId === 'stand_egg') {
      const s = this.marketStands.find(ms => ms.config.id === 'stand_egg');
      if (s) s.setUnlocked(true);
    } else if (zoneId === 'stand_wheat') {
      const s = this.marketStands.find(ms => ms.config.id === 'stand_wheat');
      if (s) s.setUnlocked(true);
    } else if (zoneId === 'stand_juice') {
      const s = this.marketStands.find(ms => ms.config.id === 'stand_juice');
      if (s) s.setUnlocked(true);
    } else if (zoneId === 'stand_bread') {
      const s = this.marketStands.find(ms => ms.config.id === 'stand_bread');
      if (s) s.setUnlocked(true);
    } else if (zoneId === 'stand_milk') {
      const s = this.marketStands.find(ms => ms.config.id === 'stand_milk');
      if (s) s.setUnlocked(true);
    } else if (zoneId === 'stand_carrot') {
      const s = this.marketStands.find(ms => ms.config.id === 'stand_carrot');
      if (s) s.setUnlocked(true);
    } else if (zoneId === 'stand_cake') {
      const s = this.marketStands.find(ms => ms.config.id === 'stand_cake');
      if (s) s.setUnlocked(true);
    } else if (zoneId === 'helper_stocker') {
      this.staffStocker.setUnlocked(true);
    } else if (zoneId === 'helper_farmer') {
      this.staffFarmer.setUnlocked(true);
    } else if (zoneId === 'helper_cashier') {
      this.staffCashier.setUnlocked(true);
    } else if (zoneId === 'helper_cashier_2') {
      this.staffCashier2.setUnlocked(true);
    } else if (zoneId === 'helper_harvester') {
      this.staffHarvester.setUnlocked(true);
    } else if (zoneId === 'helper_chef') {
      this.staffChef.setUnlocked(true);
    } else if (zoneId === 'door_east') {
      if (this.eastDoorGroup) this.eastDoorGroup.visible = true;
      if (this.eastBarricadeGroup) this.eastBarricadeGroup.visible = false;
      if (this.eastExitGroup) this.eastExitGroup.visible = true;
      if (this.eastExitBarricade) this.eastExitBarricade.visible = false;
    }
  }

  onZoneUnlocked(zoneId) {
    this.applyUnlock(zoneId);
    this.spawnConfetti(this.player.position);

    const names = {
      plot_wheat: '🌾 Wheat Field Unlocked!',
      stand_wheat: '🌾 Golden Grain Stand Unlocked!',
      helper_farmer: '🧑‍🌾 Farm Hand Hired! (Wheat, Eggs & Milk)',
      pen_chicken: '🐔 Chicken Coop Unlocked!',
      pen_cow: '🐄 Dairy Pasture Unlocked!',
      machine_juicer: '🥫 Jam / Sauce Machine Unlocked!',
      machine_bakery: '🍞 Artisan Oven Counter Unlocked!',
      machine_cakery: '🎂 Pastry Cake Mixer Machine Unlocked!',
      stand_egg: '🥚 Egg Display Shelf Unlocked!',
      stand_juice: '🥫 Canned Goods Stand Unlocked!',
      stand_bread: '🍞 Warm Bakery Showcase Unlocked!',
      stand_milk: '🥛 Glass Door Milk Refrigerator Unlocked!',
      door_east: '🚪 East Grand Entrance Unlocked! (Area Expansion)',
      helper_cashier_2: '👩‍💼 Express Cashier (Register #2) Hired!',
      stand_carrot: '🌽 Golden Corn Stand Unlocked!',
      stand_cake: '🎂 Royal Cake Pedestal Stand Unlocked!',
      helper_stocker: '🧑‍🌾 Shelf Stocker Helper Hired!',
      helper_cashier: '👩‍💼 Checkout Cashier Hired!',
      helper_harvester: '🚜 Field Harvester Helper Hired!',
      helper_chef: '🧑‍🍳 Master Patissier Hired! (+20% Cake Value 🎂)'
    };

    if (names[zoneId]) this.ui.showNotification(names[zoneId]);

    this.refreshUnlockZoneVisibility();
    sdk.showMidgameAd();
  }

  refreshUnlockZoneVisibility() {
    this.unlockZones.forEach(zone => {
      if (zone.unlocked) {
        zone.setVisible(false);
        return;
      }

      const req = zone.config.requires;
      if (!req) {
        zone.setVisible(true);
      } else {
        const reqZone = this.unlockZones.find(z => z.config.id === req);
        const reqUnlocked = reqZone ? reqZone.unlocked : true;
        zone.setVisible(reqUnlocked);
      }
    });
  }

  instantHarvestAll() {
    this.cropPatches.forEach(p => { if (p.unlocked) p.instantHarvestAll(); });
    this.marketStands.forEach(s => {
      if (s.unlocked) {
        while (!s.isFull()) s.addItem();
      }
    });
  }

  handleInteractions(dt) {
    const playerPos = this.player.position;

    // 1. Crop Harvesting
    this.cropPatches.forEach(patch => {
      if (!patch.unlocked) return;
      const dist = playerPos.distanceTo(patch.group.position);
      if (dist < 2.5 && !this.player.isFull() && patch.hasReadyCrops()) {
        const crop = patch.harvestOne();
        if (crop) this.player.addItem(crop);
      }
    });

    // 2. Animal Feeding & Collecting
    this.animalPens.forEach(pen => {
      if (!pen.unlocked) return;

      if (playerPos.distanceTo(pen.feederPos) < 2.0 && this.player.hasItem('WHEAT') && pen.feedStock < pen.feedCapacity) {
        const wheat = this.player.popItem('WHEAT');
        if (wheat) pen.addFeed(1);
      }

      if (playerPos.distanceTo(pen.pickupPos) < 2.0 && !this.player.isFull() && pen.produceStock > 0) {
        const prod = pen.harvestProduce();
        if (prod) this.player.addItem(prod);
      }
    });

    // 3. Processing Machines (Ketchup/Sauce Press, Bread Bakery, Cake Mixer)
    this.processingMachines.forEach(machine => {
      if (!machine.unlocked) return;

      const dist = playerPos.distanceTo(machine.group.position);
      if (dist < 2.5) {
        // A. Collect Ready Processed Output
        if (!this.player.isFull() && machine.outputStock > 0) {
          const out = machine.harvestOutput();
          if (out) this.player.addItem(out);
        }

        // B. Deposit Input Ingredients
        if (!machine.isInputFull()) {
          if (machine.config.type === 'JUICER') {
            if (this.player.hasItem('TOMATO') && machine.canAcceptIngredient('TOMATO')) {
              const tomato = this.player.popItem('TOMATO');
              if (tomato) machine.addIngredient(tomato);
            }
          } else if (machine.config.type === 'BAKERY') {
            if (this.player.hasItem('WHEAT') && machine.canAcceptIngredient('WHEAT')) {
              const wheat = this.player.popItem('WHEAT');
              if (wheat) machine.addIngredient(wheat);
            } else if (this.player.hasItem('EGG') && machine.canAcceptIngredient('EGG')) {
              const egg = this.player.popItem('EGG');
              if (egg) machine.addIngredient(egg);
            }
          } else if (machine.config.type === 'CAKERY') {
            if (this.player.hasItem('MILK') && machine.canAcceptIngredient('MILK')) {
              const milk = this.player.popItem('MILK');
              if (milk) machine.addIngredient(milk);
            } else if (this.player.hasItem('EGG') && machine.canAcceptIngredient('EGG')) {
              const egg = this.player.popItem('EGG');
              if (egg) machine.addIngredient(egg);
            } else if (this.player.hasItem('BREAD') && machine.canAcceptIngredient('BREAD')) {
              const bread = this.player.popItem('BREAD');
              if (bread) machine.addIngredient(bread);
            }
          }
        }
      }
    });

    // 4. Market Stands Restocking
    this.marketStands.forEach(stand => {
      if (!stand.unlocked) return;
      const distCenter = playerPos.distanceTo(stand.pos);
      const distFront = Math.hypot(playerPos.x - stand.pos.x, playerPos.z - (stand.pos.z + 0.8));
      if ((distCenter < 2.8 || distFront < 2.2) && !stand.isFull() && this.player.hasItem(stand.config.itemId)) {
        const item = this.player.popItem(stand.config.itemId);
        if (item) stand.addItem();
      }
    });

    // 5. Cashier Counters: Small radius cash vacuum when walking near or standing at counter (2.4m radius)
    this.cashRegisters.forEach(reg => {
      const distToDesk = Math.min(
        playerPos.distanceTo(reg.pos),
        playerPos.distanceTo(reg.cashCollectPos),
        playerPos.distanceTo(reg.cashierZonePos),
        playerPos.distanceTo(reg.customerCheckoutPos)
      );

      if (distToDesk < 2.4 && reg.uncollectedCash > 0) {
        const earned = reg.collectAllCash();
        if (earned > 0) {
          this.money += earned;
          sounds.playCash();
          this.ui.spawnFloatingText(`+$${earned} 💵`, window.innerWidth / 2, window.innerHeight / 2 - 50, true);
        }
      }
    });

    // 6. Dustbins
    this.dustbins.forEach(bin => {
      bin.update(dt, this.player, (trashedItem, binPos) => {
        this.spawnTrashPuff(binPos);
        this.ui.spawnFloatingText(`-1 🗑️`, window.innerWidth / 2, window.innerHeight / 2 - 30, false);
      });
    });

    // 7. Dollar Expansion Zones
    this.unlockZones.forEach(zone => {
      if (!zone.visible || zone.unlocked) return;
      const dist = playerPos.distanceTo(zone.pos);
      if (dist < (zone.config.radius || 1.6) && this.money > 0) {
        const spendAmount = Math.ceil(90 * dt);
        const actualSpent = zone.spendMoney(Math.min(this.money, spendAmount));
        this.money -= actualSpent;
      }
    });
  }

  saveGame() {
    const data = {
      money: this.money,
      upgrades: {},
      unlocks: this.unlockZones.map(z => ({ id: z.config.id, unlocked: z.unlocked, remainingCost: z.remainingCost }))
    };

    Object.keys(CONFIG.UPGRADES).forEach(k => {
      data.upgrades[k] = CONFIG.UPGRADES[k].currentLevel;
    });

    sdk.saveGameState(data);
  }

  loadGame() {
    const data = sdk.loadGameState();
    if (!data) return;

    if (typeof data.money === 'number') this.money = data.money;

    if (data.upgrades) {
      Object.keys(data.upgrades).forEach(k => {
        if (CONFIG.UPGRADES[k]) {
          CONFIG.UPGRADES[k].currentLevel = data.upgrades[k] || 0;
        }
      });
      this.refreshAllUpgrades();
    }

    if (data.unlocks) {
      data.unlocks.forEach(savedU => {
        const zone = this.unlockZones.find(z => z.config.id === savedU.id);
        if (zone) {
          zone.remainingCost = savedU.remainingCost;
          if (savedU.unlocked) {
            zone.unlocked = true;
            this.applyUnlock(zone.config.id);
          }
        }
      });
    }

    this.refreshUnlockZoneVisibility();
  }

  loop(currentTime) {
    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    const growthLvl = CONFIG.UPGRADES.growth.currentLevel;
    this.growthMultiplier = CONFIG.UPGRADES.growth.levels[growthLvl];

    const inputVec = this.ui.getInputVector();
    this.player.update(dt, inputVec);

    const isPlayerAtReg1 = this.player.position.distanceTo(this.cashRegisters[0].pos) < 2.2 ||
                           this.player.position.distanceTo(this.cashRegisters[0].cashierZonePos) < 2.2;
    const isPlayerAtReg2 = this.cashRegisters.length > 1 && (
                           this.player.position.distanceTo(this.cashRegisters[1].pos) < 2.2 ||
                           this.player.position.distanceTo(this.cashRegisters[1].cashierZonePos) < 2.2);

    const isCashier1Present = isPlayerAtReg1 || (this.staffCashier && this.staffCashier.unlocked);
    const isCashier2Present = isPlayerAtReg2 || (this.staffCashier2 && this.staffCashier2.unlocked);
    this.isCashierPresent = isCashier1Present || isCashier2Present;

    this.resolveObstacleCollisions(this.player.position, 0.42);

    this.cropPatches.forEach(p => p.update(dt, this.growthMultiplier));
    this.animalPens.forEach(p => p.update(dt, this.growthMultiplier));
    this.processingMachines.forEach(m => m.update(dt, this.growthMultiplier));

    this.marketStands.forEach(s => s.update(dt));
    this.unlockZones.forEach(z => z.update(dt));

    const staffList = [this.staffStocker, this.staffFarmer, this.staffHarvester, this.staffChef];
    this.staffStocker.update(dt, this.cropPatches, this.animalPens, this.processingMachines, this.marketStands, this.dustbins);
    this.staffFarmer.update(dt, this.cropPatches, this.animalPens, this.processingMachines, this.marketStands, this.dustbins);
    this.staffHarvester.update(dt, this.cropPatches, this.animalPens, this.processingMachines, this.marketStands, this.dustbins);
    this.staffChef.update(dt, this.cropPatches, this.animalPens, this.processingMachines, this.marketStands, this.dustbins);
    
    staffList.forEach(s => {
      if (s.unlocked) {
        this.resolveObstacleCollisions(s.position, 0.35, false); // Shelf bypass enabled for staff!

        if (this.staffCashier && this.staffCashier.unlocked) {
          const dCashier = s.position.distanceTo(this.staffCashier.pos);
          if (dCashier < 0.8 && dCashier > 0.001) {
            const nx = (s.position.x - this.staffCashier.pos.x) / dCashier;
            const nz = (s.position.z - this.staffCashier.pos.z) / dCashier;
            s.position.x += nx * (0.8 - dCashier);
            s.position.z += nz * (0.8 - dCashier);
          }
        }
        if (this.staffCashier2 && this.staffCashier2.unlocked) {
          const dCashier2 = s.position.distanceTo(this.staffCashier2.pos);
          if (dCashier2 < 0.8 && dCashier2 > 0.001) {
            const nx = (s.position.x - this.staffCashier2.pos.x) / dCashier2;
            const nz = (s.position.z - this.staffCashier2.pos.z) / dCashier2;
            s.position.x += nx * (0.8 - dCashier2);
            s.position.z += nz * (0.8 - dCashier2);
          }
        }
      }
    });

    this.customerManager.update(dt, this.marketStands, this.cashRegisters, isCashier1Present, isCashier2Present, (cust, total) => {
      const isPlayerAtCustReg = (cust.assignedRegister === this.cashRegisters[0] && isPlayerAtReg1) ||
                                (this.cashRegisters.length > 1 && cust.assignedRegister === this.cashRegisters[1] && isPlayerAtReg2);
      if (isPlayerAtCustReg) {
        // If player is present at that register counter, instantly credit cash to balance!
        const earned = cust.assignedRegister.collectAllCash();
        if (earned > 0) {
          this.money += earned;
          sounds.playCash();
          this.ui.spawnFloatingText(`+$${earned} 💵`, window.innerWidth / 2, window.innerHeight / 2 - 50, true);
        }
      }
      if (cust.isVip) {
        sounds.playUnlock();
        this.ui.showNotification(`⭐ VIP GOLD SALE! Stashed $${total}!`);
      }
    }, this.player, staffList);

    this.customerManager.customers.forEach(c => {
      if (c.state !== 'ENTER' && c.state !== 'LEAVE') {
        this.resolveObstacleCollisions(c.position, 0.35);
      }
    });

    this.handleInteractions(dt);

    if (this.animatedTrees) {
      const time = performance.now() * 0.0015;
      this.animatedTrees.forEach(t => {
        t.foliage.rotation.z = Math.sin(time + t.offset) * 0.04;
        t.foliage.rotation.x = Math.cos(time * 0.8 + t.offset) * 0.03;
      });
    }

    if (this.animatedButterflies) {
      const bTime = performance.now() * 0.003;
      this.animatedButterflies.forEach(b => {
        const flap = Math.sin(bTime * 8 + b.seed) * 0.8;
        b.wingL.rotation.y = flap;
        b.wingR.rotation.y = -flap;
        b.group.position.x = b.basePos.x + Math.sin(bTime + b.seed) * 0.4;
        b.group.position.y = b.basePos.y + Math.sin(bTime * 1.5 + b.seed) * 0.15;
        b.group.position.z = b.basePos.z + Math.cos(bTime + b.seed) * 0.35;
      });
    }

    this.updateParticles(dt);
    sdk.update(dt);
    this.ui.update(dt);

    const targetCamX = this.player.position.x + this.cameraOffset.x;
    const targetCamY = this.cameraOffset.y;
    const targetCamZ = this.player.position.z + this.cameraOffset.z;

    this.camera.position.x += (targetCamX - this.camera.position.x) * 6 * dt;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 6 * dt;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 6 * dt;
    this.camera.lookAt(this.player.position.x, 0.8, this.player.position.z);

    this.saveTimer += dt;
    if (this.saveTimer >= 10) {
      this.saveTimer = 0;
      this.saveGame();
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame((t) => this.loop(t));
  }
}

function initGame() {
  if (!window.game) {
    try {
      window.game = new GameEngine();
    } catch (e) {
      console.error('Failed to initialize GameEngine:', e);
    }
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}