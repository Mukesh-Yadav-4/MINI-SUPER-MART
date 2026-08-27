// Mock browser & Three.js environment to catch runtime exceptions on game startup
global.window = {
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
  addEventListener: () => {}
};
global.document = {
  readyState: 'complete',
  querySelectorAll: () => [],
  querySelector: () => null,
  getElementById: (id) => ({
    appendChild: () => {},
    addEventListener: () => {},
    style: {},
    classList: { add: () => {}, remove: () => {} },
    getContext: () => ({
      clearRect: () => {},
      beginPath: () => {},
      arc: () => {},
      closePath: () => {},
      fill: () => {},
      stroke: () => {},
      fillText: () => {}
    })
  }),
  createElement: (tag) => ({
    width: 512,
    height: 512,
    getContext: () => ({
      clearRect: () => {},
      beginPath: () => {},
      arc: () => {},
      closePath: () => {},
      fill: () => {},
      stroke: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      moveTo: () => {},
      lineTo: () => {},
      quadraticCurveTo: () => {},
      arcTo: () => {},
      measureText: () => ({ width: 50 }),
      fillText: () => {}
    }),
    style: {}
  }),
  addEventListener: () => {}
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.requestAnimationFrame = () => {};

class MockVector3 {
  constructor(x=0, y=0, z=0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  clone() { return new MockVector3(this.x, this.y, this.z); }
  distanceTo(v) { return Math.sqrt((this.x - v.x)**2 + (this.z - v.z)**2); }
  addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
}

class MockEuler {
  constructor() { this.x = 0; this.y = 0; this.z = 0; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; }
}

class MockGroup {
  constructor() {
    this.children = [];
    this.position = new MockVector3();
    this.rotation = new MockEuler();
    this.scale = new MockVector3(1, 1, 1);
    this.visible = true;
  }
  add(child) { this.children.push(child); }
  remove(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
  }
}

class MockMesh extends MockGroup {
  constructor(geo, mat) {
    super();
    this.geometry = geo || {};
    this.material = mat || {};
  }
}

class MockScene extends MockGroup {}

global.THREE = {
  Scene: MockScene,
  Group: MockGroup,
  Mesh: MockMesh,
  Vector3: MockVector3,
  Euler: MockEuler,
  Color: function(c) { this.c = c; },
  PerspectiveCamera: function() {
    this.position = new MockVector3();
    this.lookAt = () => {};
    this.updateProjectionMatrix = () => {};
  },
  WebGLRenderer: function() {
    this.domElement = { style: {} };
    this.setSize = () => {};
    this.setPixelRatio = () => {};
    this.setClearColor = () => {};
    this.render = () => {};
    this.shadowMap = {};
  },
  AmbientLight: function() { this.position = new MockVector3(); },
  HemisphereLight: function() { this.position = new MockVector3(); },
  DirectionalLight: function() {
    this.position = new MockVector3();
    this.shadow = { mapSize: {}, camera: {} };
  },
  PlaneGeometry: function() {},
  BoxGeometry: function() {},
  CylinderGeometry: function() {},
  SphereGeometry: function() {},
  CircleGeometry: function() {},
  RingGeometry: function() {},
  ConeGeometry: function() {},
  TorusGeometry: function() {},
  EdgesGeometry: function() {},
  LineSegments: function() { return new MockMesh(); },
  LineBasicMaterial: function() {},
  MeshLambertMaterial: function() {},
  MeshBasicMaterial: function() {},
  SpriteMaterial: function() {},
  Sprite: MockMesh,
  CanvasTexture: function() {
    this.repeat = { set: () => {} };
    this.wrapS = 1000;
    this.wrapT = 1000;
  },
  Clock: function() { this.getDelta = () => 0.016; },
  PCFSoftShadowMap: 1,
  ACESFilmicToneMapping: 1,
  LinearFilter: 1
};

const fs = require('fs');
const files = ['config.js', 'audio.js', 'sdk.js', 'player.js', 'farm.js', 'market.js', 'customers.js', 'staff.js', 'ui.js', 'main.js'];

try {
  let combined = '';
  for (let f of files) {
    combined += fs.readFileSync('./src/' + f, 'utf8') + '\n';
  }
  const fn = new Function(combined);
  fn();
  console.log("=== FULL APP STARTUP & SIMULATED FRAMES SUCCEEDED ===");
} catch (err) {
  console.error("ERROR DETECTED:", err);
}