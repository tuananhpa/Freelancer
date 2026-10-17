import { gsap } from 'gsap';
import { icon } from './icons.js';

export function createBannerMotion(root) {
  const media=matchMedia('(prefers-reduced-motion: reduce)'), abort=new AbortController(), cleanups=[];
  for(const banner of root.querySelectorAll('[data-animated-banner]')) {
    let timeline,visible=false,paused=false;
    const button=banner.querySelector('.banner-animation-toggle');
    const context=gsap.context(()=>{
      timeline=gsap.timeline({paused:true});
      timeline.to('.motion-trace',{strokeDashoffset:-900,duration:5,ease:'none',repeat:-1},0);
      if(banner.dataset.animatedBanner==='factory') {
        timeline.to('.factory-rotor path',{rotation:360,transformOrigin:'50% 50%',duration:4,ease:'none',repeat:-1},0);
        timeline.to('.factory-status circle',{opacity:.25,duration:1.2,stagger:.4,repeat:-1,yoyo:true,ease:'sine.inOut'},0);
      } else timeline.fromTo('.smt-deposits circle',{scale:.65,opacity:.25,transformOrigin:'50% 50%'},{scale:1.22,opacity:.85,duration:1.2,stagger:.25,repeat:-1,yoyo:true,ease:'sine.inOut'},0);
    },banner);
    function sync(){
      const playing=!paused&&!media.matches;
      button.disabled=media.matches;button.setAttribute('aria-pressed',String(playing));button.setAttribute('aria-label',media.matches?'Thiết bị đang bật chế độ giảm chuyển động':playing?'Tạm dừng hoạt ảnh banner':'Bật hoạt ảnh banner');button.innerHTML=icon(playing?'pause':'play');
      if(playing&&visible&&!document.hidden)timeline.play();else timeline.pause();
    }
    button.addEventListener('click',()=>{paused=!paused;sync();},{signal:abort.signal});
    banner.addEventListener('hero-demo',event=>{paused=event.detail==='pause';if(event.detail==='reset')timeline.restart();sync();},{signal:abort.signal});
    media.addEventListener('change',sync,{signal:abort.signal});document.addEventListener('visibilitychange',sync,{signal:abort.signal});
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.01});observer.observe(banner);
    sync();cleanups.push(()=>{observer.disconnect();context.revert();});
  }
  return ()=>{abort.abort();cleanups.forEach(cleanup=>cleanup());};
}
