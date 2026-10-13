import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
for(const dir of ['src','scripts'])for(const file of readdirSync(dir).filter(f=>/\.(js|mjs)$/.test(f)))execFileSync(process.execPath,['--check',`${dir}/${file}`],{stdio:'inherit'});
console.log('All JavaScript syntax checks passed.');
