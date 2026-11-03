import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../cart'
import { byId } from '../data/products'
import { SITE } from '../data/site'

/** Order request. No backend yet: submitting opens the visitor's mail app with the order filled in. */
export default function CartDrawer() {
  const { lines, setQty, clear, open, setOpen } = useCart()
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const items = lines.map((l, i) => `${i + 1}. ${byId(l.id)!.name} (${byId(l.id)!.brand}) – SL: ${l.qty}`).join('\n')
    const body = `Họ tên: ${f.get('name')}\nCông ty: ${f.get('company')}\nĐiện thoại: ${f.get('phone')}\nEmail: ${f.get('email')}\n\nSản phẩm:\n${items}\n\nGhi chú: ${f.get('note')}`
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent('Đặt hàng / Yêu cầu báo giá – ' + f.get('company'))}&body=${encodeURIComponent(body)}`
    setSent(true)
    clear()
  }

  return (
    <>
      <div className={`scrim ${open ? 'on' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`drawer ${open ? 'on' : ''}`} aria-label="Giỏ hàng" aria-hidden={!open} inert={!open}>
        <header className="drawer-head">
          <h2>Giỏ hàng</h2>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Đóng giỏ hàng">✕</button>
        </header>

        {sent && !lines.length ? (
          <div className="drawer-empty">
            <p><b>Đã mở ứng dụng email</b> với đơn hàng của bạn. Bấm Gửi trong email để chuyển tới {SITE.email}. CPES sẽ liên hệ báo giá và xác nhận đơn.</p>
            <button className="btn btn-ghost" onClick={() => setSent(false)}>Đóng</button>
          </div>
        ) : !lines.length ? (
          <div className="drawer-empty">
            <p>Chưa có sản phẩm nào.</p>
            <Link className="btn btn-primary" to="/san-pham" onClick={() => setOpen(false)}>Xem sản phẩm</Link>
          </div>
        ) : (
          <>
            <ul className="cart-lines">
              {lines.map((l) => {
                const p = byId(l.id)!
                return (
                  <li key={l.id}>
                    <img src={p.image} alt="" width={56} height={56} />
                    <div>
                      <Link to={`/san-pham/${p.id}`} onClick={() => setOpen(false)}>{p.name}</Link>
                      <small>{p.brand} · Giá: liên hệ</small>
                    </div>
                    <div className="qty">
                      <button onClick={() => setQty(l.id, l.qty - 1)} aria-label={`Giảm số lượng ${p.name}`}>−</button>
                      <span aria-live="polite">{l.qty}</span>
                      <button onClick={() => setQty(l.id, l.qty + 1)} aria-label={`Tăng số lượng ${p.name}`}>+</button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <form className="order-form" onSubmit={submit}>
              <p className="muted">Giá thiết bị tuỳ cấu hình — CPES sẽ gửi báo giá chính thức sau khi nhận đơn.</p>
              <input name="name" required placeholder="Họ tên *" autoComplete="name" />
              <input name="company" required placeholder="Công ty *" autoComplete="organization" />
              <input name="phone" required placeholder="Số điện thoại *" type="tel" autoComplete="tel" />
              <input name="email" placeholder="Email" type="email" autoComplete="email" />
              <textarea name="note" rows={3} placeholder="Ghi chú (ứng dụng, số lượng, thời gian cần hàng…)" />
              <button className="btn btn-primary btn-block">Gửi đơn hàng</button>
            </form>
          </>
        )}
      </aside>
    </>
  )
}
