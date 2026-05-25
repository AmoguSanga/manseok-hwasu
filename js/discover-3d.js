import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL = 'assets/models/discover/manseok-hwasu-map-revised.glb';
const PIN_IDS = ['house', 'lounge', 'terrace', 'parking', 'cafe', 'gallery', 'beachfront', 'tidalstage', 'readingshore', 'neighborpath', 'catisland'];
const PIN_LIFT = 0.1;
const HOME_DISTANCE = 4.8;
const FOCUS_DISTANCE = 3.9;
const HOUSE_FOCUS_DISTANCE = 1.18;
const MIN_DISTANCE = 0.95;
const MAX_DISTANCE = 9.6;
const MAP_SCALE_TARGET = 9.8;
const CAMERA_HOME = new THREE.Vector3(0, 0.42, 0.05);
const TOP_DIRECTION = new THREE.Vector3(0, 1, 0.08).normalize();
const FRONT_DIRECTION = new THREE.Vector3(0.18, 0.44, -1).normalize();
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SLOW_ORBIT_SPEED = 0.018;
const HOME_ORBIT_SPEED = 0.012;
const AUTO_ORBIT_DELAY = 10000;
const PAN_LEFT_RANGE = 2.08;
const PAN_RIGHT_RANGE = 1.95;
const HOUSE_FOCUS_YAW = -0.46;

const fallbackPinPoints = {
  house: new THREE.Vector3(-0.25, 0.42, -0.35),
  lounge: new THREE.Vector3(-1.2, 0.34, 0.45),
  terrace: new THREE.Vector3(-0.65, 0.36, -0.95),
  parking: new THREE.Vector3(-3.2, 0.28, 1.55),
  cafe: new THREE.Vector3(0.75, 0.34, -1.05),
  gallery: new THREE.Vector3(1.8, 0.34, -0.55),
  beachfront: new THREE.Vector3(2.85, 0.3, 0.95),
  tidalstage: new THREE.Vector3(3.2, 0.28, -1.7),
  readingshore: new THREE.Vector3(0.35, 0.34, 0.85),
  neighborpath: new THREE.Vector3(-1.1, 0.28, 2.05),
  catisland: new THREE.Vector3(-2.7, 0.3, -1.75)
};

document.addEventListener('DOMContentLoaded', () => {
  initDiscover3D();
});

function initDiscover3D() {
  const map = document.querySelector('.discover__map');
  const canvas = document.getElementById('discoverCanvas');
  const enterButton = map?.querySelector('[data-tour-enter]');

  if (!map || !canvas) return;

  let sceneStarted = false;

  const activate = () => {
    map.classList.remove('is-locked');
    map.classList.add(window.matchMedia('(max-width: 640px)').matches ? 'is-mobile-expanded' : 'is-expanded');
    document.dispatchEvent(new CustomEvent('discover:tour-activated', { detail: { map } }));
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));

    if (sceneStarted) return;
    sceneStarted = true;
    initDiscover3DScene(map, canvas);
  };

  enterButton?.addEventListener('click', activate);
  document.addEventListener('discover:activate-tour', activate);
}

function initDiscover3DScene(map, canvas) {
  const pinLayer = document.querySelector('.discover__pins');
  const pins = Array.from(document.querySelectorAll('.discover-pin'));
  const zoomInput = map.querySelector('[data-map-zoom]');
  const panInput = map.querySelector('[data-map-pan]');

  if (!pinLayer || !pins.length) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setClearColor(0x62c6d9, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x62c6d9);
  scene.fog = new THREE.Fog(0x62c6d9, 16, 38);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 110);
  const mapRoot = new THREE.Group();
  scene.add(mapRoot);

  const pinPoints = new Map(Object.entries(fallbackPinPoints));
  const foamMeshes = [];
  const tideMeshes = {
    sea: [],
    mud: [],
    foam: foamMeshes,
    seaReference: null,
    mudReference: null,
    platformReference: null
  };
  let latestTideStage = document.querySelector('[data-tide-status]')?.dataset.tideStage || 'high';

  const cameraState = {
    target: CAMERA_HOME.clone(),
    nextTarget: CAMERA_HOME.clone(),
    direction: FRONT_DIRECTION.clone(),
    nextDirection: FRONT_DIRECTION.clone(),
    distance: HOME_DISTANCE,
    nextDistance: HOME_DISTANCE,
    yaw: 0,
    nextYaw: 0,
    orbitAngle: 0,
    pan: 0,
    nextPan: 0,
    isFocused: false,
    pendingFocusId: null
  };
  let lastInteractionAt = performance.now();

  if (zoomInput) zoomInput.value = distanceToZoomValue(HOME_DISTANCE);

  addLights(scene);
  loadMapModel(mapRoot, pinPoints, tideMeshes, foamMeshes).then(() => {
    map.classList.add('is-3d-ready');
    applyTideState(tideMeshes, latestTideStage);
    if (cameraState.pendingFocusId) focusNode(cameraState.pendingFocusId);
    updatePins(camera, mapRoot, pins, pinPoints);
  });

  const syncPanInput = () => {
    if (panInput) panInput.value = String(-cameraState.nextPan);
  };

  const setPan = (value = 0) => {
    cameraState.nextPan = THREE.MathUtils.clamp(Number(value) || 0, -1, 1);
    syncPanInput();
  };

  const setDistance = (value, fromSlider = false) => {
    const distance = fromSlider ? zoomValueToDistance(value) : Number(value);
    cameraState.nextDistance = THREE.MathUtils.clamp(distance, MIN_DISTANCE, MAX_DISTANCE);
    if (zoomInput) zoomInput.value = distanceToZoomValue(cameraState.nextDistance);
  };

  const resetView = ({ preserveOrientation = false } = {}) => {
    cameraState.nextTarget.copy(CAMERA_HOME);
    cameraState.nextDirection.copy(FRONT_DIRECTION);
    if (preserveOrientation) {
      const heldYaw = cameraState.yaw + cameraState.orbitAngle;
      cameraState.yaw = heldYaw;
      cameraState.nextYaw = heldYaw;
      cameraState.orbitAngle = 0;
    } else {
      cameraState.nextYaw = 0;
      cameraState.orbitAngle = 0;
    }
    setPan(0);
    cameraState.isFocused = false;
    setDistance(HOME_DISTANCE);
    map.classList.remove('is-node-focused');
    noteInteraction();
  };

  const focusNode = (id) => {
    const localPoint = pinPoints.get(id);
    if (!localPoint) {
      cameraState.pendingFocusId = id;
      return;
    }

    const worldPoint = localPoint.clone();
    mapRoot.localToWorld(worldPoint);
    cameraState.nextTarget.copy(worldPoint);
    if (id === 'house') {
      cameraState.nextTarget.x -= 0.04;
      cameraState.nextTarget.y += 0.1;
      cameraState.nextTarget.z -= 0.24;
      cameraState.nextYaw = nearestAngle(cameraState.yaw + cameraState.orbitAngle, HOUSE_FOCUS_YAW);
    } else {
      cameraState.nextTarget.y += 0.24;
    }
    const isMobileFocus = window.matchMedia('(max-width: 640px)').matches;
    cameraState.nextDistance = id === 'house'
      ? (isMobileFocus ? HOUSE_FOCUS_DISTANCE * 0.9 : HOUSE_FOCUS_DISTANCE)
      : (isMobileFocus ? FOCUS_DISTANCE * 0.72 : FOCUS_DISTANCE);
    cameraState.orbitAngle = 0;
    setPan(0);
    cameraState.isFocused = true;
    cameraState.pendingFocusId = null;
    map.classList.add('is-node-focused');
    if (zoomInput) zoomInput.value = distanceToZoomValue(cameraState.nextDistance);
    noteInteraction();
  };

  const noteInteraction = () => {
    lastInteractionAt = performance.now();
  };

  const resize = () => {
    const rect = map.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width - 24));
    const height = Math.max(1, Math.floor(rect.height - 24));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    updateCamera(camera, cameraState);
    updatePins(camera, mapRoot, pins, pinPoints);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(map);
  resize();

  map.querySelector('[data-map-control="reset"]')?.addEventListener('click', () => resetView());
  zoomInput?.addEventListener('input', () => {
    noteInteraction();
    setDistance(zoomInput.value, true);
  });
  panInput?.addEventListener('input', () => {
    noteInteraction();
    cameraState.nextPan = -(Number(panInput.value) || 0);
  });

  let isDragging = false;
  let lastX = 0;

  const shouldIgnoreDrag = (target) => (
    target.closest('.discover-pin') ||
    target.closest('.discover__panel') ||
    target.closest('.discover__controls') ||
    target.closest('.discover__zoom') ||
    target.closest('.discover__pan') ||
    target.closest('.discover__stage-actions') ||
    target.closest('.discover__viewer')
  );

  map.addEventListener('pointerdown', (event) => {
    if (shouldIgnoreDrag(event.target)) return;
    isDragging = true;
    noteInteraction();
    lastX = event.clientX;
    map.classList.add('is-dragging');
    map.setPointerCapture?.(event.pointerId);
  });

  map.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    const dx = event.clientX - lastX;
    lastX = event.clientX;
    noteInteraction();
    cameraState.nextYaw += dx * 0.006;
  });

  const releaseDrag = (event) => {
    if (!isDragging) return;
    isDragging = false;
    map.classList.remove('is-dragging');
    try {
      if (map.hasPointerCapture?.(event.pointerId)) map.releasePointerCapture(event.pointerId);
    } catch (error) {
      // Pointer capture may already be released by the browser.
    }
  };

  map.addEventListener('pointerup', releaseDrag);
  map.addEventListener('pointercancel', releaseDrag);

  panInput?.addEventListener('pointerdown', event => event.stopPropagation());
  panInput?.addEventListener('pointermove', event => event.stopPropagation());
  panInput?.addEventListener('pointerup', event => event.stopPropagation());

  map.addEventListener('wheel', (event) => {
    if (shouldIgnoreDrag(event.target)) return;
    event.preventDefault();
    noteInteraction();
    setDistance(cameraState.nextDistance + Math.sign(event.deltaY) * 0.38);
  }, { passive: false });

  document.addEventListener('discover:focus-node', event => focusNode(event.detail?.id));
  document.addEventListener('discover:reset-view', event => resetView(event.detail || {}));
  document.addEventListener('discover:hard-reset-view', () => resetView());
  document.addEventListener('mh:tide-updated', event => {
    latestTideStage = event.detail?.stage || 'unknown';
    applyTideState(tideMeshes, latestTideStage);
  });

  let lastTime = performance.now();
  const animate = (now = performance.now()) => {
    requestAnimationFrame(animate);
    const isInteractive = !map.classList.contains('is-locked') && !map.classList.contains('is-viewer-open');
    if (!isInteractive) return;

    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    const clock = now * 0.001;

    cameraState.target.lerp(cameraState.nextTarget, 0.042);
    cameraState.direction.lerp(cameraState.nextDirection, 0.034).normalize();
    cameraState.distance += (cameraState.nextDistance - cameraState.distance) * 0.052;
    cameraState.yaw += (cameraState.nextYaw - cameraState.yaw) * 0.055;
    cameraState.pan += (cameraState.nextPan - cameraState.pan) * 0.06;
    const canAutoOrbit = !isDragging && !REDUCED_MOTION && performance.now() - lastInteractionAt > AUTO_ORBIT_DELAY;
    if (canAutoOrbit) {
      cameraState.orbitAngle += (cameraState.isFocused ? SLOW_ORBIT_SPEED : HOME_ORBIT_SPEED) * dt;
    }

    animateSea(tideMeshes, foamMeshes, clock, dt);
    updateCamera(camera, cameraState);
    renderer.render(scene, camera);
    updatePins(camera, mapRoot, pins, pinPoints);
  };
  animate();
}

function updateCamera(camera, state) {
  const direction = state.direction
    .clone()
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), state.yaw + state.orbitAngle)
    .normalize();
  const target = state.target.clone();
  const panOffset = state.pan >= 0
    ? state.pan * PAN_RIGHT_RANGE
    : state.pan * PAN_LEFT_RANGE;
  target.x += panOffset;
  camera.position.copy(target).addScaledVector(direction, state.distance);
  camera.lookAt(target);
}

function zoomValueToDistance(value) {
  return MIN_DISTANCE + MAX_DISTANCE - Number(value);
}

function distanceToZoomValue(distance) {
  return String((MIN_DISTANCE + MAX_DISTANCE - Number(distance)).toFixed(1));
}

function nearestAngle(current, target) {
  const turn = Math.PI * 2;
  return target + Math.round((current - target) / turn) * turn;
}

function addLights(scene) {
  scene.add(new THREE.HemisphereLight(0xf9fcff, 0x77a6aa, 2.15));

  const sun = new THREE.DirectionalLight(0xffefd2, 3.8);
  sun.position.set(-5.5, 8.4, 6.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 36;
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -10;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x95dcff, 1.25);
  fill.position.set(5, 5, -6);
  scene.add(fill);

  const warmEdge = new THREE.PointLight(0xffc220, 58, 17);
  warmEdge.position.set(-3.8, 3, 5.8);
  scene.add(warmEdge);
}

async function loadMapModel(root, pinPoints, tideMeshes, foamMeshes) {
  const loader = new GLTFLoader();

  try {
    const gltf = await loader.loadAsync(MODEL_URL);
    const model = gltf.scene;
    model.name = 'manseok-hwasu-map-revised';

    root.add(model);
    fitModelToMap(model);
    prepareModelMaterials(model, tideMeshes);
    readIndicatorNodes(model, root, pinPoints);
    centerSceneOnPins(model, pinPoints);
    buildGeneratedTideSurfaces(root, tideMeshes);
    buildSeaFoam(root, foamMeshes);
  } catch (error) {
    console.warn('Discover 3D model could not be loaded. Using fallback anchors.', error);
    centerFallbackPins(pinPoints);
    buildFallbackSea(root, tideMeshes, foamMeshes);
  }
}

function fitModelToMap(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSide = Math.max(size.x, size.z, size.y);
  const scale = maxSide > 0 ? MAP_SCALE_TARGET / maxSide : 1;

  model.scale.setScalar(scale);
  model.position.copy(center).multiplyScalar(-scale);

  const fittedBox = new THREE.Box3().setFromObject(model);
  model.position.y -= fittedBox.min.y;
}

function prepareModelMaterials(model, tideMeshes) {
  model.traverse(child => {
    const name = child.name.toLowerCase();
    const isSeaPlane = hasObjectName(child, 'seaplane');
    const isMudBase = hasObjectName(child, 'mudbase');

    if (name === 'baseplane.001') {
      tideMeshes.platformReference = child;
    }

    if (isSeaPlane) {
      child.userData.seaSurface = true;
      tideMeshes.seaReference = tideMeshes.seaReference || child;
      child.visible = false;
      child.castShadow = false;
      child.receiveShadow = false;
    }

    if (isMudBase) {
      child.userData.mudBase = true;
      tideMeshes.mudReference = tideMeshes.mudReference || child;
      child.visible = false;
      child.castShadow = false;
      child.receiveShadow = false;
    }

    if (!child.isMesh) return;
    if (!isSeaPlane && !isMudBase) {
      child.castShadow = true;
      child.receiveShadow = true;
    }

    if (child.material) {
      child.material = child.material.clone();
      child.material.side = THREE.DoubleSide;
      if (child.userData.seaSurface) {
        child.material = new THREE.MeshBasicMaterial({
          color: 0x62c6d9,
          side: THREE.DoubleSide
        });
      }
      child.material.needsUpdate = true;
    }
  });
}

function hasObjectName(object, fragment) {
  let current = object;
  while (current) {
    if ((current.name || '').toLowerCase().includes(fragment)) return true;
    current = current.parent;
  }
  return false;
}

function readIndicatorNodes(model, root, pinPoints) {
  root.updateWorldMatrix(true, true);

  PIN_IDS.forEach(id => {
    const markerName = id === 'house' ? 'CrocatHouse' : id;
    const marker = model.getObjectByName(markerName);
    if (!marker) return;

    marker.updateWorldMatrix(true, false);
    const markerBox = new THREE.Box3().setFromObject(marker);
    const markerCenter = markerBox.getCenter(new THREE.Vector3());
    const markerSize = markerBox.getSize(new THREE.Vector3());
    const localPoint = root.worldToLocal(markerCenter);
    localPoint.y += Math.max(0.04, markerSize.y * 0.1) + PIN_LIFT;

    pinPoints.set(id, localPoint);
    if (id !== 'house') marker.visible = false;
  });
}

function centerSceneOnPins(model, pinPoints) {
  const center = getPinCenter(pinPoints);
  model.position.sub(center);
  PIN_IDS.forEach(id => {
    const point = pinPoints.get(id);
    if (point) point.sub(center);
  });
}

function centerFallbackPins(pinPoints) {
  const center = getPinCenter(pinPoints);
  PIN_IDS.forEach(id => {
    const point = pinPoints.get(id);
    if (point) point.sub(center);
  });
}

function getPinCenter(pinPoints) {
  const center = new THREE.Vector3();
  let count = 0;
  PIN_IDS.forEach(id => {
    const point = pinPoints.get(id);
    if (!point) return;
    center.add(point);
    count += 1;
  });
  if (count > 0) center.multiplyScalar(1 / count);
  center.y = 0;
  return center;
}

function buildSeaFoam(root, foamMeshes) {
  const foamMaterial = new THREE.MeshBasicMaterial({
    color: 0xfffaf5,
    transparent: true,
    opacity: 0.68,
    depthWrite: false
  });

  const seaBase = getSeaBaseY(root);

  for (let i = 0; i < 36; i += 1) {
    const z = -17 + i * 0.95;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-56, seaBase + 0.018, z),
      new THREE.Vector3(-28, seaBase + 0.026, z + 0.34),
      new THREE.Vector3(0.1, seaBase + 0.02, z - 0.12),
      new THREE.Vector3(28, seaBase + 0.026, z + 0.28),
      new THREE.Vector3(56, seaBase + 0.018, z - 0.08)
    ]);
    const foam = new THREE.Mesh(new THREE.TubeGeometry(curve, 88, 0.02, 5, false), foamMaterial.clone());
    foam.userData.waveBaseZ = foam.position.z;
    foam.userData.baseY = seaBase + 0.022;
    foam.userData.wavePhase = i * 0.58;
    foam.userData.waveSpeed = 0.68 + i * 0.025;
    foam.userData.waveOpacity = 0.48 + (i % 4) * 0.052;
    foamMeshes.push(foam);
    root.add(foam);
  }
}

function buildGeneratedTideSurfaces(root, tideMeshes) {
  const seaReferenceY = getReferenceCenterY(tideMeshes.seaReference, 0.006);
  const platformLimitY = getPlatformWaterLimitY(tideMeshes.platformReference);
  const seaBase = THREE.MathUtils.clamp(
    Math.min(seaReferenceY, platformLimitY ?? seaReferenceY),
    -0.025,
    0.006
  );
  const mudReferenceY = getReferenceCenterY(tideMeshes.mudReference, seaBase - 0.018);
  const mudBase = THREE.MathUtils.clamp(Math.min(mudReferenceY, seaBase - 0.018), -0.04, -0.006);

  const mud = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 46, 1, 1),
    new THREE.MeshBasicMaterial({
      map: createMudflatTexture(),
      side: THREE.DoubleSide
    })
  );
  mud.name = 'generated-infinite-mudflat';
  mud.rotation.x = -Math.PI / 2;
  mud.position.set(0, mudBase, 0);
  mud.visible = false;
  mud.receiveShadow = true;
  mud.userData.mudBase = true;
  tideMeshes.mud.push(mud);
  root.add(mud);

  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120, 1, 1),
    new THREE.MeshBasicMaterial({
      color: 0x62c6d9,
      side: THREE.DoubleSide
    })
  );
  ocean.name = 'generated-infinite-ocean';
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(0, seaBase, 0);
  ocean.userData.seaSurface = true;
  ocean.userData.modelBaseY = ocean.position.y;
  ocean.userData.floatBase = ocean.position.y;
  tideMeshes.sea.push(ocean);
  root.add(ocean);
}

function getReferenceCenterY(object, fallback) {
  if (!object) return fallback;
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return fallback;
  return box.getCenter(new THREE.Vector3()).y;
}

function getPlatformWaterLimitY(object) {
  if (!object) return null;
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return null;
  const height = Math.max(0.001, box.max.y - box.min.y);
  return box.min.y + height * 0.75;
}

function createMudflatTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(512, 500, 90, 512, 512, 760);
  gradient.addColorStop(0, '#b5bbb0');
  gradient.addColorStop(0.28, '#a99576');
  gradient.addColorStop(0.58, '#adb4a9');
  gradient.addColorStop(1, '#c2c4bb');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y += 26) {
    const bandOpacity = 0.035 + ((y / 26) % 4) * 0.008;
    ctx.fillStyle = `rgba(255, 250, 245, ${bandOpacity + 0.025})`;
    ctx.fillRect(0, y, canvas.width, 8);
  }

  for (let i = 0; i < 900; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = 0.7 + Math.random() * 2.4;
    ctx.fillStyle = Math.random() > 0.5
      ? 'rgba(255, 250, 245, 0.07)'
      : 'rgba(82, 74, 64, 0.035)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.8, 1.8);
  return texture;
}

function getSeaBaseY(root) {
  const sea = [];
  root.traverse(child => {
    if (child.userData?.seaSurface && child.visible !== false) sea.push(child);
  });
  if (!sea.length) return -0.04;
  return sea.reduce((sum, item) => sum + (item.userData.floatBase ?? item.position.y), 0) / sea.length;
}

function buildFallbackSea(root, tideMeshes, foamMeshes) {
  buildGeneratedTideSurfaces(root, tideMeshes);
  buildSeaFoam(root, foamMeshes);
}

function animateSea(tideMeshes, foamMeshes, clock) {
  tideMeshes.sea.forEach((sea, index) => {
    if (sea.userData.floatBase === undefined) sea.userData.floatBase = sea.position.y;
    sea.position.y = sea.userData.floatBase + Math.sin(clock * 0.85 + index) * 0.006;
  });

  foamMeshes.forEach((foam, index) => {
    foam.position.z = (foam.userData.waveBaseZ || 0) + Math.sin(clock * foam.userData.waveSpeed + foam.userData.wavePhase) * 0.08;
    foam.position.y = (foam.userData.baseY || 0) + Math.sin(clock * 0.85 + index * 0.35) * 0.006;
    foam.material.opacity = Math.max(0.04, foam.userData.waveOpacity + Math.sin(clock * foam.userData.waveSpeed + foam.userData.wavePhase) * 0.08);
  });
}

function applyTideState(tideMeshes, stage = 'unknown') {
  const isLow = stage === 'low' || stage === 'falling';

  tideMeshes.sea.forEach(sea => {
    const modelBase = sea.userData.modelBaseY ?? sea.position.y;
    sea.visible = true;
    sea.userData.floatBase = isLow ? modelBase - 0.085 : modelBase;
    if (sea.material?.opacity !== undefined) {
      sea.material.transparent = false;
      sea.material.opacity = 1;
    }
  });

  const seaGroup = tideMeshes.sea;
  const seaBase = seaGroup.length
    ? seaGroup.reduce((sum, sea) => sum + (sea.userData.floatBase ?? sea.position.y), 0) / seaGroup.length
    : 0;
  tideMeshes.foam?.forEach(foam => {
    foam.visible = !isLow;
    foam.userData.baseY = seaBase + 0.024;
  });

  tideMeshes.mud.forEach(mud => {
    mud.visible = isLow;
    if (mud.material?.opacity !== undefined) {
      mud.material.transparent = false;
      mud.material.opacity = 1;
    }
  });
}

function updatePins(camera, mapRoot, pins, pinPoints) {
  const rect = document.querySelector('.discover__canvas')?.getBoundingClientRect();
  if (!rect) return;

  const rankedPins = [];

  pins.forEach(pin => {
    const point = pinPoints.get(pin.dataset.id);
    if (!point) return;

    const pos = point.clone();
    mapRoot.localToWorld(pos);
    const cameraDistance = camera.position.distanceTo(pos);
    pos.project(camera);

    const x = ((pos.x + 1) / 2) * rect.width;
    const y = ((-pos.y + 1) / 2) * rect.height;
    const inView = pos.z < 1 && x > -90 && x < rect.width + 90 && y > -100 && y < rect.height + 100;

    pin.style.setProperty('--pin-x', `${x}px`);
    pin.style.setProperty('--pin-y', `${y}px`);
    pin.classList.toggle('is-hidden', !inView);
    rankedPins.push({ pin, cameraDistance, inView });
  });

  rankedPins
    .sort((a, b) => b.cameraDistance - a.cameraDistance)
    .forEach((entry, index) => {
      entry.pin.style.zIndex = String(20 + index);
  });
}
