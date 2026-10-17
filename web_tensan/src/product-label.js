import * as THREE from 'three';

export function packageLabel(kind) {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const ctx=canvas.getContext('2d'),thermal=kind==='thermal';
  ctx.fillStyle=thermal?'#079ba6':'#edf8f7';ctx.fillRect(0,0,1024,512);
  ctx.fillStyle=thermal?'#053947':'#009ea9';ctx.fillRect(0,0,1024,34);ctx.fillRect(0,438,1024,74);
  ctx.textAlign='center';ctx.fillStyle=thermal?'#ffffff':'#123b50';ctx.font='bold 48px sans-serif';ctx.fillText('TENSAN',512,111);
  ctx.font=`bold ${kind==='led'?116:91}px sans-serif`;ctx.fillStyle=thermal?'#ffffff':'#009da9';ctx.fillText(kind==='led'?'RTV':thermal?'TS1001':'TS-350',512,263);
  ctx.font='28px sans-serif';ctx.fillStyle=thermal?'#d7ffff':'#284c5b';ctx.fillText(kind==='led'?'SILICONE':thermal?'THERMAL GREASE':'SOLDER PASTE',512,325);
  ctx.fillStyle='#ffffff';ctx.font='23px sans-serif';ctx.fillText('TENSAN VIỆT NAM',512,484);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
