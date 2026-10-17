import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { gsap } from 'gsap';
import { buildThermalAssembly, getAssemblyViewHeight } from './thermal-assembly.js';
import { icon } from './icons.js';
import { packageLabel } from './product-label.js';

export function createHeroScene(host) {
  const hero = host.closest('.hero');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const abort = new AbortController();
  const listen = (node, type, handler) => node.addEventListener(type, handler, { signal: abort.signal });
  const fallback = host.querySelector('.assembly-fallback');
  const status = hero.querySelector('#scene-status');
  const pauseButton = hero.querySelector('#motion-toggle');
  const assembleButton = hero.querySelector('#assemble-toggle');
  const labels = Object.fromEntries([...host.querySelectorAll('[data-label]')].map(node => [node.dataset.label, node]));
  const leaders = Object.fromEntries([...host.querySelectorAll('[data-anchor]')].map(node => [node.dataset.anchor, node]));
  const state = { assembly: 0 };
  let renderer, scene, camera, controls, assembly, environment, pmrem, resizeObserver, visibilityObserver;
  let frame = 0, disposed = false, lost = false, visible = true, ready = false, rendering = false;
  let autoRotate = !media.matches, moving = false, assembled = false, lastTime = 0;
  const homeDirection = new THREE.Vector3(6.4, 4.1, 7.2);
  const target = new THREE.Vector3(0, 1.2, 0);
  const homePosition = homeDirection.clone().add(target);
  const points = { heatsink: new THREE.Vector3(1.15, 0.55, 0.7), paste: new THREE.Vector3(0.45, 0.035, 0.42), chip: new THREE.Vector3(0.5, 0.24, 0.5), board: new THREE.Vector3(1.75, 0.055, 0.95) };
  function announce(text) { status.textContent = text; }
  function stop() { cancelAnimationFrame(frame); frame = 0; }
  function updateLabels() {
    const width = host.clientWidth, height = host.clientHeight;
    for (const [id, local] of Object.entries(points)) {
      const projected = assembly.parts[id].localToWorld(local.clone()).project(camera);
      const x = (projected.x * 0.5 + 0.5) * width, y = (-projected.y * 0.5 + 0.5) * height;
      const label = labels[id];
      const endX = label.offsetLeft, endY = label.offsetTop;
      leaders[id].querySelector('path').setAttribute('d', `M${x},${y} L${endX - 12},${endY} L${endX},${endY}`);
      const dot = leaders[id].querySelector('circle'); dot.setAttribute('cx', x); dot.setAttribute('cy', y);
    }
  }
  function render(time = performance.now()) {
    frame = 0;
    if (!ready || disposed || lost || !visible || document.hidden) return;
    rendering = true;
    const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 1 / 60; lastTime = time;
    controls.autoRotate = autoRotate && !media.matches && !moving;
    controls.update(delta);
    if (controls.autoRotate) assembly.fanRotor.rotation.y -= delta * 2.2;
    assembly.setAssembly(state.assembly);
    scene.updateMatrixWorld();
    renderer.render(scene, camera); updateLabels();
    const first = host.dataset.renderer !== 'webgl';
    fallback.hidden = true; host.dataset.renderer = 'webgl';
    if (first) host.dispatchEvent(new CustomEvent('hero-model-ready', { bubbles: true }));
    rendering = false;
    if (controls.autoRotate || moving) wake();
  }
  function wake() {
    if (!frame && !rendering && ready && !disposed && !lost && visible && !document.hidden) frame = requestAnimationFrame(render);
  }
  function pause(paused = true) {
    autoRotate = !paused && !media.matches;
    pauseButton.disabled = media.matches;
    pauseButton.setAttribute('aria-pressed', String(autoRotate));
    pauseButton.setAttribute('aria-label', media.matches ? 'Thiết bị đang bật chế độ giảm chuyển động' : autoRotate ? 'Tạm dừng tự xoay' : 'Bật tự xoay mô hình');
    pauseButton.innerHTML = icon(autoRotate ? 'pause' : 'play'); wake();
  }
  function resetView(animate = true) {
    if (!ready || lost) return;
    pause(); gsap.killTweensOf(camera.position); gsap.killTweensOf(assembly.root.rotation);
    assembly.root.rotation.set(0, 0, 0);
    if (animate && !media.matches) {
      moving = true;
      gsap.to(camera.position, { x: homePosition.x, y: homePosition.y, z: homePosition.z, duration: 0.65, ease: 'power2.inOut', onUpdate: () => { controls.update(); wake(); }, onComplete: () => { moving = false; wake(); } });
    } else { moving = false; camera.position.copy(homePosition); controls.update(); wake(); }
  }
  function setAssembled(next, animate = true, notify = true) {
    if (!ready || lost) return;
    assembled = next; pause();
    assembleButton.setAttribute('aria-pressed', String(next));
    assembleButton.innerHTML = icon('layers') + '<span>' + (next ? 'Tách lớp' : 'Lắp ghép') + '</span>';
    hero.querySelector('#assembly-mode').textContent = next ? 'Góc nhìn lắp ghép' : 'Góc nhìn tách lớp';
    hero.querySelector('#assembly-explanation').textContent = next ? 'Keo nằm tại mặt tiếp xúc giữa chip và tản nhiệt nhôm.' : 'Lớp keo được tách ra để quan sát vị trí tiếp xúc.';
    host.dataset.assembled = String(next);
    moving = true;
    gsap.to(state, { assembly: next ? 1 : 0, duration: media.matches || !animate ? 0 : 0.9, ease: 'power2.inOut', overwrite: true, onUpdate: wake, onComplete: () => { moving = false; wake(); } });
    if (notify) announce(next ? 'Đã lắp ghép. Keo tản nhiệt nằm giữa chip và tản nhiệt nhôm.' : 'Đã tách các lớp để quan sát keo tản nhiệt TS1001.');
  }
  function focusPaste() {
    setAssembled(false); resetView();
    hero.querySelector('#assembly-explanation').textContent = 'TS1001: lớp keo màu xám giữa chip và đế tản nhiệt nhôm.';
    announce('Keo tản nhiệt TS1001 được làm nổi bật ở lớp giữa. Độ dày được phóng đại để dễ quan sát.');
    host.scrollIntoView({ block: 'center', behavior: media.matches ? 'instant' : 'smooth' });
  }
  function release() {
    stop();
    if (camera) gsap.killTweensOf(camera.position);
    if (assembly) gsap.killTweensOf(assembly.root.rotation);
    gsap.killTweensOf(state); controls?.dispose(); resizeObserver?.disconnect(); visibilityObserver?.disconnect();
    const geometry = new Set(), materials = new Set();
    scene?.traverse(object => { if (object.geometry) geometry.add(object.geometry); if (object.material) materials.add(object.material); });
    const maps = new Set();
    materials.forEach(item => { if (item.roughnessMap) maps.add(item.roughnessMap); if (item.map) maps.add(item.map); });
    geometry.forEach(item => item.dispose()); materials.forEach(item => item.dispose()); maps.forEach(item => item.dispose());
    environment?.dispose(); pmrem?.dispose(); renderer?.dispose(); renderer?.domElement.remove(); renderer = null;
  }
  function fallbackView() {
    lost = true; release(); fallback.hidden = false;
    host.dataset.renderer = 'fallback'; hero.classList.add('assembly-scene-unavailable');
    host.dispatchEvent(new CustomEvent('hero-model-ready', { bubbles: true }));
    announce('Đang hiển thị sơ đồ keo tản nhiệt TS1001 nằm giữa chip và tản nhiệt nhôm.');
  }
  try {
    // Preserve the paused image for embedded browser compositors while rendering on demand.
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setClearColor(0, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.96;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.setAttribute('aria-hidden', 'true'); host.append(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-4, 4, 3, -3, 0.1, 50); camera.position.copy(homePosition);
    controls = new OrbitControls(camera, renderer.domElement);
    renderer.domElement.style.touchAction = 'pan-y pinch-zoom';
    controls.target.copy(target); controls.enablePan = false; controls.enableZoom = false; controls.enableDamping = false;
    controls.rotateSpeed = 0.65; controls.autoRotateSpeed = 1.1;
    controls.minPolarAngle = Math.PI / 4; controls.maxPolarAngle = Math.PI / 2.4; controls.update();
    controls.addEventListener('change', wake);
    controls.addEventListener('start', () => { gsap.killTweensOf(camera.position); moving = false; pause(); });
    controls.addEventListener('end', wake);
    RectAreaLightUniformsLib.init();
    pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment(); environment = pmrem.fromScene(room, 0.04); scene.environment = environment.texture; room.dispose();
    scene.add(new THREE.HemisphereLight(0xdbf1f5, 0x173435, 0.95));
    const softbox = new THREE.RectAreaLight(0xffffff, 4.5, 6, 5); softbox.position.set(-3, 5, 5); softbox.lookAt(0, 1.2, 0); scene.add(softbox);
    const rim = new THREE.RectAreaLight(0x8ddde3, 4, 3, 4); rim.position.set(4, 3, -3); rim.lookAt(0, 1.3, 0); scene.add(rim);
    const key = new THREE.DirectionalLight(0xfff8ef, 1.8); key.position.set(-3, 6, 4); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = key.shadow.camera.bottom = -5; key.shadow.camera.right = key.shadow.camera.top = 5; key.shadow.camera.far = 20; key.shadow.normalBias = 0.025; scene.add(key);
    assembly = buildThermalAssembly(packageLabel('thermal')); scene.add(assembly.root);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ color: 0x000c14, opacity: 0.25 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.225; ground.receiveShadow = true; scene.add(ground);
    function resize() {
      if (lost || disposed) return;
      const { width, height } = host.getBoundingClientRect(); if (!width || !height) return;
      const aspect = width / height, view = getAssemblyViewHeight(aspect);
      const shift = aspect > 0.95 ? 0.48 : 0.25;
      camera.left = -view * aspect / 2 + shift; camera.right = view * aspect / 2 + shift;
      camera.top = view / 2; camera.bottom = -view / 2; camera.updateProjectionMatrix();
      renderer.setSize(width, height); wake();
    }
    listen(assembleButton, 'click', () => setAssembled(!assembled));
    listen(hero.querySelector('#focus-paste'), 'click', focusPaste); listen(hero.querySelector('#paste-hotspot'), 'click', focusPaste);
    listen(hero.querySelector('#view-reset'), 'click', () => { resetView(); announce('Đã trở về góc xem ban đầu.'); });
    listen(pauseButton, 'click', () => pause(autoRotate));
    listen(host.closest('.hero-slide'), 'hero-demo', event => {
      if (event.detail === 'reset') { setAssembled(false, false, false); resetView(false); pause(false); }
      else if (event.detail === 'assemble') setAssembled(true, true, false);
      else { pause(); gsap.killTweensOf(state); moving = false; }
    });
    for (const [id, direction] of [['view-left', -1], ['view-right', 1]]) listen(hero.querySelector('#' + id), 'click', () => {
      if (lost) return;
      pause(); moving = true;
      gsap.to(assembly.root.rotation, { y: assembly.root.rotation.y + direction * Math.PI / 6, duration: media.matches ? 0 : 0.55, ease: 'power2.inOut', overwrite: true, onUpdate: wake, onComplete: () => { moving = false; wake(); } });
      announce(direction < 0 ? 'Xoay sang trái 30 độ.' : 'Xoay sang phải 30 độ.');
    });
    listen(renderer.domElement, 'webglcontextlost', event => { event.preventDefault(); fallbackView(); });
    listen(document, 'visibilitychange', () => document.hidden ? stop() : wake());
    listen(media, 'change', () => { if (media.matches) { pause(); gsap.killTweensOf(state); state.assembly = assembled ? 1 : 0; moving = false; } wake(); });
    resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
    visibilityObserver = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; visible ? wake() : stop(); }, { threshold: 0.01 }); visibilityObserver.observe(host);
    ready = true; host.dataset.assembled = 'false'; pause(media.matches); resize(); wake();
  } catch { fallbackView(); }
  return () => { disposed = true; abort.abort(); release(); };
}
