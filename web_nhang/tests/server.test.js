import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStaticServer } from '../scripts/serve.mjs';

test('preview serves only built files, supports deep links, rejects traversal and write methods',async()=>{
  const root=await mkdtemp(join(tmpdir(),'nhang-preview-'));
  await writeFile(join(root,'index.html'),'<h1>Vĩnh Thuận Phát</h1>');
  const server=createStaticServer(root);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(origin+'/')).status,200);
    const detail=await fetch(origin+'/san-pham/nhang-cay-dan-huong-20cm/');
    assert.match(await detail.text(),/Vĩnh Thuận Phát/);
    assert.equal((await fetch(origin+'/docs/CLIENT_BRIEF.md')).status,404);
    assert.equal((await fetch(origin+'/src/main.js')).status,404);
    assert.equal((await fetch(origin+'/%2e%2e%2fpackage.json')).status,403);
    assert.equal((await fetch(origin+'/.git/config')).status,403);
    assert.equal((await fetch(origin+'/missing.jpg')).status,404);
    assert.equal((await fetch(origin+'/',{method:'POST'})).status,405);
    assert.equal((await fetch(origin+'/',{method:'HEAD'})).status,200);
  } finally {await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true});}
});
