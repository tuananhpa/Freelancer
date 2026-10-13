const KEY='school-green.bin';
export function readBinContext(search,storage) {
  const query=new URLSearchParams(search).get('bin');
  if(query!==null){
    if(!/^R\d{2}$/.test(query))return null;
    try{storage?.setItem(KEY,query);}catch{}
    return query;
  }
  try{const saved=storage?.getItem(KEY);return /^R\d{2}$/.test(saved||'')?saved:null;}catch{return null;}
}
