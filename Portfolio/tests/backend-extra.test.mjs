import test from 'node:test';
import assert from 'node:assert/strict';
import {bodyJson,ApiError} from '../worker/security.js';
import {publicDocument} from '../worker/content.js';
import {createDocument} from '../src/admin-model.js';
test('JSON streaming limit rejects oversized bodies without relying on content length',async()=>{const req=new Request('https://test/api',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"text":"'+'x'.repeat(100)+'"}'});await assert.rejects(()=>bodyJson(req,20),e=>e instanceof ApiError&&e.status===413);});
test('published config drops disabled block/private project fields and unrelated keys',()=>{const doc=createDocument();doc.site.secret='private';doc.projects[0].secret='private';doc.projects[0].privateClient=true;doc.projects[0].clientName='private';doc.sections[0].enabled=false;doc.sections[1].props.secret='private';const pub=publicDocument(doc);assert.equal(pub.sections.length,5);assert.equal(pub.site.secret,undefined);assert.equal(pub.projects[0].secret,undefined);assert.equal(pub.projects[0].clientName,undefined);assert.equal(pub.sections[0].props.secret,undefined);});
