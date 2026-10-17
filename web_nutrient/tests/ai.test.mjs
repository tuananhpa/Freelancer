import test from 'node:test';
import assert from 'node:assert/strict';
import { gemini } from '../worker/ai.mjs';
import { encryptSecret } from '../worker/security.mjs';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';

test('model migration upgrades obsolete default and preserves encrypted key and custom models',()=>{
 const db=new DatabaseSync(':memory:');
 try {
  db.exec(readFileSync(new URL('../migrations/0001_initial.sql',import.meta.url),'utf8'));
  db.prepare('INSERT INTO integrations VALUES(?,?,?,?)').run('gemini','encrypted-unchanged','gemini-2.5-flash','2026-10-15');
  db.prepare('INSERT INTO integrations VALUES(?,?,?,?)').run('custom','other-encrypted','gemini-custom','2026-10-15');
  for(const name of readdirSync(new URL('../migrations/',import.meta.url)).filter(n=>n.endsWith('.sql')&&n!=='0001_initial.sql').sort()) db.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
  assert.equal(db.prepare("SELECT model FROM integrations WHERE id='gemini'").get().model,'gemini-3.8-flash');
  assert.equal(db.prepare("SELECT ciphertext FROM integrations WHERE id='gemini'").get().ciphertext,'encrypted-unchanged');
  assert.equal(db.prepare("SELECT model FROM integrations WHERE id='custom'").get().model,'gemini-custom');
 }finally{db.close();}
});

test('retired Gemini model gives actionable error without exposing provider details or key', async () => {
  const root=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const key='private-test-key';
  const ciphertext=await encryptSecret(key,root);
  const env={ENCRYPTION_KEY:root,DB:{prepare:()=>({first:async()=>({ciphertext,model:'retired-model'})})}};
  const original=globalThis.fetch;
  globalThis.fetch=async()=>Response.json({error:{message:'Secret '+key,status:'NOT_FOUND'}},{status:404});
  try {
    await assert.rejects(gemini(env,'test'),e=>e.status===502 && /model.*không còn khả dụng/i.test(e.message) && !e.message.includes(key));
  } finally { globalThis.fetch=original; }
});
