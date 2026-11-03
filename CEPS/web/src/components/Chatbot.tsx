import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ALL, fold, type Product } from '../data/products'
import { SITE } from '../data/site'

type Msg = { from: 'bot' | 'me'; text: string; products?: Product[] }

const SUGGEST = ['Thiết bị đo COD, BOD', 'Phát hiện khí độc', 'Đo Clo dư', 'Liên hệ & báo giá']

// shortcut: keyword matching over local product data, upgrade to an LLM endpoint (Claude API via a Worker) when a backend exists
function reply(q: string): Msg {
  const k = fold(q)
  if (/lien he|bao gia|gia|dia chi|so dien thoai|hotline|email/.test(k))
    return { from: 'bot', text: `Bạn có thể gọi ${SITE.phone}, email ${SITE.email}, hoặc thêm sản phẩm vào giỏ hàng rồi bấm "Gửi đơn hàng". Địa chỉ: ${SITE.address}` }
  const words = k.split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !['do', 'thiet', 'bi', 'may', 'can', 'tim', 'cho', 'toi'].includes(w))
  const score = (p: Product) => {
    const hay = fold([p.name, p.categoryLabel, p.description, 'parameters' in p ? p.parameters.join(' ') : '', 'bullets' in p ? p.bullets.join(' ') : ''].join(' '))
    return words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0)
  }
  const hits = words.length ? ALL.map((p) => [p, score(p)] as const).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([p]) => p) : []
  return hits.length
    ? { from: 'bot', text: 'Một số sản phẩm phù hợp:', products: hits }
    : { from: 'bot', text: `Mình chưa tìm thấy sản phẩm phù hợp. Bạn thử từ khoá khác (ví dụ "pH", "amoni", "H2S"), hoặc gọi ${SITE.phone} để kỹ sư CPES tư vấn.` }
}

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'bot', text: 'Xin chào! Mình là trợ lý CPES. Bạn cần tìm thiết bị đo chất lượng nước hay phát hiện khí?' },
  ])
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' })
  }, [msgs])

  const ask = (text: string) => text.trim() && setMsgs((m) => [...m, { from: 'me', text }, reply(text)])
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const input = e.currentTarget.elements.namedItem('q') as HTMLInputElement
    ask(input.value)
    input.value = ''
  }

  return (
    <div className={`chat ${open ? 'open' : ''}`}>
      {open && (
        <section className="chat-panel" aria-label="Trợ lý CPES">
          <header>
            <div>
              <b>Trợ lý CPES</b>
              <small>Bản thử nghiệm – trả lời theo dữ liệu sản phẩm</small>
            </div>
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Đóng trợ lý">✕</button>
          </header>
          <div className="chat-list" ref={list} aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`bubble ${m.from}`}>
                <p>{m.text}</p>
                {m.products?.map((p) => (
                  <Link key={p.id} to={`/san-pham/${p.id}`} className="chat-product" onClick={() => setOpen(false)}>
                    <img src={p.image} alt="" width={40} height={40} />
                    <span>{p.name}<small>{p.brand}</small></span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div className="chat-suggest">
            {SUGGEST.map((s) => <button key={s} onClick={() => ask(s)}>{s}</button>)}
          </div>
          <form onSubmit={submit}>
            <input name="q" placeholder="Nhập câu hỏi…" aria-label="Câu hỏi" autoComplete="off" />
            <button className="btn btn-primary">Gửi</button>
          </form>
        </section>
      )}
      <button className="chat-fab" onClick={() => setOpen(!open)} aria-label={open ? 'Đóng trợ lý' : 'Mở trợ lý CPES'} aria-expanded={open}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </div>
  )
}
