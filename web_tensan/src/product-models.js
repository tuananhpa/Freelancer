import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeStaticMeshes } from './thermal-assembly.js';

export function getProductViewHeight(aspect) {
  if(!Number.isFinite(aspect)||aspect<=0)throw new RangeError('Invalid viewport aspect');
  return Math.max(5.5,6.1/aspect);
}

export function buildProductModel(kind, labelTexture) {
  if (!['led', 'solder'].includes(kind)) throw new RangeError('Unknown product model');
  const root = new THREE.Group(), parts = {};
  const material = (color, metalness = 0, roughness = .36) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const silver = material('#a7b9c2', .88, .27), white = material('#d8e3e6', .05, .28), teal = material('#00a8b4', .28, .24);
  const dark = material('#142931', .5), gold = material('#dbb75a', .75), pcb = material('#185e50', .25);
  const glow = new THREE.MeshStandardMaterial({ color:'#ffe1a0', emissive:'#ffbe4b', emissiveIntensity:1.25 });
  const silicone = material('#afc5c3', .04, .3);
  const grainData=new Uint8Array(64*64*4);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const shade=195+Math.round(22*Math.sin(x*13.1+y*.07));grainData.set([shade,shade,shade,255],(y*64+x)*4);}
  const grain=new THREE.DataTexture(grainData,64,64,THREE.RGBAFormat);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(2,5);grain.needsUpdate=true;silver.roughnessMap=grain;
  function mesh(parent, geometry, mat, x=0,y=0,z=0) {
    const node = new THREE.Mesh(geometry, mat); node.position.set(x,y,z); node.castShadow = true; node.receiveShadow = true; parent.add(node); return node;
  }
  const box = (p,w,h,d,m,x,y,z,r=.02) => mesh(p,new RoundedBoxGeometry(w,h,d,2,r),m,x,y,z);
  const cylinder = (p,r,h,m,x,y,z,segments=64) => mesh(p,new THREE.CylinderGeometry(r,r,h,segments),m,x,y,z);
  const ring = (p,r,t,m,x,y,z) => { const node=mesh(p,new THREE.TorusGeometry(r,t,10,64),m,x,y,z); node.rotation.x=Math.PI/2;return node; };
  const pedestal = new THREE.Group(); root.add(pedestal);
  cylinder(pedestal,2.65,.13,silver,0,.065,0,96);
  cylinder(pedestal,2.58,.035,white,0,.15,0,96);
  ring(pedestal,2.59,.012,teal,0,.14,0);
  const pack = new THREE.Group(); pack.position.set(-1.32,.18,.25); root.add(pack); parts.package = pack;
  if (kind === 'led') {
    cylinder(pack,.43,2.55,white,0,1.275,0);
    cylinder(pack,.44,.1,white,0,.07,0); cylinder(pack,.44,.12,white,0,2.52,0);
    ring(pack,.435,.016,teal,0,.55,0); ring(pack,.435,.016,teal,0,2.05,0);
    mesh(pack,new THREE.CylinderGeometry(.1,.18,.18,48),white,0,2.66,0);
    mesh(pack,new THREE.CylinderGeometry(.04,.09,.37,48),white,0,2.93,0);
  } else {
    cylinder(pack,.65,1.2,teal,0,.64,0);
    cylinder(pack,.67,.19,teal,0,1.32,0); ring(pack,.63,.035,teal,0,.11,0);
    for(let i=0;i<54;i++){const a=i*Math.PI*2/54;box(pack,.027,.15,.035,teal,Math.sin(a)*.665,1.32,Math.cos(a)*.665,.006);}
    cylinder(pack,.63,.035,teal,0,1.435,0);
  }
  if(labelTexture) {
    const mat=new THREE.MeshStandardMaterial({map:labelTexture,roughness:.5});
    const label=mesh(pack,new THREE.CylinderGeometry(kind==='led'?.435:.655,kind==='led'?.435:.655,kind==='led'?1.43:.87,96,1,true),mat,0,kind==='led'?1.3:.67,0);
    label.rotation.y=Math.PI;
  }
  if(kind==='led') {
    const housing = new THREE.Group(); housing.position.set(1.05,.37,0); root.add(housing); parts.housing=housing;
    cylinder(housing,.9,.37,silver,0,.19,0); cylinder(housing,.77,.025,dark,0,.39,0);
    for(let i=0;i<40;i++){const a=i*Math.PI*2/40;const fin=box(housing,.035,.42,.17,silver,Math.sin(a)*.91,.13,Math.cos(a)*.91,.007);fin.rotation.y=a;}
    const board=new THREE.Group();board.position.set(1.05,1.08,0);root.add(board);parts.ledBoard=board;
    cylinder(board,.79,.045,white,0,0,0);ring(board,.7,.007,gold,0,.026,0);
    for(let i=0;i<24;i++){const a=i*Math.PI*2/24;const x=Math.sin(a)*.64,z=Math.cos(a)*.64;box(board,.11,.035,.085,gold,x,.04,z,.008);box(board,.077,.01,.053,glow,x,.064,z,.004);}
    cylinder(board,.1,.08,dark,0,.05,0);
    for(const x of [-.18,.18])box(board,.1,.025,.07,silver,x,.035,0);
    const bead = new THREE.Group();bead.position.set(1.05,1.48,0);root.add(bead);parts.silicone=bead;
    ring(bead,.75,.035,silicone,0,0,0);
    const diffuser = new THREE.Group();diffuser.position.set(1.05,1.85,0);root.add(diffuser);parts.diffuser=diffuser;
    const glass=new THREE.MeshPhysicalMaterial({color:'#e5f6f5',roughness:.14,metalness:0,transparent:true,opacity:.52,depthWrite:false});
    cylinder(diffuser,.82,.075,glass,0,0,0);ring(diffuser,.82,.018,white,0,0,0);
    const bezel=new THREE.Group();bezel.position.set(1.05,2.37,0);root.add(bezel);parts.bezel=bezel;
    const shape=new THREE.Shape();shape.absarc(0,0,.99,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,.77,0,Math.PI*2,true);shape.holes.push(hole);
    const geo=new THREE.ExtrudeGeometry(shape,{depth:.09,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.018,bevelThickness:.012,curveSegments:64});geo.rotateX(-Math.PI/2);mesh(bezel,geo,white);
    for(const side of [-1,1]){box(bezel,.09,.22,.23,silver,side*.94,.01,0);box(bezel,.23,.04,.2,silver,side*1.03,.13,0);}
    const strip=new THREE.Group();root.add(strip);
    for(let i=0;i<32;i++){const a=-.6+i*.061;const x=Math.sin(a)*2.06,z=-Math.cos(a)*1.6;const segment=box(strip,.11,.025,.11,white,x,.24,z,.007);segment.rotation.y=a;box(strip,.055,.026,.048,glow,x,.27,z,.006);}
  } else {
    const board=new THREE.Group();board.position.set(1,.26,0);root.add(board);parts.board=board;
    box(board,2.5,.08,2.2,pcb,0,0,0);
    for(let row=0;row<5;row++)for(let col=0;col<6;col++){
      const x=-.88+col*.35,z=-.72+row*.35;
      box(board,.19,.016,.15,silver,x,.055,z,.012);
      if((row+col)%3===0)box(board,.13,.028,.095,dark,x,.079,z,.012);
    }
    const traces=[];for(let i=0;i<10;i++){const x=-1+i*.21;traces.push(new THREE.Vector3(x,.043,-.88),new THREE.Vector3(x+.13,.043,.88));}
    board.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(traces),new THREE.LineBasicMaterial({color:'#54a18a'})));
    for(const side of [-1,1]){
      for(let i=0;i<8;i++){const x=-.9+i*.26;box(board,.12,.05,.08,dark,x,.075,side*.98);for(const edge of [-1,1])box(board,.03,.018,.095,silver,x+edge*.075,.06,side*.98,.004);}
      for(const z of [-.91,.91]){ring(board,.045,.012,gold,side*1.12,.05,z);}
      cylinder(board,.055,.14,dark,side*1.12,.11,.53,20);cylinder(board,.052,.012,silver,side*1.12,.186,.53,20);
    }
    const stencil=new THREE.Group();stencil.position.set(1,1.02,0);root.add(stencil);parts.stencil=stencil;
    const shape=new THREE.Shape();shape.moveTo(-1.12,-.95);shape.lineTo(1.12,-.95);shape.lineTo(1.12,.95);shape.lineTo(-1.12,.95);shape.closePath();
    for(let row=0;row<5;row++)for(let col=0;col<6;col++){
      const x=-.88+col*.35,z=-.72+row*.35,w=.095,h=.075;
      const hole=new THREE.Path();hole.moveTo(x-w,z-h);hole.lineTo(x-w,z+h);hole.lineTo(x+w,z+h);hole.lineTo(x+w,z-h);hole.closePath();shape.holes.push(hole);
    }
    const stencilGeo=new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:false,steps:1});stencilGeo.rotateX(-Math.PI/2);mesh(stencil,stencilGeo,silver);
    for(const z of [-1,1])box(stencil,2.4,.09,.075,silver,0,.02,z,.015);
    const pasteMat=material('#b9bec3',.72,.32);
    for(let i=0;i<12;i++){const paste=mesh(stencil,new THREE.SphereGeometry(.1,14,10),pasteMat,-.75+i*.13,.065,.15);paste.scale.set(1,.35,1.2);}
    const tool=new THREE.Group();tool.position.set(1,1.37,.12);root.add(tool);parts.squeegee=tool;
    box(tool,1.7,.1,.12,dark,0,0,0);box(tool,1.62,.19,.035,silver,0,-.13,0);box(tool,.43,.19,.18,teal,0,.13,0);
    for(const x of [-.65,.65])cylinder(tool,.035,.04,silver,x,.075,0,16);
  }
  const exploded = Object.fromEntries(Object.entries(parts).map(([key,node])=>[key,node.position.y]));
  function setAssembly(progress) {
    const t=THREE.MathUtils.clamp(progress,0,1);
    if(kind==='led') {
      for(const [key,y] of Object.entries({ledBoard:.8,silicone:.86,diffuser:.94,bezel:1.03})) parts[key].position.y=THREE.MathUtils.lerp(exploded[key],y,t);
    } else {
      parts.stencil.position.y=THREE.MathUtils.lerp(exploded.stencil,.35,t);
      parts.squeegee.position.y=THREE.MathUtils.lerp(exploded.squeegee,.6,t);
      parts.squeegee.position.z=.12;
    }
  }
  for(const group of [pedestal,pack,...Object.values(parts).filter(node=>node!==pack)]) mergeStaticMeshes(group);
  // Batch the LED-strip geometry without merging the independently moving layers.
  mergeStaticMeshes(root.children.find(node=>node.isGroup&&!Object.values(parts).includes(node)&&node!==pedestal) || new THREE.Group());
  setAssembly(0);
  return {root,parts,setAssembly,glow};
}
