import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('contact phone HTML pattern is valid under browser v rules and rejects non-phone input',()=>{
  const template=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  const sourcePattern=template.match(/id="contact-phone"[^>]*pattern="([^"]+)"/)[1];
  // Evaluate the literal exactly as main.js does, including JavaScript escape processing.
  const renderedPattern=Function('return `'+sourcePattern+'`;')();
  const pattern=new RegExp(`^(?:${renderedPattern})$`,'v');
  assert.equal(pattern.test('abc'),false);
  assert.equal(pattern.test('1234'),false);
  assert.equal(pattern.test('        '),false);
  assert.equal(pattern.test('0903 007 095'),true);
  assert.equal(pattern.test('+84 903 007 095'),true);
});
