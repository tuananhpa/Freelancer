import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {Routes,Route,useLocation} from 'react-router-dom';
import {seed} from './data/seed.js';
import {loadState,saveState} from './lib/repository.js';
import {Header,Footer,SocialWidgets} from './components/Common.jsx';
import {Home,About,Products,Facilities,FacilityDetail,News,Article,Contact,Request,NotFound} from './pages/Public.jsx';
import Admin from './pages/Admin.jsx';
const AppContext=createContext(null);
export const useApp=()=>useContext(AppContext);
const storage={getItem:key=>window.localStorage.getItem(key),setItem:(key,value)=>window.localStorage.setItem(key,value)};
export function useContent(key){const {state,lang}=useApp();const loc=useLocation();const params=new URLSearchParams(loc.search);const preview=params.get('preview')===key;const locale=params.get('locale')||lang;return (preview?state.drafts[key]?.[locale]:null)||state.pages[key]?.[locale]||seed.pages[key]?.[locale]||seed.pages.home[lang];}
class Boundary extends React.Component{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?<main className="container section"><h1>Không tải được trang</h1><p>Hãy tải lại trang hoặc mở bằng một trình duyệt khác.</p><button onClick={()=>location.reload()} className="btn">Tải lại</button></main>:this.props.children}}
export default function App(){
 const [loaded]=useState(()=>loadState(storage,seed));const [state,setState]=useState(loaded.state);const latest=useRef(state);
 const [recovery,setRecovery]=useState(Boolean(loaded.warning));
 const [lang,setLangState]=useState(()=>{try{return localStorage.getItem('cec.locale.v1')==='en'?'en':'vi'}catch{return 'vi'}});
 const [notice,setNotice]=useState(loaded.warning);const [error,setError]=useState(Boolean(loaded.warning));const location=useLocation();
 const t=(vi,en)=>lang==='vi'?vi:en;const value=v=>typeof v==='object'?(v?.[lang]||v?.vi||''):v||'';
 const notify=(message,isError=false)=>{setError(isError);setNotice(message)};
 const commit=(update,message)=>{if(recovery){notify('Hãy chọn phục hồi dữ liệu trước khi lưu thay đổi.',true);return false}try{const next=typeof update==='function'?update(latest.current):update;saveState(storage,next);latest.current=next;setState(next);if(message)notify(message);return true}catch(e){notify(e.message,true);return false}};
 const recover=()=>{try{const raw=storage.getItem('cec.frontend.v1');if(raw)storage.setItem('cec.frontend.backup.'+Date.now(),raw);saveState(storage,latest.current);setRecovery(false);notify('Đã tạo dữ liệu mới; bản lỗi được giữ trong bộ nhớ trình duyệt.')}catch(e){notify(e.message,true)}};
 const setLang=next=>{setLangState(next);try{localStorage.setItem('cec.locale.v1',next)}catch{}};
 const addProduct=id=>{const found=latest.current.products.find(p=>p.id===id&&p.published);if(!found)return;commit(s=>({...s,cart:s.cart.some(i=>i.productId===id)?s.cart:s.cart.concat({productId:id,quantity:1})}),t('Đã thêm vào danh sách yêu cầu.','Added to your enquiry.'))};
 useEffect(()=>{document.documentElement.lang=lang;},[lang]);
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});setNotice('');},[location.pathname]);
 useEffect(()=>{const listener=e=>{if(e.key==='cec.frontend.v1'){const next=loadState(storage,seed);if(!next.warning){latest.current=next.state;setState(next.state)}else notify(next.warning,true)}};window.addEventListener('storage',listener);return()=>window.removeEventListener('storage',listener)},[]);
 const ctx={state,commit,lang,setLang,t,value,notify,addProduct};
 const admin=location.pathname.startsWith('/admin');
 return <AppContext.Provider value={ctx}><Boundary>{!admin&&<Header/>}
 {recovery&&<div className="recovery-banner" role="alert"><p>{loaded.warning||'Dữ liệu trong trình duyệt không hợp lệ.'}</p><button className="btn btn-outline" onClick={recover}>Tạo dữ liệu mới và giữ bản lỗi</button></div>}<Routes>
 <Route path="/" element={<Home/>}/><Route path="/gioi-thieu" element={<About/>}/><Route path="/san-pham" element={<Products/>}/><Route path="/nha-may" element={<Facilities/>}/><Route path="/nha-may/:id" element={<FacilityDetail/>}/><Route path="/tin-tuc" element={<News/>}/><Route path="/tin-tuc/:id" element={<Article/>}/><Route path="/lien-he" element={<Contact/>}/><Route path="/yeu-cau" element={<Request/>}/><Route path="/admin/*" element={<Admin/>}/><Route path="*" element={<NotFound/>}/>
 </Routes>{!admin&&<><SocialWidgets placement="floating"/><Footer/></>}
 {notice&&<div className={'toast '+(error?'error':'')} role={error?'alert':'status'}><span>{notice}</span><button aria-label={t('Đóng thông báo','Dismiss notification')} onClick={()=>setNotice('')}>×</button></div>}
 </Boundary></AppContext.Provider>
}

