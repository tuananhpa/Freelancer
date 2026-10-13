import QRCode from 'qrcode';
export function buildBinURL(base,binId) {
  let url;try{url=new URL(String(base).trim());}catch{throw Error('Địa chỉ website chưa hợp lệ. Nhập đầy đủ https:// hoặc http://.');}
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error('Địa chỉ website chỉ hỗ trợ HTTP/HTTPS và không chứa thông tin đăng nhập.');
  const bin=String(binId||'').trim().toUpperCase();
  if(!/^R\d{2}$/.test(bin))throw Error('Mã thùng cần theo dạng R01, R02… với hai chữ số.');
  url.search='';url.searchParams.set('bin',bin);url.hash='/home';return url.toString();
}
export async function generateBinQR(base,binId) {
  const url=buildBinURL(base,binId);
  const image=await QRCode.toDataURL(url,{type:'image/png',errorCorrectionLevel:'M',width:1024,margin:4,color:{dark:'#102620',light:'#ffffff'}});
  return {url,image,binId:new URL(url).searchParams.get('bin')};
}
