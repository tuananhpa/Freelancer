import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function mergeStaticMeshes(group) {
  const batches = new Map();
  for (const object of [...group.children]) {
    if (!object.isMesh) continue;
    object.updateMatrix();
    const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    geometry.applyMatrix4(object.matrix);
    if (!batches.has(object.material)) batches.set(object.material, []);
    batches.get(object.material).push(geometry);
    object.geometry.dispose(); group.remove(object);
  }
  for (const [material, geometries] of batches) {
    const object = new THREE.Mesh(mergeGeometries(geometries), material);
    object.castShadow = true; object.receiveShadow = true; group.add(object);
    geometries.forEach(geometry => geometry.dispose());
  }
}

export function getAssemblyViewHeight(aspect) {
  if (!Number.isFinite(aspect) || aspect <= 0) throw new RangeError('Invalid viewport aspect');
  return Math.max(5.3, 6.2 / aspect);
}

export function buildThermalAssembly() {
  const root = new THREE.Group();
  const parts = Object.fromEntries(['board', 'chip', 'paste', 'heatsink'].map(id => [id, new THREE.Group()]));
  Object.entries(parts).forEach(([id, group]) => { group.name = id; root.add(group); });
  const mat = (color, roughness = 0.5, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const green = new THREE.MeshPhysicalMaterial({ color: 0x083c39, roughness: 0.4, metalness: 0.12, clearcoat: 0.35 });
  const black = mat(0x141c22, 0.46), boardEdge = mat(0x182c2f, 0.5);
  const silver = mat(0xa9bac4, 0.42, 0.88), pins = mat(0xc6a66b, 0.34, 0.8);
  const copper = mat(0xbf7544, 0.3, 0.88), connector = mat(0xd9e1dc, 0.55);
  const solder = mat(0xa8bcbd, 0.34, 0.7), ceramic = mat(0xb2a68a, 0.65);
  const cream = new THREE.MeshPhysicalMaterial({ color: 0xaeb8b5, roughness: 0.62, metalness: 0, clearcoat: 0.12 });
  const grainData = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const offset = (y * 64 + x) * 4;
    const shade = 205 + Math.round(20 * Math.sin(x * 19.7 + y * 0.08) + 10 * Math.sin(y * 11.3));
    grainData.set([shade, shade, shade, 255], offset);
  }
  const grain = new THREE.DataTexture(grainData, 64, 64, THREE.RGBAFormat);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping; grain.repeat.set(2, 6); grain.needsUpdate = true;
  silver.roughnessMap = grain; copper.roughnessMap = grain;
  function box(group, width, height, depth, material, x = 0, y = 0, z = 0, radius = 0.025) {
    const object = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 2, Math.min(radius, height / 3, width / 3)), material);
    object.position.set(x, y, z); object.castShadow = true; object.receiveShadow = true; group.add(object); return object;
  }
  box(parts.board, 3.9, 0.095, 2.75, green, 0, 0, 0, 0.045);
  box(parts.board, 3.87, 0.018, 2.72, pins, 0, -0.047, 0, 0.025);
  box(parts.board, 3.9, 0.025, 2.75, boardEdge, 0, -0.067, 0, 0.025);
  const traceMaterial = new THREE.LineBasicMaterial({ color: 0x528b75, transparent: true, opacity: 0.6 });
  const traces = [];
  for (let i = 0; i < 32; i++) {
    const side = i % 2 ? 1 : -1, x = -1.7 + (i % 16) * 0.22;
    const points = [new THREE.Vector3(x, 0.052, side * 1.25), new THREE.Vector3(x, 0.052, side * 0.89), new THREE.Vector3(x * 0.43, 0.052, side * 0.57)];
    traces.push(points[0], points[1], points[1], points[2]);
  }
  parts.board.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(traces), traceMaterial));
  const silk = [], viaMaterial = pins;
  function silkBox(x, z, width, depth) {
    const corners = [[x - width / 2, z - depth / 2], [x + width / 2, z - depth / 2], [x + width / 2, z + depth / 2], [x - width / 2, z + depth / 2]];
    for (let i = 0; i < 4; i++) silk.push(new THREE.Vector3(corners[i][0], 0.056, corners[i][1]), new THREE.Vector3(corners[(i + 1) % 4][0], 0.056, corners[(i + 1) % 4][1]));
  }
  for (const side of [-1, 1]) for (let i = 0; i < 12; i++) {
    const via = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.007, 6, 12), viaMaterial);
    via.rotation.x = -Math.PI / 2; via.position.set(-1.5 + i * 0.27, 0.056, side * 0.79); parts.board.add(via);
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const z = -0.92 + i * 0.46, x = side * 1.35;
      box(parts.board, 0.52, 0.14, 0.29, black, x, 0.13, z, 0.018);
      silkBox(x, z, 0.61, 0.40);
      box(parts.board, 0.12, 0.003, 0.018, solder, x - 0.11, 0.202, z - 0.04, 0.001);
      box(parts.board, 0.19, 0.003, 0.012, solder, x - 0.07, 0.202, z + 0.02, 0.001);
      for (let p = 0; p < 5; p++) for (const edge of [-1, 1]) box(parts.board, 0.055, 0.05, 0.09, solder, x - 0.20 + p * 0.1, 0.082, z + edge * 0.18, 0.005);
    }
    for (let i = 0; i < 15; i++) {
      box(parts.board, 0.085, 0.016, 0.29, pins, -1.55 + i * 0.22, 0.055, side * 1.19, 0.005);
      box(parts.board, 0.065, 0.07, 0.11, ceramic, -1.55 + i * 0.22, 0.09, side * 0.94, 0.008);
    }
  }
  for (const x of [-1.7, 1.7]) for (const z of [-1.15, 1.15]) {
    const hole = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 8, 32), pins);
    hole.rotation.x = -Math.PI / 2; hole.position.set(x, 0.056, z); parts.board.add(hole);
    const standoff = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.15, 6), pins);
    standoff.position.set(x, -0.145, z); parts.board.add(standoff);
    const bore = new THREE.Mesh(new THREE.CircleGeometry(0.052, 20), black); bore.rotation.x = -Math.PI / 2; bore.position.set(x, 0.057, z); parts.board.add(bore);
  }
  for (const [x, z] of [[0.8, -0.95], [0.5, -0.95], [-0.8, 0.93]]) {
    const capacitor = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.29, 32), black);
    capacitor.position.set(x, 0.2, z); parts.board.add(capacitor);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.018, 32), solder);
    cap.position.set(x, 0.352, z); parts.board.add(cap);
    const vent = box(parts.board, 0.12, 0.002, 0.009, black, x, 0.362, z, 0.001); vent.rotation.y = Math.PI / 4;
    const cross = box(parts.board, 0.12, 0.002, 0.009, black, x, 0.362, z, 0.001); cross.rotation.y = -Math.PI / 4;
  }
  box(parts.board, 1.2, 0.11, 0.29, black, -0.22, 0.11, -1.14, 0.012);
  for (let i = 0; i < 7; i++) for (const z of [-1.22, -1.08]) box(parts.board, 0.035, 0.22, 0.035, pins, -0.71 + i * 0.16, 0.24, z, 0.004);
  box(parts.board, 0.28, 0.25, 0.64, connector, 1.79, 0.2, 0, 0.025);
  for (let i = 0; i < 4; i++) box(parts.board, 0.16, 0.018, 0.09, black, 1.79, 0.329, -0.22 + i * 0.145, 0.005);
  for (const side of [-1, 1]) for (let i = 0; i < 2; i++) {
    const x = side * 0.81, z = -0.36 + i * 0.65;
    box(parts.board, 0.2, 0.14, 0.24, boardEdge, x, 0.14, z, 0.02);
    box(parts.board, 0.15, 0.01, 0.15, black, x, 0.216, z, 0.012);
    silkBox(x, z, 0.28, 0.30);
  }
  parts.board.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(silk), new THREE.LineBasicMaterial({ color: 0xa6c0b6, transparent: true, opacity: 0.45 })));
  box(parts.chip, 1.44, 0.13, 1.35, black, 0, 0.14, 0, 0.035);
  for (let i = 0; i < 20; i++) for (const side of [-1, 1]) {
    box(parts.chip, 0.038, 0.035, 0.16, pins, -0.65 + i * 0.068, 0.09, side * 0.72, 0.004);
    box(parts.chip, 0.16, 0.035, 0.038, pins, side * 0.77, 0.09, -0.59 + i * 0.062, 0.004);
  }
  box(parts.chip, 1.15, 0.08, 1.07, silver, 0, 0.24, 0, 0.035);
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) box(parts.chip, 0.075, 0.03, 0.04, ceramic, -0.48 + i * 0.19, 0.222, side * 0.61, 0.006);

  // An irregular spread with rounded edges reads as grease, rather than a rigid thermal pad.
  const spread = new THREE.Shape();
  spread.moveTo(-0.47, -0.49); spread.bezierCurveTo(-0.60, -0.46, -0.55, -0.18, -0.56, 0.05);
  spread.bezierCurveTo(-0.55, 0.31, -0.57, 0.50, -0.37, 0.51);
  spread.bezierCurveTo(-0.03, 0.48, 0.29, 0.55, 0.48, 0.47);
  spread.bezierCurveTo(0.56, 0.33, 0.50, 0.02, 0.54, -0.31);
  spread.bezierCurveTo(0.56, -0.56, 0.25, -0.50, 0.05, -0.52);
  spread.bezierCurveTo(-0.20, -0.50, -0.33, -0.55, -0.47, -0.49);
  const pasteMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(spread, { depth: 0.05, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: 0.025, bevelThickness: 0.025, curveSegments: 16 }), cream);
  pasteMesh.rotation.x = -Math.PI / 2; pasteMesh.castShadow = true; parts.paste.add(pasteMesh);
  const grooveMaterial = mat(0x929f9b, 0.68);
  for (let i = 0; i < 5; i++) {
    const points = Array.from({ length: 12 }, (_, n) => new THREE.Vector3(-0.43 + n * 0.078, 0.077, -0.36 + i * 0.17 + Math.sin(n * 0.5) * 0.026));
    parts.paste.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.012, 6, false), grooveMaterial));
  }
  const outline = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(spread.getSpacedPoints(80).map(p => new THREE.Vector3(p.x * 1.1, -0.018, -p.y * 1.1))), new THREE.LineBasicMaterial({ color: 0x68e8e1, transparent: true, opacity: 0.9 }));
  parts.paste.add(outline);
  box(parts.heatsink, 2.50, 0.14, 2.08, silver, 0, 0.07, 0, 0.045);
  box(parts.heatsink, 2.24, 0.045, 2.13, copper, 0, 0.035, 0, 0.012);
  for (let i = 0; i < 23; i++) {
    const finHeight = 0.70 + 0.27 * Math.sin(i / 22 * Math.PI);
    box(parts.heatsink, 0.043, finHeight, 1.80, silver, -1.13 + i * 0.103, 0.14 + finHeight / 2, 0, 0.009);
  }
  for (const side of [-1, 1]) {
    const path = [[side * 0.85, 0.20, -0.6], [side * 1.24, 0.23, -0.6], [side * 1.34, 0.42, -0.6], [side * 1.34, 0.82, -0.6], [side * 1.23, 1.03, -0.6], [side * 0.9, 1.03, -0.6]].map(point => new THREE.Vector3(...point));
    parts.heatsink.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path), 48, 0.046, 12, false), copper));
    box(parts.heatsink, 0.13, 0.065, 1.95, black, side * 1.25, 0.17, 0, 0.012);
  }
  for (const x of [-1.08, 1.08]) for (const z of [-0.85, 0.85]) {
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.065, 6), solder);
    screw.position.set(x, 0.185, Math.sign(z) * 0.96); parts.heatsink.add(screw);
    box(parts.heatsink, 0.055, 0.003, 0.01, black, x, 0.219, Math.sign(z) * 0.96, 0.001);
  }
  const fanFrame = new THREE.Shape();
  fanFrame.moveTo(-1.13, -0.98); fanFrame.lineTo(1.13, -0.98); fanFrame.lineTo(1.13, 0.98); fanFrame.lineTo(-1.13, 0.98); fanFrame.closePath();
  const aperture = new THREE.Path(); aperture.absarc(0, 0, 0.87, 0, Math.PI * 2, true); fanFrame.holes.push(aperture);
  const housing = new THREE.Mesh(new THREE.ExtrudeGeometry(fanFrame, { depth: 0.08, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.02, bevelThickness: 0.02, curveSegments: 48 }), black);
  housing.rotation.x = -Math.PI / 2; housing.position.y = 1.20; parts.heatsink.add(housing);
  for (const angle of [-Math.PI / 4, Math.PI / 4]) {
    const support = box(parts.heatsink, 1.83, 0.025, 0.045, black, 0, 1.16, 0, 0.008); support.rotation.y = angle;
  }
  const accent = new THREE.Mesh(new THREE.TorusGeometry(0.888, 0.012, 8, 96), new THREE.MeshBasicMaterial({ color: 0x6ebfba, transparent: true, opacity: 0.72 }));
  accent.rotation.x = -Math.PI / 2; accent.position.y = 1.302; parts.heatsink.add(accent);
  for (const x of [-0.97, 0.97]) for (const z of [-0.82, 0.82]) {
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.035, 6), solder);
    bolt.position.set(x, 1.31, z); parts.heatsink.add(bolt);
    box(parts.heatsink, 0.061, 0.002, 0.011, black, x, 1.329, z, 0.001);
  }
  const fanRotor = new THREE.Group(); fanRotor.position.y = 1.24; parts.heatsink.add(fanRotor);
  const fanMaterial = new THREE.MeshPhysicalMaterial({ color: 0x071216, roughness: 0.42, metalness: 0.12, clearcoat: 0.35, envMapIntensity: 0.4 });
  const blade = new THREE.Shape();
  blade.moveTo(0.18, -0.06); blade.bezierCurveTo(0.42, -0.12, 0.73, -0.33, 0.80, -0.16);
  blade.bezierCurveTo(0.84, 0.01, 0.68, 0.25, 0.32, 0.21); blade.bezierCurveTo(0.26, 0.13, 0.20, 0.06, 0.18, -0.06);
  for (let i = 0; i < 9; i++) {
    const geometry = new THREE.ExtrudeGeometry(blade, { depth: 0.018, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.006, bevelThickness: 0.006, curveSegments: 12 });
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.attributes.position;
    for (let vertex = 0; vertex < positions.count; vertex++) positions.setY(vertex, positions.getY(vertex) + positions.getZ(vertex) * 0.22);
    geometry.computeVertexNormals();
    const vane = new THREE.Mesh(geometry, fanMaterial); vane.rotation.y = i * Math.PI * 2 / 9; fanRotor.add(vane);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.23, 0.085, 64), black); hub.position.y = 0.025; fanRotor.add(hub);
  const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.012, 64), silver); hubCap.position.y = 0.074; fanRotor.add(hubCap);
  mergeStaticMeshes(fanRotor);
  const flow = new THREE.Group(); root.add(flow);
  for (const x of [-0.33, 0.33]) {
    const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, 0.38, 0.76), 0.55, 0x57bfc2, 0.1, 0.065);
    flow.add(arrow);
  }
  Object.values(parts).forEach(mergeStaticMeshes);
  function setAssembly(progress) {
    const value = THREE.MathUtils.clamp(progress, 0, 1);
    parts.paste.position.y = THREE.MathUtils.lerp(1.23, 0.315, value);
    parts.heatsink.position.y = THREE.MathUtils.lerp(2.08, 0.43, value);
    flow.visible = value < 0.4;
  }
  setAssembly(0);
  return { root, parts, flow, fanRotor, setAssembly };
}
