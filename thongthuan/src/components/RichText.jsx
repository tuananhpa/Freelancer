import React from 'react';
function inline(text){return text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).map((part,i)=>part.startsWith('**')?<strong key={i}>{part.slice(2,-2)}</strong>:part.startsWith('_')?<em key={i}>{part.slice(1,-1)}</em>:part)}
export default function RichText({text}){return text.split('\n').filter(Boolean).map((line,i)=>line.startsWith('## ')?<h2 key={i}>{inline(line.slice(3))}</h2>:line.startsWith('- ')?<ul key={i}><li>{inline(line.slice(2))}</li></ul>:<p key={i}>{inline(line)}</p>)}
