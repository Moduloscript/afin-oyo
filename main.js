/* ==========================================================================
   ÀFIN Ọ̀YỌ́ — THREE.JS ENGINE & MASTER SCENE CHOREOGRAPHY
   Word-Mask Reveals, Continuous Spline Conductor & Dual-Layer Depth Pipeline
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------ 0 · Math Utilities */
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const sat = v => clamp(v, 0, 1);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (e0, e1, x) => {
    const t = sat((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  };
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const damp = (cur, to, rate, dt) => lerp(cur, to, 1 - Math.exp(-rate * dt));
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COARSE = matchMedia('(hover: none)').matches;

  const vpW = () => window.innerWidth;
  const vpH = () => window.innerHeight;

  /* ------------------------------------------------------------ 1 · Three.js Setup */
  const canvas = document.getElementById('gl');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });

  renderer.setSize(vpW(), vpH());
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x05070a, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070a, 0.022);

  const camera = new THREE.PerspectiveCamera(42, vpW() / vpH(), 0.1, 160);

  /* ------------------------------------------------------------ 2 · Procedural Textures & Materials */
  function createNoiseTexture(w, h, rBase, gBase, bBase) {
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d');
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = Math.floor(Math.random() * 28);
      img.data[i] = rBase + n;
      img.data[i + 1] = gBase + n;
      img.data[i + 2] = bBase + n;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(cvs);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  const clayBumpTex = createNoiseTexture(256, 256, 42, 22, 18);
  clayBumpTex.repeat.set(12, 12);

  const irokoBumpTex = createNoiseTexture(256, 256, 32, 26, 22);
  irokoBumpTex.repeat.set(8, 8);

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x100806,
    roughness: 0.28,
    metalness: 0.14,
    bumpMap: clayBumpTex,
    bumpScale: 0.03
  });

  const foregroundHillMat = new THREE.MeshStandardMaterial({
    color: 0x090e0c,
    roughness: 0.7,
    metalness: 0.06
  });

  const irokoMat = new THREE.MeshStandardMaterial({
    color: 0x140d0a,
    roughness: 0.5,
    metalness: 0.15,
    bumpMap: irokoBumpTex,
    bumpScale: 0.05
  });

  const royalRedMat = new THREE.MeshStandardMaterial({
    color: 0x8a2016,
    roughness: 0.42,
    metalness: 0.2
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4a359,
    roughness: 0.25,
    metalness: 0.88
  });

  const thatchRoofMat = new THREE.MeshStandardMaterial({
    color: 0x160f0c,
    roughness: 0.68,
    metalness: 0.08
  });

  const glowingWindowMat = new THREE.MeshBasicMaterial({
    color: 0xffe2a0,
    transparent: true,
    opacity: 0.92
  });

  /* ------------------------------------------------------------ 3 · Scene Construction */
  const floorGeo = new THREE.PlaneGeometry(200, 200);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = -1.2;
  scene.add(floorMesh);

  // Rolling Fore-Mounds
  const hillGeo = new THREE.PlaneGeometry(42, 8, 36, 12);
  const hillPos = hillGeo.attributes.position;
  for (let i = 0; i < hillPos.count; i++) {
    const x = hillPos.getX(i);
    const zWave = Math.sin(x * 0.22) * 1.2 + Math.cos(x * 0.45) * 0.45;
    hillPos.setZ(i, zWave);
  }
  hillGeo.computeVertexNormals();
  const hillMesh = new THREE.Mesh(hillGeo, foregroundHillMat);
  hillMesh.rotation.x = -Math.PI / 2.3;
  hillMesh.position.set(0, -1.3, 8.2);
  scene.add(hillMesh);

  // 3D Monumental Wordmark ("Ọ̀ Y Ọ́" — Palace Beam Inscription)
  const wordmarkGroup = new THREE.Group();
  function create3DLetter(char, xPos, idx) {
    const cvs = document.createElement('canvas');
    cvs.width = 1024;
    cvs.height = 1024;
    const ctx = cvs.getContext('2d');
    ctx.fillStyle = '#f4eae0';
    ctx.font = '900 680px "Onest", "Cinzel", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, 512, 530);

    const tex = new THREE.CanvasTexture(cvs);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    const planeGeo = new THREE.PlaneGeometry(3.4, 3.4);
    const planeMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const letterMesh = new THREE.Mesh(planeGeo, planeMat);
    letterMesh.position.set(xPos * 0.8, 14.2, palaceZ + 0.4);
    letterMesh.userData = { baseY: 14.2, index: idx };
    return letterMesh;
  }

  // 3 Symmetric Letters: Ọ̀ (-3.6), Y (0.0 DEAD CENTER), Ọ́ (+3.6)
  wordmarkGroup.add(create3DLetter('Ọ̀', -3.6, 0));
  wordmarkGroup.add(create3DLetter('Y', 0.0, 1));
  wordmarkGroup.add(create3DLetter('Ọ́', 3.6, 2));
  scene.add(wordmarkGroup);

  // Sanctuary Architecture (Àfin Ọ̀yọ́)
  const afinGroup = new THREE.Group();
  const palaceZ = -8.5;

  const stairCount = 14;
  for (let i = 0; i < stairCount; i++) {
    const w = 12.0 - i * 0.42;
    const step = new THREE.Mesh(new THREE.BoxGeometry(w, 0.26, 1.3), floorMat);
    step.position.set(0, -1.0 + i * 0.26, 3.0 - i * 1.0);
    afinGroup.add(step);
  }

  function createGrandOpo(x, y, z) {
    const g = new THREE.Group();
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.8, 0.7, 16), irokoMat);
    p.position.y = 0.35;
    g.add(p);

    const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.2, 0.8), royalRedMat);
    t1.position.y = 2.2;
    g.add(t1);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.08, 8, 24), brassMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 3.9;
    g.add(ring);

    const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.62, 3.4, 12), irokoMat);
    t2.position.y = 5.7;
    g.add(t2);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.2), irokoMat);
    cap.position.y = 7.6;
    g.add(cap);

    g.position.set(x, y, z);
    return g;
  }

  afinGroup.add(createGrandOpo(-4.2, 1.6, palaceZ));
  afinGroup.add(createGrandOpo(4.2, 1.6, palaceZ));
  afinGroup.add(createGrandOpo(-1.8, 1.6, palaceZ));
  afinGroup.add(createGrandOpo(1.8, 1.6, palaceZ));

  const lowerBeam = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.7, 1.1), royalRedMat);
  lowerBeam.position.set(0, 9.4, palaceZ);
  afinGroup.add(lowerBeam);

  const upperBeam = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.85, 1.3), irokoMat);
  upperBeam.position.set(0, 10.6, palaceZ);
  afinGroup.add(upperBeam);

  for (let col = -3; col <= 3; col++) {
    if (col === 0) continue;
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.6), glowingWindowMat);
    win.position.set(col * 1.35, 5.4, palaceZ + 0.1);
    afinGroup.add(win);
  }

  const midRoofGeo = new THREE.ConeGeometry(11.2, 3.5, 4);
  const midRoof = new THREE.Mesh(midRoofGeo, thatchRoofMat);
  midRoof.position.set(0, 12.4, palaceZ);
  midRoof.rotation.y = Math.PI / 4;
  midRoof.scale.set(1.4, 0.8, 1.0);
  afinGroup.add(midRoof);

  const upperSanctuary = new THREE.Mesh(new THREE.BoxGeometry(7.0, 3.6, 5.0), irokoMat);
  upperSanctuary.position.set(0, 14.6, palaceZ);
  afinGroup.add(upperSanctuary);

  const topRoof = new THREE.Mesh(new THREE.ConeGeometry(8.2, 3.2, 4), thatchRoofMat);
  topRoof.position.set(0, 17.6, palaceZ);
  topRoof.rotation.y = Math.PI / 4;
  afinGroup.add(topRoof);

  // Royal Apex Finial (Ẹyẹ Àfin · Crown of the Sanctuary)
  const finialGroup = new THREE.Group();
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 2.6, 8), brassMat);
  mast.position.y = 1.3;
  finialGroup.add(mast);

  const finialCrown = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.09, 8, 16), brassMat);
  finialCrown.rotation.x = Math.PI / 2;
  finialCrown.position.y = 2.0;
  finialGroup.add(finialCrown);

  const crestBird = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.8, 4), brassMat);
  crestBird.position.y = 2.8;
  finialGroup.add(crestBird);

  finialGroup.position.set(0, 19.2, palaceZ);
  afinGroup.add(finialGroup);

  // Peristyle Veranda Wings & Extended Lateral Columns
  afinGroup.add(createGrandOpo(-6.8, 1.4, palaceZ + 1.8));
  afinGroup.add(createGrandOpo(6.8, 1.4, palaceZ + 1.8));
  afinGroup.add(createGrandOpo(-9.2, 1.2, palaceZ + 3.6));
  afinGroup.add(createGrandOpo(9.2, 1.2, palaceZ + 3.6));

  const leftWingRoof = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.4, 5.2), thatchRoofMat);
  leftWingRoof.position.set(-8.0, 8.2, palaceZ + 2.7);
  leftWingRoof.rotation.z = 0.12;
  afinGroup.add(leftWingRoof);

  const rightWingRoof = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.4, 5.2), thatchRoofMat);
  rightWingRoof.position.set(8.0, 8.2, palaceZ + 2.7);
  rightWingRoof.rotation.z = -0.12;
  afinGroup.add(rightWingRoof);

  // Dual Stairway Fire Braziers (Iná Àtùpà)
  function createBrazier(x, y, z) {
    const g = new THREE.Group();
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.4, 8), irokoMat);
    plinth.position.y = 0.2;
    g.add(plinth);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 1.2, 12), brassMat);
    stem.position.y = 0.9;
    g.add(stem);

    const brassCollar = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.08, 8, 16), brassMat);
    brassCollar.rotation.x = Math.PI / 2;
    brassCollar.position.y = 1.3;
    g.add(brassCollar);

    const bowl = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.6, 12, 1, true), royalRedMat);
    bowl.rotation.x = Math.PI;
    bowl.position.y = 1.7;
    g.add(bowl);

    const flameGeo = new THREE.ConeGeometry(0.42, 1.1, 8);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffaa22,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.y = 2.2;
    g.add(flameMesh);

    g.position.set(x, y, z);
    return { group: g, flame: flameMesh };
  }

  const leftBrazier = createBrazier(-5.4, -0.4, 2.0);
  const rightBrazier = createBrazier(5.4, -0.4, 2.0);
  afinGroup.add(leftBrazier.group);
  afinGroup.add(rightBrazier.group);

  scene.add(afinGroup);

  // Sacred Celestial Sun/Moon System (Radiant Multi-Ring Corona & Eclipse Flare)
  const sunGroup = new THREE.Group();
  sunGroup.position.set(15.0, 24.0, -42.0);

  function createCoronaTexture() {
    const cvs = document.createElement('canvas');
    cvs.width = 512;
    cvs.height = 512;
    const ctx = cvs.getContext('2d');
    const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 256);
    grad.addColorStop(0.0, 'rgba(255, 90, 30, 0.95)');
    grad.addColorStop(0.28, 'rgba(224, 35, 28, 0.72)');
    grad.addColorStop(0.55, 'rgba(212, 163, 89, 0.35)');
    grad.addColorStop(0.78, 'rgba(160, 30, 20, 0.12)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(cvs);
  }

  const coronaMat = new THREE.MeshBasicMaterial({
    map: createCoronaTexture(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const coronaMesh = new THREE.Mesh(new THREE.PlaneGeometry(38, 38), coronaMat);
  coronaMesh.position.z = -0.4;
  sunGroup.add(coronaMesh);

  function createSunCoreTexture() {
    const cvs = document.createElement('canvas');
    cvs.width = 512;
    cvs.height = 512;
    const ctx = cvs.getContext('2d');
    const grad = ctx.createRadialGradient(230, 220, 20, 256, 256, 256);
    grad.addColorStop(0.0, '#ff4820');
    grad.addColorStop(0.4, '#e0231c');
    grad.addColorStop(0.85, '#9e140d');
    grad.addColorStop(1.0, '#640c08');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(256, 256, 250, 0, Math.PI * 2);
    ctx.fill();
    return new THREE.CanvasTexture(cvs);
  }

  const moonGeo = new THREE.CircleGeometry(11.5, 64);
  const moonMat = new THREE.MeshBasicMaterial({
    map: createSunCoreTexture(),
    transparent: true,
    opacity: 0.98
  });
  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  sunGroup.add(moonMesh);

  const rimGeo = new THREE.RingGeometry(11.3, 11.8, 64);
  const rimMat = new THREE.MeshBasicMaterial({
    color: 0xffa044,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const sunRim = new THREE.Mesh(rimGeo, rimMat);
  sunRim.position.z = 0.05;
  sunGroup.add(sunRim);

  scene.add(sunGroup);

  // Lighting
  scene.add(new THREE.AmbientLight(0x101a24, 0.65));

  const moonLight = new THREE.DirectionalLight(0xd4a359, 1.1);
  moonLight.position.set(22, 30, -18);
  scene.add(moonLight);

  const warmShrineLight = new THREE.PointLight(0xff7722, 4.2, 28, 1.8);
  warmShrineLight.position.set(0, 5.6, palaceZ + 2.0);
  scene.add(warmShrineLight);

  const foregroundFlame = new THREE.PointLight(0xff5511, 2.8, 14, 2.0);
  foregroundFlame.position.set(3.4, 2.2, 6.0);
  scene.add(foregroundFlame);

  const leftBrazierLight = new THREE.PointLight(0xff6611, 3.2, 16, 1.8);
  leftBrazierLight.position.set(-5.4, 1.8, 2.0);
  scene.add(leftBrazierLight);

  const rightBrazierLight = new THREE.PointLight(0xff6611, 3.2, 16, 1.8);
  rightBrazierLight.position.set(5.4, 1.8, 2.0);
  scene.add(rightBrazierLight);

  // Volumetric Layered Ground Mist (3 undulating fog sheets)
  const mistGroup = new THREE.Group();
  function createMistTexture() {
    const cvs = document.createElement('canvas');
    cvs.width = 512;
    cvs.height = 512;
    const ctx = cvs.getContext('2d');
    const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 250);
    grad.addColorStop(0.0, 'rgba(212, 163, 89, 0.16)');
    grad.addColorStop(0.45, 'rgba(140, 28, 20, 0.09)');
    grad.addColorStop(0.8, 'rgba(16, 24, 32, 0.04)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(cvs);
  }

  const mistMat = new THREE.MeshBasicMaterial({
    map: createMistTexture(),
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  for (let m = 0; m < 3; m++) {
    const mistPlane = new THREE.Mesh(new THREE.PlaneGeometry(48, 48, 16, 16), mistMat);
    mistPlane.rotation.x = -Math.PI / 2;
    mistPlane.position.set(0, -0.85 + m * 0.28, -2.0 - m * 4.0);
    mistGroup.add(mistPlane);
  }
  scene.add(mistGroup);

  // Particle Ecosystem 1: Rising Fire Embers (140 golden/crimson embers)
  const emberCount = 140;
  const emberGeo = new THREE.BufferGeometry();
  const emberPositions = new Float32Array(emberCount * 3);
  const emberVelocities = [];
  for (let k = 0; k < emberCount; k++) {
    const isLeft = Math.random() < 0.5;
    const baseX = isLeft ? -5.4 + (Math.random() - 0.5) * 2.2 : 5.4 + (Math.random() - 0.5) * 2.2;
    emberPositions[k * 3] = baseX;
    emberPositions[k * 3 + 1] = Math.random() * 8.0;
    emberPositions[k * 3 + 2] = 2.0 + (Math.random() - 0.5) * 4.0;
    emberVelocities.push({
      x: (Math.random() - 0.5) * 0.012,
      y: 0.015 + Math.random() * 0.035,
      z: (Math.random() - 0.5) * 0.012,
      wobbleSpeed: 2.0 + Math.random() * 4.0
    });
  }
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
  const emberMat = new THREE.PointsMaterial({
    color: 0xffaa22,
    size: 0.18,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });
  const emberPoints = new THREE.Points(emberGeo, emberMat);
  scene.add(emberPoints);

  // Particle Ecosystem 2: Golden Nocturnal Fireflies (100 particles hovering organically)
  const fireflyCount = 100;
  const fireflyGeo = new THREE.BufferGeometry();
  const fireflyPositions = new Float32Array(fireflyCount * 3);
  const fireflyVelocities = [];
  for (let k = 0; k < fireflyCount; k++) {
    fireflyPositions[k * 3] = (Math.random() - 0.5) * 28;
    fireflyPositions[k * 3 + 1] = 0.5 + Math.random() * 12;
    fireflyPositions[k * 3 + 2] = -12 + (Math.random() - 0.5) * 26;
    fireflyVelocities.push({
      x: (Math.random() - 0.5) * 0.008,
      y: (Math.random() - 0.5) * 0.006,
      z: (Math.random() - 0.5) * 0.008,
      seed: Math.random() * 100
    });
  }
  fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));
  const fireflyMat = new THREE.PointsMaterial({
    color: 0xd4a359,
    size: 0.14,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });
  const fireflyPoints = new THREE.Points(fireflyGeo, fireflyMat);
  scene.add(fireflyPoints);

  // Particle Ecosystem 3: Drifting Crimson Leaves / Petals (140 particles)
  const leafCount = 140;
  const leafGeo = new THREE.BufferGeometry();
  const leafPositions = new Float32Array(leafCount * 3);
  const leafVelocities = [];

  for (let k = 0; k < leafCount; k++) {
    leafPositions[k * 3] = (Math.random() - 0.5) * 36;
    leafPositions[k * 3 + 1] = Math.random() * 18;
    leafPositions[k * 3 + 2] = (Math.random() - 0.5) * 36;

    leafVelocities.push({
      x: (Math.random() - 0.5) * 0.015,
      y: -0.012 - Math.random() * 0.02,
      z: (Math.random() - 0.5) * 0.015
    });
  }

  leafGeo.setAttribute('position', new THREE.BufferAttribute(leafPositions, 3));
  const leafMat = new THREE.PointsMaterial({
    color: 0xe0231c,
    size: 0.16,
    transparent: true,
    opacity: 0.85
  });
  const leafPoints = new THREE.Points(leafGeo, leafMat);
  scene.add(leafPoints);

  /* ------------------------------------------------------------ 4 · Camera Spline & Rig (6 Chapters) */
  const CAM_WAYPOINTS = [
    { p: [0.0, 3.8, 14.2],  t: [0.0, 5.8, -16.0],  fov: 38 }, // 0 Hero
    { p: [-5.2, 2.4, 11.2], t: [1.2, 5.4, -14.0],  fov: 46 }, // 1 Manifesto (Works)
    { p: [4.4, 2.8, 8.4],   t: [-1.2, 5.8, -16.0], fov: 44 }, // 2 Gallery
    { p: [1.6, 3.4, 2.4],   t: [-0.6, 7.2, -20.0], fov: 42 }, // 3 Lab
    { p: [-4.2, 2.2, -3.2], t: [1.8, 6.8, -18.0],  fov: 44 }, // 4 Craft
    { p: [0.0, 7.2, -15.0], t: [0.0, 12.5, -38.0], fov: 40 }, // 5 Dispatch
    { p: [0.0, 9.8, -19.0], t: [0.0, 3.0, -32.0],  fov: 44 }  // 6 Foot
  ];

  const curveP = new THREE.CatmullRomCurve3(
    CAM_WAYPOINTS.map(c => new THREE.Vector3(c.p[0], c.p[1], c.p[2])),
    false,
    'catmullrom',
    0.42
  );

  const curveT = new THREE.CatmullRomCurve3(
    CAM_WAYPOINTS.map(c => new THREE.Vector3(c.t[0], c.t[1], c.t[2])),
    false,
    'catmullrom',
    0.42
  );

  const RIG = {
    prog: 0,
    smooth: 0,
    mx: 0,
    my: 0,
    tmx: 0,
    tmy: 0,
    intro: 0
  };

  const _p = new THREE.Vector3();
  const _t = new THREE.Vector3();

  function applyCamera() {
    const N = CAM_WAYPOINTS.length - 1;
    const u = sat(RIG.smooth / N);
    curveP.getPoint(u, _p);
    curveT.getPoint(u, _t);

    const i = clamp(Math.floor(RIG.smooth), 0, N - 1);
    const f = clamp(RIG.smooth - i, 0, 1);
    let fov = lerp(CAM_WAYPOINTS[i].fov, CAM_WAYPOINTS[i + 1].fov, f);

    // Initial dolly-in on boot
    const io = 1 - RIG.intro;
    _p.z += io * 5.2;
    _p.y += io * 0.6;
    fov += io * 6;

    // Depth-attenuated 3D mouse parallax
    const par = 1 - smooth(0, 1.6, RIG.smooth) * 0.55;
    _p.x += RIG.mx * 0.62 * par;
    _p.y += RIG.my * 0.34 * par;
    _t.x -= RIG.mx * 0.20 * par;
    _t.y -= RIG.my * 0.12 * par;

    camera.position.copy(_p);
    camera.lookAt(_t);
    if (Math.abs(camera.fov - fov) > 0.001) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }

  /* ------------------------------------------------------------ 5 · Chapter Anchor Measurement */
  const SECS = Array.from(document.querySelectorAll('[data-cam]'));
  let anchors = [];
  let maxScroll = 1;
  let activeSec = 0;
  let currentActiveFgStage = null;

  function measure() {
    maxScroll = Math.max(1, document.documentElement.scrollHeight - vpH());
    anchors = SECS.map((el, i) => {
      if (i === 0) return 0;
      if (i === SECS.length - 1) return maxScroll;
      return clamp(el.offsetTop + el.offsetHeight * 0.5 - vpH() * 0.5, 0, maxScroll);
    });
    for (let i = 1; i < anchors.length; i++) {
      anchors[i] = Math.max(anchors[i], anchors[i - 1] + 1);
    }
  }

  function progressFor(y) {
    if (y <= anchors[0]) return 0;
    for (let i = 0; i < anchors.length - 1; i++) {
      if (y <= anchors[i + 1]) {
        return i + (y - anchors[i]) / (anchors[i + 1] - anchors[i]);
      }
    }
    return anchors.length - 1;
  }

  /* ------------------------------------------------------------ 6 · Word-Masking & Reveal System */
  function splitHeadingWords() {
    if (REDUCE) return;
    document.querySelectorAll('h1.display, h2.display').forEach(heading => {
      const lines = heading.querySelectorAll('.mask-line');
      const targets = lines.length ? Array.from(lines) : [heading];
      targets.forEach(target => {
        if (target.dataset.wordReady === 'true') return;
        const phrase = target.textContent.replace(/\s+/g, ' ').trim();
        if (!phrase) return;
        target.dataset.wordReady = 'true';
        target.classList.add('word-reveal');
        target.setAttribute('aria-label', phrase);
        target.textContent = '';
        phrase.split(' ').forEach((word, i) => {
          if (i) target.appendChild(document.createTextNode(' '));
          const mask = document.createElement('span');
          const inner = document.createElement('span');
          mask.className = 'word-mask';
          mask.setAttribute('aria-hidden', 'true');
          inner.className = 'word';
          inner.textContent = word;
          inner.style.setProperty('--word-delay', `${i * 72}ms`);
          mask.appendChild(inner);
          target.appendChild(mask);
        });
      });
    });
  }

  /* Master Section-Level Sequential Orchestration */
  function wireReveals() {
    splitHeadingWords();

    const sections = Array.from(document.querySelectorAll('.sec:not(#hero), .foot'));

    const sectionObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          sectionObserver.unobserve(entry.target);

          const sec = entry.target;
          const secHead = sec.querySelector('.sec-head, .eyebrow');
          const heading = sec.querySelector('h2.display');
          const copyItems = Array.from(sec.querySelectorAll('.gate-copy > p, .lead, .body-lg, .body, .gallery-head p, .craft-manifesto > p, .fin-lead'));
          const links = Array.from(sec.querySelectorAll('.arrowlink'));
          const statsOrPillars = sec.querySelector('.gate-stats, .craft-pillars, .craft-stats');
          const plates = Array.from(sec.querySelectorAll('.showcase-stage .plate-hero, .showcase-stage .plate-card'));
          const rows = Array.from(sec.querySelectorAll('.cur .les'));
          const boxes = Array.from(sec.querySelectorAll('.craft-stack .stack-box'));
          const tracks = Array.from(sec.querySelectorAll('.commission-tracks .track-card'));
          const ctas = Array.from(sec.querySelectorAll('.cta-wrap'));
          const meta = Array.from(sec.querySelectorAll('.dispatch-meta'));

          // 1. Section Header fades in
          if (secHead) {
            setTimeout(() => secHead.classList.add('rv-in'), REDUCE ? 0 : 50);
          }

          // 2. Display Heading words unclip & rise
          if (heading) {
            setTimeout(() => {
              heading.classList.add('rv-in');
              heading.querySelectorAll('.mask-line, .word-reveal').forEach(l => l.classList.add('rv-in'));
            }, REDUCE ? 0 : 160);
          }

          // 3. Narrative Copy items
          copyItems.forEach((p, idx) => {
            setTimeout(() => p.classList.add('rv-in'), REDUCE ? 0 : 380 + idx * 120);
          });

          // 4. Links / CTAs
          links.forEach((a, idx) => {
            setTimeout(() => a.classList.add('rv-in'), REDUCE ? 0 : 580 + idx * 100);
          });

          // 5. Stats or Pillars
          if (statsOrPillars) {
            setTimeout(() => statsOrPillars.classList.add('rv-in'), REDUCE ? 0 : 640);
          }

          // 6. Showcase Plates (Cascade: Plate 1 -> Card 2 -> Card 3)
          plates.forEach((plate, idx) => {
            setTimeout(() => plate.classList.add('rv-in'), REDUCE ? 0 : 520 + idx * 170);
          });

          // 7. Kinetic Lab Lessons
          rows.forEach((row, idx) => {
            setTimeout(() => row.classList.add('rv-in'), REDUCE ? 0 : 520 + idx * 110);
          });

          // 8. Stack Boxes & Tracks
          boxes.forEach((box, idx) => {
            setTimeout(() => box.classList.add('rv-in'), REDUCE ? 0 : 680 + idx * 140);
          });

          tracks.forEach((track, idx) => {
            setTimeout(() => track.classList.add('rv-in'), REDUCE ? 0 : 560 + idx * 130);
          });

          // 9. CTA wrap & Meta
          ctas.forEach(c => {
            setTimeout(() => c.classList.add('rv-in'), REDUCE ? 0 : 520);
          });

          meta.forEach(m => {
            setTimeout(() => m.classList.add('rv-in'), REDUCE ? 0 : 700);
          });

          // Master catch-all for any nested data-rv container
          setTimeout(() => {
            sec.querySelectorAll('[data-rv]:not(.rv-in)').forEach(el => el.classList.add('rv-in'));
          }, REDUCE ? 0 : 800);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );

    sections.forEach(sec => sectionObserver.observe(sec));
  }

  /* ------------------------------------------------------------ 7 · Hero Continuous Scroll Exit */
  function wireHeroExit() {
    const hero = document.getElementById('hero');
    if (!hero) return;

    const seq = [
      { el: hero.querySelector('.peek'), at: 0.0, span: 0.26, blur: 10 },
      { el: hero.querySelector('.hero-cue'), at: 0.1, span: 0.3, shift: true },
      ...Array.from(hero.querySelectorAll('.chip')).map((el, i) => ({
        el,
        at: 0.2 + i * 0.1,
        span: 0.3,
        shift: true
      })),
      { el: hero.querySelector('.chapters'), at: 0.6, span: 0.3 },
      { el: hero.querySelector('.hero-side'), at: 0.7, span: 0.3 }
    ].filter(o => o.el);

    let on = false;
    const apply = () => {
      const t = clamp(window.scrollY / Math.max(1, vpH() * 0.58), 0, 1);
      if (t <= 0) {
        if (!on) return;
        seq.forEach(o => {
          o.el.style.opacity = '';
          o.el.style.transform = '';
          o.el.style.filter = '';
          o.el.style.pointerEvents = '';
          o.el.style.transition = '';
        });
        on = false;
        return;
      }

      on = true;
      seq.forEach(o => {
        o.el.style.transition = 'none';
        const a = 1 - smooth(o.at, o.at + o.span, t);
        o.el.style.opacity = a.toFixed(3);
        if (o.shift) {
          o.el.style.transform = `translate3d(0, ${((1 - a) * 15).toFixed(1)}px, 0)`;
        }
        if (o.blur) {
          o.el.style.filter = a > 0.999 ? '' : `blur(${((1 - a) * o.blur).toFixed(1)}px)`;
        }
        o.el.style.pointerEvents = a < 0.05 ? 'none' : '';
      });
    };

    window.addEventListener('scroll', apply, { passive: true });
    window.addEventListener('resize', apply, { passive: true });
  }

  /* ------------------------------------------------------------ 8 · Foreground Sky Stages (#fg-sky) */
  function wireForegroundStages() {
    const pairs = Array.from(document.querySelectorAll('.sec .fg, .foot .fg'))
      .map(stage => ({
        section: stage.closest('.sec, .foot'),
        stage
      }))
      .filter(pair => pair.section);

    if (!pairs.length) return;

    const sky = document.getElementById('fg-sky');
    const ratios = new Map(pairs.map(pair => [pair.section, 0]));
    const homes = new WeakMap(pairs.map(pair => [pair.stage, pair.section]));
    const timers = new WeakMap();
    let activeStage = null;

    const lift = stage => {
      if (!sky || stage.parentNode === sky) return;
      sky.appendChild(stage);
      void stage.offsetWidth;
    };

    const park = stage => {
      const home = homes.get(stage);
      if (home && stage.parentNode !== home) home.insertBefore(stage, home.firstChild);
    };

    const retire = stage => {
      if (!stage || stage === activeStage) return;
      const pending = timers.get(stage);
      if (pending) clearTimeout(pending);
      stage.classList.remove('fg-active');
      if (currentActiveFgStage === stage) currentActiveFgStage = null;
      if (REDUCE) {
        park(stage);
        return;
      }
      stage.classList.add('fg-retiring');
      timers.set(
        stage,
        setTimeout(() => {
          stage.classList.remove('fg-retiring');
          timers.delete(stage);
          park(stage);
        }, 820)
      );
    };

    const activate = stage => {
      if (!stage || stage === activeStage) return;
      const pending = timers.get(stage);
      if (pending) clearTimeout(pending);
      stage.classList.remove('fg-retiring');
      lift(stage);
      void stage.offsetWidth;
      requestAnimationFrame(() => {
        stage.classList.add('fg-active');
      });
      const prior = activeStage;
      activeStage = stage;
      currentActiveFgStage = stage;
      retire(prior);
    };

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry =>
          ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0)
        );
        const next = pairs.reduce((best, pair) =>
          (ratios.get(pair.section) || 0) > (ratios.get(best.section) || 0) ? pair : best
        );
        const nextRatio = ratios.get(next.section) || 0;
        if (nextRatio > 0) {
          activate(next.stage);
        } else if (activeStage) {
          const prior = activeStage;
          activeStage = null;
          retire(prior);
        }
      },
      { rootMargin: '-6% 0px -6% 0px', threshold: [0, 0.08, 0.22, 0.45] }
    );

    pairs.forEach(pair => observer.observe(pair.section));
  }

  /* ------------------------------------------------------------ 9 · Navigation & Aside Rail Synchronization */
  function wireNav() {
    const nav = document.getElementById('nav');
    const railButtons = Array.from(document.querySelectorAll('.rail-btn'));
    const navLinks = Array.from(document.querySelectorAll('.nav-link'));

    window.addEventListener(
      'scroll',
      () => {
        const y = window.scrollY;
        nav.classList.toggle('stuck', y > 40);

        const a = Math.round(progressFor(y));
        if (a !== activeSec) {
          activeSec = a;
          document.body.setAttribute('data-active-chapter', String(a));
          railButtons.forEach((btn, i) => btn.classList.toggle('is-on', i === a));
          navLinks.forEach((link, i) => link.classList.toggle('is-current', i === a));
        }
      },
      { passive: true }
    );

    railButtons.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        if (anchors[i] !== undefined) {
          window.scrollTo({
            top: anchors[i],
            behavior: REDUCE ? 'auto' : 'smooth'
          });
        }
      });
    });

    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        window.scrollTo({
          top: a.getAttribute('href') === '#hero' ? 0 : target.offsetTop - 30,
          behavior: REDUCE ? 'auto' : 'smooth'
        });
      });
    });
  }

  /* ------------------------------------------------------------ 10 · Cursor & Interactive Orbs */
  function wireCursor() {
    const dot = document.getElementById('cursor');
    if (COARSE || !dot) return;

    let x = vpW() / 2,
      y = vpH() / 2,
      tx = x,
      ty = y;

    window.addEventListener(
      'pointermove',
      e => {
        tx = e.clientX;
        ty = e.clientY;
        RIG.tmx = (e.clientX / vpW()) * 2 - 1;
        RIG.tmy = -((e.clientY / vpH()) * 2 - 1);
      },
      { passive: true }
    );

    document.querySelectorAll('[data-cursor], a, button, .card, .les, .chip, .plate-window').forEach(el => {
      el.addEventListener('mouseenter', () => dot.classList.add('act'));
      el.addEventListener('mouseleave', () => dot.classList.remove('act'));
    });

    function tickCursor() {
      x = lerp(x, tx, 0.2);
      y = lerp(y, ty, 0.2);
      dot.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      requestAnimationFrame(tickCursor);
    }
    requestAnimationFrame(tickCursor);
  }

  function wireChips() {
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const targetMap = { '1': 'works', '2': 'gallery', '3': 'lab', '4': 'craft' };
        const targetEl = document.getElementById(targetMap[chip.getAttribute('data-chip')]);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' });
        }
      });
    });
  }

  function wireCopyEmail() {
    const copyBtn = document.getElementById('copy-btn');
    if (!copyBtn) return;
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('werner@afin-oyo.dev').then(() => {
        const textSpan = copyBtn.querySelector('span');
        const prev = textSpan.textContent;
        textSpan.textContent = '✓ Copied to clipboard';
        copyBtn.style.borderColor = 'var(--gold)';
        copyBtn.style.color = 'var(--bone)';
        setTimeout(() => {
          textSpan.textContent = prev;
          copyBtn.style.borderColor = '';
          copyBtn.style.color = '';
        }, 2000);
      });
    });
  }

  /* ------------------------------------------------------------ 11 · Animation Frame Loop */
  let lastTime = performance.now();
  let clock = 0;
  let introStart = 0;

  function animate(now) {
    const rawDt = (now - lastTime) / 1000 || 0;
    const dt = Math.min(rawDt, 0.05);
    lastTime = now;
    clock += dt;

    if (introStart) {
      const el = (now - introStart) / 1000;
      RIG.intro = sat(el / 2.4);
    }

    // Update Rig
    RIG.prog = progressFor(window.scrollY);
    RIG.smooth = REDUCE ? RIG.prog : damp(RIG.smooth, RIG.prog, 5.2, dt);
    RIG.mx = damp(RIG.mx, RIG.tmx, 2.6, dt);
    RIG.my = damp(RIG.my, RIG.tmy, 2.6, dt);

    applyCamera();

    // Multi-Layer Section & Typography Parallax
    if (!REDUCE) {
      const vh = window.innerHeight;
      const allSections = document.querySelectorAll('.sec, .foot');
      allSections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        if (rect.bottom > -150 && rect.top < vh + 150) {
          const centerOffset = (rect.top + rect.height * 0.5 - vh * 0.5) / (vh * 0.5);
          const parY = -centerOffset * 18;
          const cardParY = -centerOffset * 28;
          const mouseParX = RIG.mx * 8;
          sec.style.setProperty('--sec-par-y', `${parY.toFixed(1)}px`);
          sec.style.setProperty('--card-par-y', `${cardParY.toFixed(1)}px`);
          sec.style.setProperty('--mouse-par-x', `${mouseParX.toFixed(1)}px`);
        }
      });

      // 2D Foreground Depth Parallax synchronized with 3D Camera, Scroll Velocity & Cursor Tilt
      if (currentActiveFgStage) {
        const activeEl = currentActiveFgStage.querySelector('.fg-el');
        if (activeEl) {
          const parX = -RIG.mx * 18;
          const parY = -RIG.my * 12;
          const rot = -RIG.mx * 1.5;
          const fgScrollY = -((window.scrollY % vh) / vh - 0.5) * 22;
          activeEl.style.setProperty('--fg-par-x', `${parX.toFixed(2)}px`);
          activeEl.style.setProperty('--fg-par-y', `${parY.toFixed(2)}px`);
          activeEl.style.setProperty('--fg-scroll-y', `${fgScrollY.toFixed(2)}px`);
          activeEl.style.setProperty('--fg-rot', `${rot.toFixed(2)}deg`);
        }
      }
    }

    // 3D Monumental Wordmark: Ambient background watermark rise & scroll dissolve
    if (wordmarkGroup) {
      const near = smooth(0.02, 0.85, RIG.smooth);
      const introProgress = introStart ? sat((now - introStart) / 1600) : 0;
      const isMobile = window.innerWidth < 768;
      const baseAlpha = isMobile ? 0.32 : 0.48;
      wordmarkGroup.children.forEach(mesh => {
        const idx = mesh.userData.index || 0;
        const st = clamp((introProgress - idx * 0.1) / 0.65, 0, 1);
        const e = easeOut(st);
        mesh.position.y = mesh.userData.baseY - (1 - e) * 2.8;
        mesh.material.opacity = e * baseAlpha * (1 - near);
        mesh.visible = mesh.material.opacity > 0.005;
      });
    }

    // Pulse Lighting & Braziers
    const flicker = Math.sin(clock * 3.8) * 0.35 + Math.sin(clock * 9.2) * 0.18;
    warmShrineLight.intensity = 4.2 + flicker;
    foregroundFlame.intensity = 2.8 + flicker * 0.8;

    const leftFlicker = Math.sin(clock * 8.4) * 0.45 + Math.cos(clock * 14.2) * 0.25;
    const rightFlicker = Math.cos(clock * 7.8) * 0.45 + Math.sin(clock * 13.6) * 0.25;
    leftBrazierLight.intensity = 3.2 + leftFlicker;
    rightBrazierLight.intensity = 3.2 + rightFlicker;

    if (leftBrazier && leftBrazier.flame) {
      leftBrazier.flame.scale.set(1 + leftFlicker * 0.18, 1 + leftFlicker * 0.35, 1 + leftFlicker * 0.18);
    }
    if (rightBrazier && rightBrazier.flame) {
      rightBrazier.flame.scale.set(1 + rightFlicker * 0.18, 1 + rightFlicker * 0.35, 1 + rightFlicker * 0.18);
    }

    // Celestial Sun Corona Breathing
    if (coronaMesh) {
      const cScale = 1.0 + Math.sin(clock * 1.6) * 0.04;
      coronaMesh.scale.set(cScale, cScale, 1.0);
    }

    // Volumetric Ground Mist Waves
    if (mistGroup) {
      mistGroup.children.forEach((plane, mIdx) => {
        plane.position.y = -0.85 + mIdx * 0.28 + Math.sin(clock * 1.2 + mIdx * 1.5) * 0.08;
      });
    }

    // Particle Ecosystem 1: Rising Fire Embers
    const eArr = emberGeo.attributes.position.array;
    for (let k = 0; k < emberCount; k++) {
      eArr[k * 3 + 1] += emberVelocities[k].y;
      eArr[k * 3] += Math.sin(clock * emberVelocities[k].wobbleSpeed + k) * 0.008;
      eArr[k * 3 + 2] += Math.cos(clock * emberVelocities[k].wobbleSpeed + k) * 0.008;
      if (eArr[k * 3 + 1] > 9.5) {
        eArr[k * 3 + 1] = 0.4;
        const isLeft = Math.random() < 0.5;
        eArr[k * 3] = isLeft ? -5.4 + (Math.random() - 0.5) * 2.2 : 5.4 + (Math.random() - 0.5) * 2.2;
      }
    }
    emberGeo.attributes.position.needsUpdate = true;

    // Particle Ecosystem 2: Golden Nocturnal Fireflies
    const fArr = fireflyGeo.attributes.position.array;
    for (let k = 0; k < fireflyCount; k++) {
      const s = fireflyVelocities[k].seed;
      fArr[k * 3] += Math.sin(clock * 1.4 + s) * 0.012;
      fArr[k * 3 + 1] += Math.cos(clock * 1.8 + s) * 0.008;
      fArr[k * 3 + 2] += Math.sin(clock * 1.1 + s * 1.2) * 0.012;
    }
    fireflyGeo.attributes.position.needsUpdate = true;

    // Particle Ecosystem 3: Drifting Leaves
    const pArr = leafGeo.attributes.position.array;
    for (let k = 0; k < leafCount; k++) {
      pArr[k * 3 + 1] += leafVelocities[k].y;
      pArr[k * 3] += leafVelocities[k].x;
      pArr[k * 3 + 2] += leafVelocities[k].z;

      if (pArr[k * 3 + 1] < -1.5) pArr[k * 3 + 1] = 18;
      if (pArr[k * 3] > 18) pArr[k * 3] = -18;
      if (pArr[k * 3 + 2] < -20) pArr[k * 3 + 2] = 20;
    }
    leafGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  function resize() {
    const w = vpW();
    const h = vpH();
    document.documentElement.style.setProperty('--vw', `${w}px`);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, true);
    const maxDpr = w < 768 ? 1.75 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));

    // Calibrate 3D wordmark scale for mobile viewports
    if (wordmarkGroup) {
      const isMobile = w < 768;
      const s = isMobile ? 0.62 : 1.0;
      wordmarkGroup.scale.set(s, s, s);
    }

    measure();
  }

  window.addEventListener('resize', resize, { passive: true });

  /* ------------------------------------------------------------ 12 · Preloader & Bootloader */
  const preEl = document.getElementById('pre');
  const preFill = document.getElementById('pre-fill');
  const prePct = document.getElementById('pre-pct');

  const JOBS = [
    ['Reading the royal type', () => document.fonts && document.fonts.ready],
    ['Pouring laterite earth', () => { measure(); }],
    ['Raising the Ọ̀pó pillars', () => {}],
    ['Carving the palace sanctuary', () => {}],
    ['Lighting the sacred àtùpà flame', () => {}]
  ];

  function boot() {
    document.body.classList.add('is-locked');
    wireReveals();
    wireForegroundStages();
    wireNav();
    wireHeroExit();
    wireCursor();
    wireChips();
    wireCopyEmail();
    resize();

    let i = 0;
    const step = () => {
      const j = JOBS[i];
      const done = () => {
        i++;
        const p = i / JOBS.length;
        if (preFill) preFill.style.right = `${((1 - p) * 100).toFixed(1)}%`;
        if (prePct) prePct.textContent = Math.round(p * 100);

        if (i < JOBS.length) {
          setTimeout(step, 24);
        } else {
          setTimeout(startExperience, 200);
        }
      };

      let r;
      try {
        r = j[1]();
      } catch (err) {
        console.error(err);
      }
      r && r.then ? r.then(done, done) : done();
    };

    setTimeout(step, 60);
  }

  function startExperience() {
    if (preEl) preEl.classList.add('done');
    document.body.classList.remove('is-locked');

    introStart = performance.now();

    // Trigger hero element reveals with orchestrated stagger
    const heroElements = Array.from(document.querySelectorAll('#hero [data-rv], #hero .mask-line'));
    heroElements.forEach((el, idx) => {
      setTimeout(() => el.classList.add('rv-in'), REDUCE ? 0 : 120 + idx * 95);
    });

    requestAnimationFrame(animate);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(boot, 0);
  } else {
    window.addEventListener('DOMContentLoaded', boot);
  }
})();
