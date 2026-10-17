import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

for (const kind of ['led', 'solder']) test(`${kind} product is real bounded geometry with reversible assembly`, async () => {
  const { buildProductModel } = await import('../src/product-models.js');
  const model = buildProductModel(kind);
  let meshes = 0;
  model.root.traverse(node => {
    if (!node.isMesh) return;
    meshes++;
    assert.ok([...node.geometry.attributes.position.array].every(Number.isFinite));
  });
  assert.ok(meshes > 5 && meshes < 60);
  const part = kind === 'led' ? model.parts.diffuser : model.parts.stencil;
  model.setAssembly(0); const exploded = part.position.y;
  model.setAssembly(1); assert.ok(part.position.y < exploded);
  model.setAssembly(0); assert.equal(part.position.y, exploded);
  const bounds = new THREE.Box3().setFromObject(model.root);
  assert.ok(bounds.min.y >= -0.2);
  assert.ok(bounds.max.y < 4.5);
  assert.ok(bounds.max.x - bounds.min.x < 6.8);
});

for(const kind of ['led','solder']) test(`${kind} remains fully framed at all allowed camera elevations`,async()=>{
  const {buildProductModel,getProductViewHeight}=await import('../src/product-models.js');
  const model=buildProductModel(kind),target=new THREE.Vector3(0,1.1,0);
  for(const assembly of [0,1]){
    model.setAssembly(assembly);model.root.updateMatrixWorld(true);
    const unique=new Map();
    model.root.traverse(node=>{
      if(!node.geometry)return;
      const position=node.geometry.attributes.position;
      for(let i=0;i<position.count;i++){const p=new THREE.Vector3().fromBufferAttribute(position,i).applyMatrix4(node.matrixWorld);unique.set(p.toArray().map(v=>v.toFixed(4)).join(','),p);}
    });
    for(const aspect of [.65,1,1.5]){
      const height=getProductViewHeight(aspect),camera=new THREE.OrthographicCamera(-height*aspect/2,height*aspect/2,height/2,-height/2,.1,40);
      for(const polar of [Math.PI/4,Math.PI/2.3])for(let theta=0;theta<Math.PI*2;theta+=Math.PI/4){
        camera.position.setFromSphericalCoords(9,polar,theta).add(target);camera.lookAt(target);camera.updateMatrixWorld();
        for(const vertex of unique.values()){const p=vertex.clone().project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,`Clipped ${kind}, aspect${aspect}, polar${polar}`);}
      }
    }
  }
});
