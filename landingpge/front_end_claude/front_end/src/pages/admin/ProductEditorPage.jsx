import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminService } from '@/services/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Loading, ErrorState } from '@/components/common/StateView';
import QrDesigner from '@/components/admin/QrDesigner';
import BasicTab from '@/components/admin/editor/BasicTab';
import StoryTab from '@/components/admin/editor/StoryTab';
import TimelineTab from '@/components/admin/editor/TimelineTab';
import VideosTab from '@/components/admin/editor/VideosTab';
import CtaTab from '@/components/admin/editor/CtaTab';
import { emptyProduct } from '@/components/admin/editor/emptyProduct';

const TABS = [
  { key: 'basic', label: '1 · Hero & thẻ SP', C: BasicTab },
  { key: 'story', label: '2 · Câu chuyện', C: StoryTab },
  { key: 'timeline', label: '3 · Timeline', C: TimelineTab },
  { key: 'videos', label: '4 · Video ngắn', C: VideosTab },
  { key: 'cta', label: '5 · CTA & chatbot', C: CtaTab },
];

export default function ProductEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [p, setP] = useState(isNew ? emptyProduct() : null);
  const [tab, setTab] = useState('basic');
  const [state, setState] = useState({ loading: !isNew, saving: false, error: null, msg: '' });
  useDocumentTitle(isNew ? 'Thêm sản phẩm' : p?.name);

  useEffect(() => {
    if (isNew) { setP(emptyProduct()); setState((s) => ({ ...s, loading: false })); return; }
    setState((s) => ({ ...s, loading: true }));
    adminService.getProduct(id)
      .then((data) => { setP({ ...emptyProduct(), ...data }); setState((s) => ({ ...s, loading: false })); })
      .catch((error) => setState((s) => ({ ...s, loading: false, error })));
  }, [id, isNew]);

  const set = (patch) => setP((cur) => ({ ...cur, ...patch }));

  const save = async (e) => {
    e?.preventDefault();
    setState((s) => ({ ...s, saving: true, msg: '', error: null }));
    try {
      const saved = isNew ? await adminService.createProduct(p) : await adminService.updateProduct(id, p);
      setP({ ...emptyProduct(), ...saved });
      setState((s) => ({ ...s, saving: false, msg: isNew ? 'Đã tạo sản phẩm và sinh mã QR.' : 'Đã lưu thay đổi.' }));
      if (isNew) navigate(`/admin/products/${saved.id}`, { replace: true });
    } catch (error) {
      setState((s) => ({ ...s, saving: false, error }));
    }
  };

  const saveQr = (qr) => {
    set({ qr });
    if (!isNew) adminService.updateQr(id, qr).catch(() => {});
  };

  if (state.loading) return <Loading />;
  if (!p) return <ErrorState error={state.error} />;
  const Active = TABS.find((t) => t.key === tab).C;

  return (
    <form onSubmit={save} style={{ display: 'grid', gap: 24 }}>
      <div className="page-head">
        <div><p><Link to="/admin/products">Sản phẩm &amp; lô hàng</Link> /</p><h1>{isNew ? 'Thêm sản phẩm / lô hàng' : p.name}</h1></div>
        <div className="page-head__actions">
          {!isNew && <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer" className="btn btn--outline">Xem trang công khai</a>}
          <button type="submit" className="btn btn--primary" disabled={state.saving}>{state.saving ? 'Đang lưu…' : 'Lưu sản phẩm & sinh QR'}</button>
        </div>
      </div>
      {state.msg && <p className="form-success" role="status">{state.msg}</p>}
      {state.error && <p className="form-error" role="alert">{state.error.message}</p>}
      <div className="editor-layout">
        <div className="panel">
          <div className="tabs" role="tablist">
            {TABS.map((t) => <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'is-on' : ''} onClick={() => setTab(t.key)}>{t.label}</button>)}
          </div>
          <Active p={p} set={set} />
        </div>
        <div className="editor-layout__aside"><QrDesigner product={p} onChange={saveQr} /></div>
      </div>
    </form>
  );
}
