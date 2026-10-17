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
  return Math.max(5.6, 6.4 / aspect);
}

export function buildThermalAssembly() {
  const root = new THREE.Group();
  const parts = Object.fromEntries(['board', 'chip', 'paste', 'heatsink'].map(id => [id, new THREE.Group()]));
  Object.entries(parts).forEach(([id, group]) => { group.name = id; root.add(group); });
  const mat = (color, roughness = 0.5, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const green = mat(0x164b46, 0.52, 0.15), black = mat(0x192428, 0.48);
  const silver = mat(0xb2c1cb, 0.26, 0.9), pins = mat(0xc6b581, 0.38, 0.72);
  const solder = mat(0xa8bcbd, 0.34, 0.7), ceramic = mat(0xb2a68a, 0.65);
  const cream = new THREE.MeshPhysicalMaterial({ color: 0xd4d1c8, roughness: 0.65, metalness: 0, clearcoat: 0.12 });
  function box(group, width, height, depth, material, x = 0, y = 0, z = 0, radius = 0.025) {
    const object = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 2, Math.min(radius, height / 3, width / 3)), material);
    object.position.set(x, y, z); object.castShadow = true; object.receiveShadow = true; group.add(object); return object;
  }
  box(parts.board, 3.9, 0.095, 2.75, green, 0, 0, 0, 0.045);
  const traceMaterial = new THREE.LineBasicMaterial({ color: 0x528b75, transparent: true, opacity: 0.6 });
  const traces = [];
  for (let i = 0; i < 32; i++) {
    const side = i % 2 ? 1 : -1, x = -1.7 + (i % 16) * 0.22;
    const points = [new THREE.Vector3(x, 0.052, side * 1.25), new THREE.Vector3(x, 0.052, side * 0.89), new THREE.Vector3(x * 0.43, 0.052, side * 0.57)];
    traces.push(points[0], points[1], points[1], points[2]);
  }
  parts.board.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(traces), traceMaterial));
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const z = -0.92 + i * 0.46, x = side * 1.35;
      box(parts.board, 0.52, 0.14, 0.29, black, x, 0.13, z, 0.018);
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
  }
  for (const [x, z] of [[0.8, -0.95], [0.5, -0.95], [-0.8, 0.93]]) {
    const capacitor = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.29, 32), solder);
    capacitor.position.set(x, 0.2, z); parts.board.add(capacitor);
  }
  box(parts.chip, 1.44, 0.13, 1.35, black, 0, 0.14, 0, 0.035);
  for (let i = 0; i < 20; i++) for (const side of [-1, 1]) {
    box(parts.chip, 0.038, 0.035, 0.16, pins, -0.65 + i * 0.068, 0.09, side * 0.72, 0.004);
    box(parts.chip, 0.16, 0.035, 0.038, pins, side * 0.77, 0.09, -0.59 + i * 0.062, 0.004);
  }
  box(parts.chip, 1.15, 0.08, 1.07, silver, 0, 0.24, 0, 0.035);

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
  const grooveMaterial = mat(0xaaa79f, 0.7);
  for (let i = 0; i < 5; i++) {
    const points = Array.from({ length: 12 }, (_, n) => new THREE.Vector3(-0.43 + n * 0.078, 0.077, -0.36 + i * 0.17 + Math.sin(n * 0.5) * 0.026));
    parts.paste.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.012, 6, false), grooveMaterial));
  }
  const outline = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(spread.getSpacedPoints(80).map(p => new THREE.Vector3(p.x * 1.1, -0.018, -p.y * 1.1))), new THREE.LineBasicMaterial({ color: 0x68e8e1, transparent: true, opacity: 0.9 }));
  parts.paste.add(outline);
  box(parts.heatsink, 2.50, 0.14, 2.08, silver, 0, 0.07, 0, 0.045);
  for (let i = 0; i < 17; i++) box(parts.heatsink, 0.055, 0.86, 2.01, silver, -1.13 + i * 0.141, 0.56, 0, 0.012);
  for (const x of [-1.08, 1.08]) for (const z of [-0.85, 0.85]) {
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.018, 24), solder);
    screw.position.set(x, -0.006, z); parts.heatsink.add(screw);
  }
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
  return { root, parts, flow, setAssembly };
}
