/* Tòa nhà 3D dựng lên theo tiến trình cuộn p (0..1): bản vẽ → móng → phần thô → hoàn thiện → bàn giao.
   Hình học tự dựng bằng Three.js (không tải mô hình ngoài). Chỉ vẽ lại khi p hoặc kích thước đổi. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const STEPS = [0, 0.16, 0.32, 0.6, 0.82];          // mốc bắt đầu mỗi giai đoạn
const S = (a, b, p) => { const t = Math.min(1, Math.max(0, (p - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

export function mountBuilding(box) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(1.5, devicePixelRatio));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  box.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0c1826, 60, 140);
  const cam = new THREE.PerspectiveCamera(36, 1, 0.5, 400);

  scene.add(new THREE.HemisphereLight(0xc9dcff, 0x20160c, 1.1));
  const sun = new THREE.DirectionalLight(0xffe0c0, 2.2);
  sun.position.set(26, 40, 22); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 120 });
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({ color: 0x14212f, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(120, 60, 0x5b9bff, 0x5b9bff);
  grid.material.transparent = true; grid.material.opacity = 0.18; grid.position.y = 0.02; scene.add(grid);

  const W = 16, D = 10, F = 6, H = 3.2;                      // mặt bằng 16 × 10 m, 6 tầng
  const concrete = new THREE.MeshStandardMaterial({ color: 0xa7a39b, roughness: 0.9 });
  const concreteDark = new THREE.MeshStandardMaterial({ color: 0x7d7a74, roughness: 0.95 });
  const anim = [];                                           // hàm (p) cập nhật từng phần tử
  const add = (mesh, fn) => { mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh); anim.push((p) => fn(mesh, p)); return mesh; };
  const grow = (a, b) => (m, p) => { const e = S(a, b, p); m.visible = e > 0.001; m.scale.y = Math.max(0.001, e); };
  const spread = (a, b) => (m, p) => { const e = S(a, b, p); m.visible = e > 0.001; m.scale.set(Math.max(0.001, e), 1, Math.max(0.001, e)); };
  const boxAt = (w, h, d, mat) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); return new THREE.Mesh(g, mat); };
  const cols = []; for (let x = -W / 2; x <= W / 2; x += 4) for (const z of [-D / 2, 0, D / 2]) cols.push([x, z]);

  /* 1. Bản vẽ: khung dây xanh "vẽ" dần từng tầng */
  const lineMat = new THREE.LineBasicMaterial({ color: 0x7fb2ff, transparent: true, opacity: 0 });
  const lines = [];
  for (let f = 0; f <= F; f++) {
    const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(W, f === F ? 0.8 : H, D));
    const l = new THREE.LineSegments(g, lineMat); l.position.y = 0.5 + f * H + (f === F ? 0.4 : H / 2); scene.add(l); lines.push(l);
  }
  cols.forEach(([x, z]) => { const l = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.5, F * H, 0.5)), lineMat); l.position.set(x, 0.5 + F * H / 2, z); scene.add(l); lines.push(l); });
  anim.push((p) => {
    lineMat.opacity = 0.9 * S(0, 0.06, p) * (1 - 0.85 * S(0.6, 0.8, p));
    lines.forEach((l, i) => { l.visible = p > (i / lines.length) * 0.14; });
  });

  /* 2. Móng: đài cọc rồi bè móng */
  cols.forEach(([x, z], i) => { const m = add(boxAt(1.8, 1.2, 1.8, concreteDark), grow(0.16 + i * 0.004, 0.22 + i * 0.004)); m.position.set(x, -0.7, z); });
  add(boxAt(W + 1.4, 0.5, D + 1.4, concrete), spread(0.22, 0.32));

  /* 3. Phần thô: cột từng tầng, rồi sàn trượt vào */
  const dt = 0.28 / F;
  for (let f = 0; f < F; f++) {
    const t = 0.32 + f * dt;
    cols.forEach(([x, z]) => { const c = add(boxAt(0.55, H - 0.3, 0.55, concrete), grow(t, t + dt * 0.55)); c.position.set(x, 0.5 + f * H, z); });
    const slab = add(boxAt(W + 0.8, 0.3, D + 0.8, concrete), spread(t + dt * 0.45, t + dt)); slab.position.y = 0.5 + (f + 1) * H - 0.3;
  }

  /* 4. Hoàn thiện: vách kính + lam gỗ + tường đầu hồi theo từng tầng */
  const glassMats = [];
  const wood = new THREE.MeshStandardMaterial({ color: 0xb8692f, roughness: 0.7 });
  const wall = new THREE.MeshStandardMaterial({ color: 0xece7df, roughness: 0.85 });
  for (let f = 0; f < F; f++) {
    const t = 0.6 + f * 0.035, y = 0.5 + f * H;
    const gm = new THREE.MeshStandardMaterial({ color: 0x7fa7c9, roughness: 0.08, metalness: 0.5, transparent: true, opacity: 0, emissive: 0xffb066, emissiveIntensity: 0 });
    glassMats.push(gm);
    for (const z of [-D / 2, D / 2]) { const g = add(boxAt(W - 0.6, H - 0.3, 0.12, gm), (m, p) => { const e = S(t, t + 0.05, p); m.visible = e > 0; gm.opacity = 0.35 + 0.5 * e; m.position.y = y + (1 - e) * 1.5; }); g.position.set(0, y, z); }
    for (const x of [-W / 2, W / 2]) { const w = add(boxAt(0.25, H - 0.3, D - 0.4, wall), (m, p) => { const e = S(t, t + 0.05, p); m.visible = e > 0; m.scale.y = Math.max(0.001, e); }); w.position.set(x, y, 0); }
    for (let x = -W / 2 + 1; x < W / 2; x += 1.6) { const fin = add(boxAt(0.18, H, 0.5, wood), grow(t + 0.02, t + 0.07)); fin.position.set(x, y, D / 2 + 0.45); }
  }
  const roof = add(boxAt(W + 1.2, 0.9, D + 1.2, wall), spread(0.8, 0.84)); roof.position.y = 0.5 + F * H;

  /* Cần cẩu tháp: dựng khi bắt đầu phần thô, cần quay theo cuộn, tháo khi bàn giao */
  const yellow = new THREE.MeshStandardMaterial({ color: 0xf2b705, roughness: 0.6 });
  const crane = new THREE.Group(); crane.position.set(W / 2 + 5, 0, -D / 2 - 3); scene.add(crane);
  const mastH = F * H + 10;
  const mast = boxAt(1, mastH, 1, yellow); mast.castShadow = true; crane.add(mast);
  const jib = new THREE.Group(); jib.position.y = mastH; crane.add(jib);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(24, 0.7, 0.7), yellow); arm.position.x = -7; arm.castShadow = true; jib.add(arm);
  const cw = new THREE.Mesh(new THREE.BoxGeometry(2, 1.6, 1.4), concreteDark); cw.position.set(4.5, -0.6, 0); jib.add(cw);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), new THREE.MeshStandardMaterial({ color: 0xffffff })); cab.position.set(0.9, -1, 0); jib.add(cab);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 8), new THREE.MeshBasicMaterial({ color: 0x222222 })); cable.position.set(-14, -4, 0); jib.add(cable);
  const hook = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 1.6), concrete); hook.position.set(-14, -8.2, 0); jib.add(hook);
  anim.push((p) => { const e = S(0.28, 0.36, p) * (1 - S(0.84, 0.92, p)); crane.visible = e > 0.001; crane.scale.set(1, Math.max(0.001, e), 1); jib.rotation.y = 0.6 + p * 5.5; });

  /* 5. Bàn giao: đèn trong nhà sáng, cây xanh mọc */
  const leaf = new THREE.MeshStandardMaterial({ color: 0x3f8f4e, roughness: 0.9 });
  const trunk = new THREE.MeshStandardMaterial({ color: 0x5a3b22 });
  [[-12, 9], [-6, 10], [0, 10.5], [6, 10], [12, 9], [-13, -2], [13, 2]].forEach(([x, z], i) => {
    const t = new THREE.Group(); t.position.set(x, 0, z); scene.add(t);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.6), trunk); tr.position.y = 0.8; t.add(tr);
    const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 0), leaf); cr.position.y = 2.2; cr.castShadow = true; t.add(cr);
    anim.push((p) => { const e = S(0.84 + i * 0.012, 0.9 + i * 0.012, p); t.visible = e > 0.001; t.scale.setScalar(Math.max(0.001, e)); });
  });
  anim.push((p) => { const e = S(0.86, 0.96, p); glassMats.forEach((m, i) => { m.emissiveIntensity = e * (i % 2 ? 0.55 : 0.8); }); sun.intensity = 2.2 - e * 1.2; box.style.setProperty('--dusk', e.toFixed(3)); });

  /* Camera bay vòng quanh công trình */
  let w = 0, h = 0, last = -1;
  const resize = () => {
    w = box.clientWidth; h = box.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); last = -1;
  };
  new ResizeObserver(() => { resize(); update(cur); }).observe(box);
  let cur = 0;
  function update(p) {
    cur = p; if (!w) resize(); if (Math.abs(p - last) < 0.0005) return; last = p;
    anim.forEach((fn) => fn(p));
    const k = cam.aspect < 1 ? 1.75 : 1, wide = cam.aspect > 1.2 ? -6 : 0;   // màn dọc lùi xa hơn; màn ngang đẩy nhà sang phải
    const th = -0.85 + p * 1.5, R = lerp(62, 54, S(0.2, 0.7, p)) + S(0.8, 1, p) * 8;
    cam.position.set(Math.sin(th) * R * k, lerp(26, 14, S(0, 0.8, p)) + S(0.85, 1, p) * 3, Math.cos(th) * R * k);
    cam.lookAt(new THREE.Vector3(Math.cos(th) * wide, lerp(6, 10, S(0.3, 0.8, p)), -Math.sin(th) * wide));
    renderer.render(scene, cam);
  }
  return update;
}
