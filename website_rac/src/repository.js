import { STORAGE_KEY, classes, defaults, wasteTypes } from './config.js';
import { initialState } from './fixtures.js';
const dateVN = value => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(value));
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => crypto.randomUUID();
async function hash(password,salt) {
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},material,256);
  return [...new Uint8Array(bits)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
export function createRepository(storage) {
  let state=initialState(); let storageError='';
  try {
    const saved=storage?.getItem(STORAGE_KEY);
    if(saved) {
      const data=JSON.parse(saved);
      if(!data||!['users','transactions','history','snapshots','adjustments'].every(key=>Array.isArray(data[key])))throw Error('schema');
      if(!data.settings?.points||!['required','instant'].includes(data.settings.approvalMode))throw Error('settings');
      if(!['plastic','metal'].every(key=>Number.isSafeInteger(data.settings.points[key])&&data.settings.points[key]>=1&&data.settings.points[key]<=1000))throw Error('points');
      if(data.users.some(u=>!u?.id||typeof u.name!=='string'||!Number.isSafeInteger(u.points)))throw Error('users');
      state=data;state.settings={...defaults,...data.settings};
    }
  }catch{storageError='Không đọc được dữ liệu đã lưu. Đang sử dụng dữ liệu ban đầu.';}
  const save=()=> {try {storage?.setItem(STORAGE_KEY,JSON.stringify(state));} catch { throw Error('Không lưu được thay đổi. Hãy kiểm tra dung lượng hoặc quyền lưu trữ của trình duyệt.');}};
  function mutate(work) { const previous=structuredClone(state); try { const result=work(); save(); return result; } catch(e){state=previous;throw e;} }
  const currentUser=()=>state.users.find(u=>u.id===state.activeUserId)||null;
  const allEvents=()=>[...state.history,...state.transactions];
  function rankings(week='all') {
    const from=week==='all'?null:week;
    const end=from?new Date(`${from}T00:00:00+07:00`).getTime()+7*86400000:null;
    const inWeek=at=>!from || (dateVN(at)>=from && new Date(at).getTime()<end);
    return classes.map(id=>{
      const baseline=state.snapshots.filter(s=>s.id===id&&(week==='all'||s.week===week));
      const transactions=state.transactions.filter(t=>t.classId===id&&inWeek(t.at));
      const adjustments=state.adjustments.filter(t=>t.classId===id&&inWeek(t.at));
      return {id,points:baseline.reduce((n,s)=>n+s.points,0)+transactions.reduce((n,t)=>n+t.points,0)+adjustments.reduce((n,t)=>n+t.points,0),count:baseline.reduce((n,s)=>n+s.count,0)+transactions.length,members:state.users.filter(u=>u.classId===id&&u.membership==='approved').length};
    }).sort((a,b)=>b.points-a.points||b.count-a.count||a.id.localeCompare(b.id));
  }
  return {
    currentUser, rankings, get storageError(){return storageError;},
    getState:()=>structuredClone(state),
    users:()=>structuredClone(state.users), settings:()=>structuredClone(state.settings),
    history:(userId=currentUser()?.id)=>allEvents().filter(t=>t.userId===userId).sort((a,b)=>new Date(b.at)-new Date(a.at)),
    async register({name,email,password}) {
      name=String(name||'').trim();email=String(email||'').trim().toLowerCase();
      if(name.length<2||name.length>60)throw Error('Họ tên cần từ 2 đến 60 ký tự.');
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Email không hợp lệ.');
      if(state.users.some(u=>u.email===email))throw Error('Email này đã được đăng ký.');
      if(String(password).length<8)throw Error('Mật khẩu cần ít nhất 8 ký tự.');
      const salt=uid(); const passwordHash=await hash(password,salt);
      return mutate(()=>{if(state.users.some(u=>u.email===email))throw Error('Email này đã được đăng ký.');const user={id:uid(),name,email,passwordHash,salt,classId:null,membership:'none',points:0};state.users.push(user);state.activeUserId=user.id;return user;});
    },
    async login(email,password) {
      const user=state.users.find(u=>u.email===String(email).trim().toLowerCase());
      if(!user?.passwordHash || await hash(password,user.salt)!==user.passwordHash)throw Error('Email hoặc mật khẩu không đúng.');
      return mutate(()=>{state.activeUserId=user.id;return user;});
    },
    logout:()=>mutate(()=>{state.activeUserId=null;}),
    previewStudent:()=>mutate(()=>{state.activeUserId='student-1';}),
    requestClass(classId) {
      if(!classes.includes(classId))throw Error('Lớp không hợp lệ.');
      const user=currentUser();if(!user)throw Error('Vui lòng đăng nhập.');
      if(user.membership==='approved')throw Error('Bạn đã tham gia lớp. Liên hệ admin để thay đổi.');
      return mutate(()=>{user.classId=classId;user.membership=state.settings.approvalMode==='instant'?'approved':'pending';});
    },
    approveMember(id) {return mutate(()=>{const u=state.users.find(u=>u.id===id);if(!u||u.membership!=='pending')throw Error('Không có yêu cầu chờ duyệt.');u.membership='approved';});},
    rejectMember(id) {return mutate(()=>{const u=state.users.find(u=>u.id===id);if(!u||u.membership!=='pending')throw Error('Không có yêu cầu chờ duyệt.');u.membership='rejected';});},
    recordDeposit(tx) {
      if(!tx.confirmed)throw Error('Chưa có xác nhận rác đã vào thùng.');
      if(!tx.id||allEvents().some(t=>t.id===tx.id))throw Error('Mã giao dịch trùng hoặc không hợp lệ.');
      if(!wasteTypes[tx.type]||!/^R\d{2}$/.test(tx.binId||''))throw Error('Loại rác hoặc thùng không hợp lệ.');
      const u=state.users.find(u=>u.id===tx.userId);if(!u||u.membership!=='approved')throw Error('Tài khoản chưa được duyệt vào lớp.');
      if(tx.at&&Number.isNaN(new Date(tx.at).getTime()))throw Error('Thời gian không hợp lệ.');
      return mutate(()=>{const record={...tx,classId:u.classId,points:state.settings.points[tx.type],at:tx.at||new Date().toISOString()};state.transactions.push(record);u.points+=record.points;return record;});
    },
    adjustPoints(userId,points,reason) {
      if(!Number.isSafeInteger(points)||points===0||Math.abs(points)>100000||!String(reason).trim())throw Error('Điểm và lý do chưa hợp lệ.');
      const user=state.users.find(u=>u.id===userId);if(!user)throw Error('Không tìm thấy tài khoản.');
      if(user.points+points<0)throw Error('Điểm không thể âm.');
      if(user.membership!=='approved')throw Error('Tài khoản chưa được duyệt.');
      return mutate(()=>{user.points+=points;state.adjustments.push({id:uid(),userId,classId:user.classId,points,reason:String(reason).trim(),at:new Date().toISOString()});});
    },
    updateSettings(patch) {
      if(patch.approvalMode&&!['required','instant'].includes(patch.approvalMode))throw Error('Chế độ gia nhập không hợp lệ.');
      if(patch.points&&Object.values(patch.points).some(n=>!Number.isSafeInteger(n)||n<1||n>1000))throw Error('Điểm mỗi loại cần từ 1 đến 1.000.');
      return mutate(()=>{state.settings={...state.settings,...patch,points:{...state.settings.points,...patch.points}};});
    },
  };
}
