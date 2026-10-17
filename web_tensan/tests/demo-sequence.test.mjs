import test from 'node:test';
import assert from 'node:assert/strict';

function clock(){
  let now=0,id=0;const tasks=new Map();
  return {set(fn,delay){tasks.set(++id,{fn,at:now+delay});return id;},clear(id){tasks.delete(id);},tick(ms){const end=now+ms;while(true){const next=[...tasks.entries()].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;now=next[1].at;tasks.delete(next[0]);next[1].fn();}now=end;}};
}
test('3D rotates for three seconds, assembles, then changes slide',async()=>{
  const {createDemoSequence}=await import('../src/demo-sequence.js'),timer=clock(),events=[];
  const demo=createDemoSequence({reset:()=>events.push('rotate'),assemble:()=>events.push('assemble'),next:()=>events.push('next')},timer);
  demo.start(true);timer.tick(2999);assert.deepEqual(events,['rotate']);timer.tick(1);assert.deepEqual(events,['rotate','assemble']);timer.tick(1599);assert.equal(events.length,2);timer.tick(1);assert.equal(events.at(-1),'next');
});
test('2D advances after three seconds; stopping or restarting cancels old work',async()=>{
  const {createDemoSequence}=await import('../src/demo-sequence.js'),timer=clock(),events=[];
  const demo=createDemoSequence({reset:()=>events.push('reset'),assemble:()=>events.push('assemble'),next:()=>events.push('next')},timer);
  demo.start(false);timer.tick(3000);assert.deepEqual(events,['reset','next']);
  demo.start(true);timer.tick(3000);demo.stop();timer.tick(5000);assert.equal(events.at(-1),'assemble');
  demo.start(true);timer.tick(1000);demo.start(false);timer.tick(2999);assert.notEqual(events.at(-1),'next');timer.tick(1);assert.equal(events.at(-1),'next');
});
