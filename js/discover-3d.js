import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL = 'assets/models/discover/manseok-hwasu-map.glb';
const PIN_IDS = ['waterfront', 'lookout', 'library', 'cafe', 'gallery', 'bike'];
const PIN_LIFT = 0.06;
const DEFAULT_ROTATION = 2.75;
const DEFAULT_TILT = 0.05;
const AUTO_ROTATE_DELAY = 10000;
const AUTO_ROTATE_SPEED = 0.00012;
const CAMERA_TARGET = new THREE.Vector3(0, 0.42, 0);
const CAMERA_DIRECTION = new THREE.Vector3(0, 0.72, 0.94).normalize();
const DEFAULT_ZOOM = 3.1;
const MIN_ZOOM = 1.9;
const MAX_ZOOM = 6.2;

const fallbackPinPoints = {
  waterfront: new THREE.Vector3(-3.2, 0.28, 1.35),
  lookout: new THREE.Vector3(-1.35, 0.34, -1.2),
  library: new THREE.Vector3(-0.85, 0.36, 0.65),
  cafe: new THREE.Vector3(1.25, 0.34, -1.1),
  gallery: new THREE.Vector3(3.05, 0.34, -0.35),
  bike: new THREE.Vector3(2.1, 0.3, 1.55)
};

document.addEventListener('DOMContentLoaded', () => {
  initDiscover3D();
});

function initDiscover3D() {
  const map = document.querySelector('.discover__map');
  const canvas = document.getElementById('discoverCanvas');
  const pinLayer = document.querySelector('.discover__pins');
  const pins = Array.from(document.querySelectorAll('.discover-pin'));
  const zoomInput = map?.querySelector('[data-map-zoom]');

  if (!map || !canvas || !pinLayer || !pins.length) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xeaf8fb, 8, 22);

  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 80);
  let currentZoom = DEFAULT_ZOOM;
  let targetZoom = DEFAULT_ZOOM;
  updateCamera(camera, currentZoom);

  const mapRoot = new THREE.Group();
  mapRoot.rotation.y = DEFAULT_ROTATION;
  mapRoot.rotation.x = DEFAULT_TILT;
  scene.add(mapRoot);

  const pinPoints = new Map(Object.entries(fallbackPinPoints));

  addLights(scene);
  loadMapModel(mapRoot, pinPoints).then(() => {
    map.classList.add('is-3d-ready');
    updatePins(camera, mapRoot, pins, pinPoints);
  });

  let targetRotation = DEFAULT_ROTATION;
  let targetTilt = DEFAULT_TILT;
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let pinchStartDistance = 0;
  let pinchStartZoom = DEFAULT_ZOOM;
  let lastInteractionAt = performance.now();
  let isMapVisible = false;
  const activePointers = new Map();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pauseAutoRotate = () => {
    lastInteractionAt = performance.now();
  };

  const setZoom = (value) => {
    targetZoom = THREE.MathUtils.clamp(Number(value), MIN_ZOOM, MAX_ZOOM);
    if (zoomInput) zoomInput.value = targetZoom.toFixed(1);
  };

  const resize = () => {
    const rect = map.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width - 24));
    const height = Math.max(1, Math.floor(rect.height - 24));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    updateCamera(camera, currentZoom);
    updatePins(camera, mapRoot, pins, pinPoints);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(map);
  resize();

  const visibilityObserver = new IntersectionObserver((entries) => {
    const entry = entries[0];
    isMapVisible = Boolean(entry?.isIntersecting);
    if (isMapVisible) pauseAutoRotate();
  }, { threshold: 0.35 });
  visibilityObserver.observe(map);

  const shouldIgnoreDrag = (target) => (
    target.closest('.discover-pin') ||
    target.closest('.discover__panel') ||
    target.closest('.discover__controls') ||
    target.closest('.discover__zoom')
  );

  map.addEventListener('pointerdown', (event) => {
    if (shouldIgnoreDrag(event.target)) return;
    pauseAutoRotate();
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    isDragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    if (activePointers.size === 2) {
      pinchStartDistance = getPointerDistance(activePointers);
      pinchStartZoom = targetZoom;
    }
    map.classList.add('is-dragging');
    map.setPointerCapture(event.pointerId);
  });

  map.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    pauseAutoRotate();
    if (activePointers.has(event.pointerId)) {
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }

    if (activePointers.size >= 2 && pinchStartDistance > 0) {
      const distance = getPointerDistance(activePointers);
      setZoom(pinchStartZoom * (pinchStartDistance / Math.max(distance, 1)));
      return;
    }

    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    targetRotation += dx * 0.008;
    targetTilt = THREE.MathUtils.clamp(targetTilt + dy * 0.0025, -0.28, 0.24);
  });

  const releaseDrag = (event) => {
    activePointers.delete(event.pointerId);
    if (activePointers.size === 1) {
      const next = activePointers.values().next().value;
      lastX = next.x;
      lastY = next.y;
    }
    pinchStartDistance = 0;
    if (!isDragging) return;
    pauseAutoRotate();
    isDragging = false;
    map.classList.remove('is-dragging');
    try {
      if (map.hasPointerCapture?.(event.pointerId)) map.releasePointerCapture(event.pointerId);
    } catch (error) {
      // Some mobile browsers release capture before pointerup/pointercancel reaches us.
    }
  };

  map.addEventListener('pointerup', releaseDrag);
  map.addEventListener('pointercancel', releaseDrag);

  map.querySelector('[data-map-control="left"]')?.addEventListener('click', () => {
    pauseAutoRotate();
    targetRotation -= 0.42;
  });
  map.querySelector('[data-map-control="right"]')?.addEventListener('click', () => {
    pauseAutoRotate();
    targetRotation += 0.42;
  });
  map.querySelector('[data-map-control="reset"]')?.addEventListener('click', () => {
    pauseAutoRotate();
    targetRotation = DEFAULT_ROTATION;
    targetTilt = DEFAULT_TILT;
    setZoom(DEFAULT_ZOOM);
  });

  zoomInput?.addEventListener('input', () => {
    pauseAutoRotate();
    setZoom(zoomInput.value);
  });

  map.addEventListener('wheel', (event) => {
    if (shouldIgnoreDrag(event.target)) return;
    event.preventDefault();
    pauseAutoRotate();
    setZoom(targetZoom + Math.sign(event.deltaY) * 0.28);
  }, { passive: false });

  let clock = 0;
  const animate = () => {
    requestAnimationFrame(animate);
    clock += 0.01;
    const canAutoRotate = isMapVisible && !isDragging && !reducedMotion && performance.now() - lastInteractionAt > AUTO_ROTATE_DELAY;
    if (canAutoRotate) targetRotation += AUTO_ROTATE_SPEED;

    mapRoot.rotation.y += (targetRotation - mapRoot.rotation.y) * 0.08;
    mapRoot.rotation.x += (targetTilt - mapRoot.rotation.x) * 0.08;
    currentZoom += (targetZoom - currentZoom) * 0.12;
    updateCamera(camera, currentZoom);

    mapRoot.traverse((child) => {
      if (child.userData.floatBase !== undefined) {
        child.position.y = child.userData.floatBase + Math.sin(clock + child.userData.floatPhase) * 0.025;
      }
      if (child.userData.waveBaseZ !== undefined) {
        child.position.z = child.userData.waveBaseZ + Math.sin(clock * child.userData.waveSpeed + child.userData.wavePhase) * 0.055;
        child.material.opacity = child.userData.waveOpacity + Math.sin(clock * child.userData.waveSpeed + child.userData.wavePhase) * 0.08;
      }
    });

    renderer.render(scene, camera);
    updatePins(camera, mapRoot, pins, pinPoints);
  };
  animate();
}

function updateCamera(camera, zoom) {
  camera.position.copy(CAMERA_TARGET).addScaledVector(CAMERA_DIRECTION, zoom);
  camera.lookAt(CAMERA_TARGET);
}

function getPointerDistance(activePointers) {
  const points = Array.from(activePointers.values());
  if (points.length < 2) return 0;
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

function addLights(scene) {
  scene.add(new THREE.HemisphereLight(0xf9fcff, 0x79a6af, 2.2));

  const sun = new THREE.DirectionalLight(0xfff1d5, 3.6);
  sun.position.set(-4.5, 7.5, 5.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 30;
  sun.shadow.camera.left = -8;
  sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -8;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x97d5ff, 1.1);
  fill.position.set(4, 4, -5);
  scene.add(fill);

  const warmEdge = new THREE.PointLight(0xffc220, 70, 14);
  warmEdge.position.set(-3, 2.5, 4);
  scene.add(warmEdge);
}

function buildLowCostSea(root) {
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 7, 8, 8),
    new THREE.MeshStandardMaterial({
      color: 0x66c9dd,
      roughness: 0.56,
      metalness: 0.02,
      transparent: true,
      opacity: 0.34
    })
  );
  water.name = 'generated-sea';
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.06, -0.2);
  water.receiveShadow = true;
  root.add(water);

  const waveMaterial = new THREE.MeshBasicMaterial({
    color: 0xfffaf5,
    transparent: true,
    opacity: 0.38,
    depthWrite: false
  });

  for (let i = 0; i < 9; i += 1) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.4, -0.015, -2.7 + i * 0.34),
      new THREE.Vector3(-2.2, -0.012, -2.58 + i * 0.34),
      new THREE.Vector3(0.2, -0.014, -2.72 + i * 0.34),
      new THREE.Vector3(2.6, -0.012, -2.56 + i * 0.34),
      new THREE.Vector3(4.6, -0.015, -2.66 + i * 0.34)
    ]);
    const wave = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.01, 5, false), waveMaterial.clone());
    wave.userData.waveBaseZ = wave.position.z;
    wave.userData.wavePhase = i * 0.7;
    wave.userData.waveSpeed = 0.75 + i * 0.03;
    wave.userData.waveOpacity = 0.25 + (i % 3) * 0.05;
    root.add(wave);
  }
}

async function loadMapModel(root, pinPoints) {
  const loader = new GLTFLoader();

  try {
    const gltf = await loader.loadAsync(MODEL_URL);
    const model = gltf.scene;
    model.name = 'manseok-hwasu-map';

    root.add(model);
    fitModelToMap(model);
    prepareModelMaterials(model);
    readIndicatorCubes(model, root, pinPoints);
    centerSceneOnPins(model, pinPoints);
    buildLowCostSea(root);
  } catch (error) {
    console.warn('Discover 3D model could not be loaded. Using fallback anchors.', error);
    centerFallbackPins(pinPoints);
    buildLowCostSea(root);
  }
}

function fitModelToMap(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSide = Math.max(size.x, size.z, size.y);
  const scale = maxSide > 0 ? 6.4 / maxSide : 1;

  model.scale.setScalar(scale);
  model.position.copy(center).multiplyScalar(-scale);

  const fittedBox = new THREE.Box3().setFromObject(model);
  model.position.y -= fittedBox.min.y;
}

function prepareModelMaterials(model) {
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;

    if (child.name.toLowerCase() === 'plane') {
      child.visible = false;
      return;
    }

    if (child.material) {
      child.material.side = THREE.DoubleSide;
      child.material.needsUpdate = true;
    }
  });
}

function readIndicatorCubes(model, root, pinPoints) {
  root.updateWorldMatrix(true, true);

  PIN_IDS.forEach((id) => {
    const marker = model.getObjectByName(id);
    if (!marker) return;

    marker.updateWorldMatrix(true, false);
    const markerBox = new THREE.Box3().setFromObject(marker);
    const markerCenter = markerBox.getCenter(new THREE.Vector3());
    const markerSize = markerBox.getSize(new THREE.Vector3());
    const localPoint = root.worldToLocal(markerCenter);
    localPoint.y += Math.max(0.02, markerSize.y * 0.08) + PIN_LIFT;

    pinPoints.set(id, localPoint);
    marker.visible = false;
  });
}

function centerSceneOnPins(model, pinPoints) {
  const center = getPinCenter(pinPoints);
  model.position.sub(center);
  PIN_IDS.forEach((id) => {
    const point = pinPoints.get(id);
    if (point) point.sub(center);
  });
}

function centerFallbackPins(pinPoints) {
  const center = getPinCenter(pinPoints);
  PIN_IDS.forEach((id) => {
    const point = pinPoints.get(id);
    if (point) point.sub(center);
  });
}

function getPinCenter(pinPoints) {
  const center = new THREE.Vector3();
  let count = 0;
  PIN_IDS.forEach((id) => {
    const point = pinPoints.get(id);
    if (!point) return;
    center.add(point);
    count += 1;
  });
  if (count > 0) center.multiplyScalar(1 / count);
  center.y = 0;
  return center;
}

function updatePins(camera, mapRoot, pins, pinPoints) {
  const rect = document.querySelector('.discover__canvas')?.getBoundingClientRect();
  if (!rect) return;

  pins.forEach((pin) => {
    const point = pinPoints.get(pin.dataset.id);
    if (!point) return;

    const pos = point.clone();
    mapRoot.localToWorld(pos);
    pos.project(camera);

    const x = ((pos.x + 1) / 2) * rect.width;
    const y = ((-pos.y + 1) / 2) * rect.height;
    const inView = pos.z < 1 && x > -60 && x < rect.width + 60 && y > -70 && y < rect.height + 70;

    pin.style.setProperty('--pin-x', `${x}px`);
    pin.style.setProperty('--pin-y', `${y}px`);
    pin.classList.toggle('is-hidden', !inView);
  });
}
