import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildThermalAssembly, getAssemblyViewHeight } from '../src/thermal-assembly.js';

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
  for (const aspect of [0.72, 1, 1.5]) {
    const height = getAssemblyViewHeight(aspect);
    const camera = new THREE.OrthographicCamera(-height * aspect / 2, height * aspect / 2, height / 2, -height / 2, 0.1, 50);
    camera.position.set(6.4, 5.3, 7.2); camera.lookAt(0, 1.2, 0); camera.updateMatrixWorld();
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      root.rotation.y = angle;
      root.updateMatrixWorld(true);
      root.traverse(object => {
        if (!object.geometry) return;
        object.geometry.computeBoundingBox();
        const bounds = object.geometry.boundingBox;
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
          const point = new THREE.Vector3(x, y, z).applyMatrix4(object.matrixWorld).project(camera);
          assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1, `Clipped at aspect ${aspect}`);
        }
      });
    }
  }
});
