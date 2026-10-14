import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const options={cwd:'..',encoding:'utf8'};
const names=execFileSync('git',['diff','--cached','--name-only'],options).trim().split(/\r?\n/).filter(Boolean);
if(!names.length||names.some(n=>!n.startsWith('web_nutrient/')))throw new Error('Staging includes unexpected project paths.');
const forbidden=names.filter(n=>/(?:^|\/)(?:\.dev\.vars|\.local|\.wrangler|node_modules|dist)(?:\/|$)/.test(n));
if(forbidden.length)throw new Error('Private runtime files are staged.');
const vars=readFileSync('.dev.vars','utf8');
const secrets=Array.from(vars.matchAll(/([A-Z_]+)="([^"]+)"/g)).filter(([,name])=>/PASSWORD|ENCRYPTION_KEY|PRIVATE_KEY|JOB_TOKEN/.test(name)).map(([,name,value])=>({name,value}));
for(const name of names){
 const content=execFileSync('git',['show',':'+name],{cwd:'..',maxBuffer:20*1024*1024});
 for(const secret of secrets)if(content.includes(Buffer.from(secret.value)))throw new Error('A private value is staged in '+name);
 if(/AIza[\w-]{35}/.test(content.toString('utf8')))throw new Error('A provider credential pattern is staged in '+name);
}
console.log('Staging verified: '+names.length+' project files; no runtime data or configured secrets.');
