export function createDemoSequence({reset,assemble,next},timer={set:(fn,delay)=>setTimeout(fn,delay),clear:id=>clearTimeout(id)}) {
  let pending;
  function stop(){timer.clear(pending);pending=undefined;}
  function start(model){
    stop();reset();
    pending=timer.set(()=>{
      pending=undefined;
      if(model){assemble();pending=timer.set(()=>{pending=undefined;next();},1600);}
      else next();
    },3000);
  }
  return {start,stop};
}
