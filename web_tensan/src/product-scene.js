import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { buildProductModel, getProductViewHeight } from './product-models.js';
import { icon } from './icons.js';
import { packageLabel } from './product-label.js';

export function createProductScene(host) {
  const view=host.closest('.product-model-view'), kind=host.dataset.productScene;
  const media=matchMedia('(prefers-reduced-motion: reduce)'), abort=new AbortController();
  const on=(node,event,fn)=>node.addEventListener(event,fn,{signal:abort.signal});
  const play=view.querySelector('[data-model-play]'), fallback=host.querySelector('.product-model-fallback');
  const state={assembly:0};
  let renderer,scene,camera,controls,model,environment,pmrem,frame=0,lastTime=0,visible=false,disposed=false,lost=false,rendering=false;
  let auto=!media.matches, moving=false, assembled=false;
  function stop(){cancelAnimationFrame(frame);frame=0;lastTime=0;}
  function wake(){if(!frame&&!rendering&&renderer&&visible&&!document.hidden&&!disposed&&!lost)frame=requestAnimationFrame(render);}
  function syncPlay(){play.disabled=media.matches;play.setAttribute('aria-pressed',String(auto));play.setAttribute('aria-label',media.matches?'Thiết bị đang bật chế độ giảm chuyển động':auto?'Tạm dừng tự xoay':'Bật tự xoay mô hình');play.innerHTML=icon(auto?'pause':'play');}
  function pause(){auto=false;syncPlay();wake();}
  function labels(){
    for(const label of host.querySelectorAll('[data-model-label]')){
      const part=model.parts[label.dataset.modelLabel];if(!part)continue;
      const point=part.getWorldPosition(new THREE.Vector3()).project(camera);
      label.style.left=`${(point.x*.5+.5)*100}%`;label.style.top=`${(-point.y*.5+.5)*100}%`;
    }
  }
  function render(time){
    frame=0;if(!visible||document.hidden||disposed||lost)return;
    rendering=true;const delta=lastTime?Math.min((time-lastTime)/1000,.05):1/60;lastTime=time;
    controls.autoRotate=auto&&!media.matches&&!moving;controls.update(delta);
    model.setAssembly(state.assembly);scene.updateMatrixWorld();renderer.render(scene,camera);labels();
    fallback.hidden=true;host.dataset.renderer='webgl';rendering=false;
    if(controls.autoRotate||moving)wake();
  }
  function resize(){
    if(!renderer||lost)return;
    const {width,height}=host.getBoundingClientRect();if(!width||!height)return;
    const aspect=width/height,viewHeight=getProductViewHeight(aspect);
    camera.left=-viewHeight*aspect/2;camera.right=viewHeight*aspect/2;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;camera.updateProjectionMatrix();
    renderer.setSize(width,height);wake();
  }
  function release(){
    stop();gsap.killTweensOf(state);controls?.dispose();
    const geometries=new Set(),materials=new Set(),textures=new Set();
    scene?.traverse(node=>{if(node.geometry)geometries.add(node.geometry);if(node.material)materials.add(node.material);});
    materials.forEach(mat=>{if(mat.map)textures.add(mat.map);if(mat.roughnessMap)textures.add(mat.roughnessMap);});
    geometries.forEach(item=>item.dispose());materials.forEach(item=>item.dispose());textures.forEach(item=>item.dispose());
    environment?.dispose();pmrem?.dispose();renderer?.dispose();renderer?.domElement.remove();renderer=null;
  }
  function failed(){lost=true;release();fallback.hidden=false;host.dataset.renderer='fallback';view.classList.add('product-model-unavailable');view.querySelector('[data-model-status]').textContent='Mô hình 3D chưa khả dụng. Đang hiển thị hình minh họa tham chiếu.';}
  function init(){
    try{
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.style.touchAction='pan-y pinch-zoom';host.append(renderer.domElement);
      scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-4,4,3,-3,.1,40);camera.position.set(4.7,3.6,7.5);
      controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.1,0);controls.enablePan=false;controls.enableZoom=false;controls.enableDamping=false;controls.rotateSpeed=.65;controls.autoRotateSpeed=1.1;controls.minPolarAngle=Math.PI/4;controls.maxPolarAngle=Math.PI/2.3;controls.update();controls.addEventListener('change',wake);controls.addEventListener('start',pause);
      pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.55;room.dispose();
      scene.add(new THREE.HemisphereLight('#efffff','#3a5965',.9));
      const key=new THREE.DirectionalLight('#fff4da',1.8);key.position.set(-3,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=key.shadow.camera.bottom=-4;key.shadow.camera.right=key.shadow.camera.top=4;key.shadow.normalBias=.02;scene.add(key);
      const rim=new THREE.DirectionalLight('#97ebf3',1.1);rim.position.set(4,4,-3);scene.add(rim);
      model=buildProductModel(kind,packageLabel(kind));scene.add(model.root);
      on(renderer.domElement,'webglcontextlost',event=>{event.preventDefault();failed();});resize();wake();
    }catch{failed();}
  }
  on(play,'click',()=>{auto=!auto&&!media.matches;syncPlay();wake();});
  on(view.querySelector('[data-model-assemble]'),'click',event=>{
    if(!model||lost)return;pause();assembled=!assembled;moving=true;
    const button=event.currentTarget;button.setAttribute('aria-pressed',String(assembled));button.innerHTML=icon('layers')+`<span>${assembled?'Tách lớp':'Lắp ghép'}</span>`;
    gsap.to(state,{assembly:assembled?1:0,duration:media.matches?0:.9,ease:'power2.inOut',overwrite:true,onUpdate:wake,onComplete:()=>{moving=false;wake();}});
    view.querySelector('[data-model-status]').textContent=assembled?'Đã lắp ghép mô hình.':'Đã tách các lớp để quan sát vật liệu.';
  });
  on(view.querySelector('[data-model-reset]'),'click',()=>{
    if(!model||lost)return;pause();camera.position.set(4.7,3.6,7.5);controls.update();wake();
  });
  for(const [key,direction] of [['left',-1],['right',1]])on(view.querySelector(`[data-model-${key}]`),'click',()=>{
    if(!model||lost)return;pause();const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),direction*Math.PI/6);camera.position.copy(offset.add(controls.target));controls.update();wake();
  });
  on(document,'visibilitychange',()=>document.hidden?stop():wake());
  on(media,'change',()=>{if(media.matches){pause();gsap.killTweensOf(state);moving=false;state.assembly=assembled?1:0;}syncPlay();wake();});
  const size=new ResizeObserver(resize);size.observe(host);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){if(!renderer&&!lost)init();wake();}else stop();},{threshold:.01});observer.observe(host);
  syncPlay();
  return ()=>{disposed=true;abort.abort();observer.disconnect();size.disconnect();release();};
}
