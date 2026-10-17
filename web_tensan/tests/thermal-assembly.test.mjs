import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildThermalAssembly, getAssemblyViewHeight } from '../src/thermal-assembly.js';

test('fan rotor clears the fin bank and stays inside its circular housing', () => {
  const { root, parts, fanRotor } = buildThermalAssembly();
  assert.ok(fanRotor, 'Cooling assembly is missing its fan');
  root.updateMatrixWorld(true);
  const center = fanRotor.getWorldPosition(new THREE.Vector3());
  const finTop = parts.heatsink.position.y + 1.11;
  fanRotor.traverse(object => {
    if (!object.geometry) return;
    const positions = object.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const point = new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld);
      assert.ok(point.y > finTop, 'Fan collides with fins');
      assert.ok(Math.hypot(point.x - center.x, point.z - center.z) < 0.85, 'Blade touches fan housing');
    }
  });
});

test('static components are batched for rotation without losing valid shaded geometry', () => {
  const { root } = buildThermalAssembly();
  let meshes = 0;
  root.traverse(object => {
    if (!object.isMesh) return;
    meshes++;
    assert.ok(object.geometry.attributes.normal);
    assert.ok(object.geometry.attributes.position.array.every(Number.isFinite));
  });
  assert.ok(meshes < 25, 'Hundreds of separate component draws make rotation needlessly expensive');
});

test('thermal grease remains between the chip and heatsink in both assembly states', () => {
  const { parts, setAssembly } = buildThermalAssembly();
  for (const progress of [0, 0.5, 1]) {
    setAssembly(progress);
    const chip = new THREE.Box3().setFromObject(parts.chip);
    const paste = new THREE.Box3().setFromObject(parts.paste);
    const sink = new THREE.Box3().setFromObject(parts.heatsink);
    assert.ok(paste.min.y >= chip.max.y - 0.005, 'Grease intersects the chip');
    assert.ok(sink.min.y >= paste.max.y - 0.005, 'Heatsink intersects the grease');
  }
  const chip = new THREE.Box3().setFromObject(parts.chip);
  const paste = new THREE.Box3().setFromObject(parts.paste);
  assert.ok(paste.min.y - chip.max.y < 0.04, 'Assembled grease does not contact chip');
});

test('the full exploded assembly fits narrow and desktop viewports while rotating', () => {
  const { root } = buildThermalAssembly();
  root.updateMatrixWorld(true);
  // Batched component bounds contain empty corners; project actual surface vertices.
  const unique = new Map();
  root.traverse(object => {
    if (!object.geometry) return;
    const positions = object.geometry.attributes.position;
    for (let index = 0; index < positions.count; index++) {
      const point = new THREE.Vector3().fromBufferAttribute(positions, index).applyMatrix4(object.matrixWorld);
      unique.set(point.toArray().map(value => value.toFixed(4)).join(','), point);
    }
  });
  for (const aspect of [0.72, 1, 1.5]) {
    const height = getAssemblyViewHeight(aspect);
    const shift = aspect > 0.95 ? 0.48 : 0.25;
    const camera = new THREE.OrthographicCamera(-height * aspect / 2 + shift, height * aspect / 2 + shift, height / 2, -height / 2, 0.1, 50);
    for (const polar of [Math.PI / 4, Math.PI / 2.4]) {
      camera.position.setFromSphericalCoords(10.47, polar, Math.atan2(6.4, 7.2)).add(new THREE.Vector3(0, 1.2, 0));
      camera.lookAt(0, 1.2, 0); camera.updateMatrixWorld();
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const rotation = new THREE.Matrix4().makeRotationY(angle);
        for (const vertex of unique.values()) {
          const point = vertex.clone().applyMatrix4(rotation).project(camera);
          assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1, `Clipped at aspect ${aspect}, polar ${polar}`);
        }
      }
    }
  }
});
