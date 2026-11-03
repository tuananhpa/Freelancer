import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Link } from 'react-router-dom'
import { ATI, ATI_BOOK_PAGES, atiOnPage, type AtiProduct } from '../data/products'
import { useCart } from '../cart'

const W = 1 // page width in world units
const H = 1.3 // 800x1040 page images
const LEAVES = ATI_BOOK_PAGES / 2
const SEG = 32
const PAGES = Array.from({ length: ATI_BOOK_PAGES }, (_, i) => `/img/ati/book/p${String(i + 1).padStart(2, '0')}.webp`)
const CHAPTERS = [
  { label: 'Bìa', page: 1 },
  { label: 'Giám sát chất lượng nước', page: 3 },
  { label: 'Thiết bị đo & phát hiện khí', page: 11 },
  { label: 'Cảm biến thông minh', page: 17 },
]

type Side = 'left' | 'right'
type PageHit = (type: 'move' | 'click', page: number, u: number, v: number) => void
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** u,v in [0,1] from the page's top-left corner. */
const hotspotAt = (page: number, u: number, v: number) =>
  atiOnPage(page).find(({ hotspot: [x0, y0, x1, y1] }) => u >= x0 && u <= x1 && v >= y0 && v <= y1)

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ 3D */

function Leaf({ index, turned, front, back, onHit }: { index: number; turned: boolean; front: THREE.Texture; back: THREE.Texture; onHit: PageHit }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(W, H, SEG, 1)
    g.translate(W / 2, 0, 0) // hinge at the spine (x = 0)
    return g
  }, [])
  const rest = useMemo(() => Float32Array.from(geo.attributes.position.array), [geo])
  const angle = useRef(turned ? Math.PI : 0)
  const drawn = useRef(-1)
  useEffect(() => void (drawn.current = -1), [geo]) // a rebuilt geometry starts flat: redraw it

  useFrame((_, dt) => {
    const target = turned ? Math.PI : 0
    angle.current = reduced() ? target : angle.current + (target - angle.current) * Math.min(1, dt * 4.5)
    if (Math.abs(angle.current - target) < 1e-4) angle.current = target
    const a = angle.current
    if (a === drawn.current) return
    drawn.current = a

    // Page bends while turning: the free edge leads the spine by up to `curl` radians.
    const curl = 0.65 * Math.sin(a)
    const stack = THREE.MathUtils.lerp((LEAVES - index) * 0.004, index * 0.004, a / Math.PI)
    const pos = geo.attributes.position.array as Float32Array
    for (let j = 0; j < pos.length; j += 3) {
      const s = rest[j]
      let x: number, z: number
      if (curl < 1e-4) {
        x = s * Math.cos(a)
        z = s * Math.sin(a)
      } else {
        const k = W / curl
        const phi = a + (curl * s) / W
        x = k * (Math.sin(phi) - Math.sin(a))
        z = k * (Math.cos(a) - Math.cos(phi))
      }
      pos[j] = x
      pos[j + 2] = z + stack
    }
    geo.attributes.position.needsUpdate = true
    geo.computeVertexNormals()
    geo.computeBoundingSphere()
  })

  const hit = (type: 'move' | 'click', isBack: boolean) => (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    e.stopPropagation()
    if (!e.uv) return
    const u = isBack ? 1 - e.uv.x : e.uv.x // back texture is mirrored
    onHit(type, index * 2 + (isBack ? 2 : 1), u, 1 - e.uv.y)
  }

  return (
    <group>
      <mesh geometry={geo} onPointerMove={hit('move', false)} onClick={hit('click', false)}>
        <meshLambertMaterial map={front} side={THREE.FrontSide} />
      </mesh>
      <mesh geometry={geo} onPointerMove={hit('move', true)} onClick={hit('click', true)}>
        <meshLambertMaterial map={back} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

function Highlight({ product }: { product: AtiProduct | null }) {
  if (!product) return null
  const [x0, y0, x1, y1] = product.hotspot
  const left = product.page % 2 === 0
  const ux = (u: number) => (left ? (u - 1) * W : u * W)
  return (
    <mesh position={[(ux(x0) + ux(x1)) / 2, H / 2 - ((y0 + y1) / 2) * H, 0.08]}>
      <planeGeometry args={[(x1 - x0) * W, (y1 - y0) * H]} />
      <meshBasicMaterial color="#53ba36" transparent opacity={0.16} depthTest={false} />
    </mesh>
  )
}

function Rig({ k, side, narrow, book }: { k: number; side: Side; narrow: boolean; book: RefObject<THREE.Group | null> }) {
  const { camera, size, pointer } = useThree()

  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera
    const t = Math.min(1, dt * 4)
    // A closed book shows one page; keep it centred.
    const shift = k === 0 ? -W / 2 : k === LEAVES ? W / 2 : 0
    const focusX = narrow ? (side === 'left' ? -W / 2 : W / 2) + shift : 0
    const halfW = narrow ? W * 0.56 : W * 1.08
    const fit = Math.max(halfW / (Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * (size.width / size.height)), (H * 0.58) / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)))
    cam.position.x += (focusX - cam.position.x) * t
    cam.position.z += (fit - cam.position.z) * t
    cam.lookAt(cam.position.x, 0, 0)
    if (book.current) {
      book.current.position.x += (shift - book.current.position.x) * t
      const tilt = reduced() ? 0 : 1
      book.current.rotation.y += (pointer.x * 0.07 * tilt - book.current.rotation.y) * t
      book.current.rotation.x += ((-0.08 - pointer.y * 0.05) * tilt - book.current.rotation.x) * t
    }
  })
  return null
}

function Scene({ k, side, narrow, hover, onHit }: { k: number; side: Side; narrow: boolean; hover: AtiProduct | null; onHit: PageHit }) {
  const tex = useLoader(THREE.TextureLoader, PAGES)
  const gl = useThree((s) => s.gl)
  useMemo(() => {
    tex.forEach((t, i) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = gl.capabilities.getMaxAnisotropy()
      if (i % 2 === 1) {
        t.wrapS = THREE.RepeatWrapping
        t.repeat.x = -1
        t.offset.x = 1
      }
    })
  }, [tex, gl])

  const group = useRef<THREE.Group>(null)

  return (
    <>
      <ambientLight intensity={1.9} />
      <directionalLight position={[0.5, 1.2, 3]} intensity={1.3} />
      <Rig k={k} side={side} narrow={narrow} book={group} />
      <group ref={group}>
        {Array.from({ length: LEAVES }, (_, i) => (
          <Leaf key={i} index={i} turned={i < k} front={tex[i * 2]} back={tex[i * 2 + 1]} onHit={onHit} />
        ))}
        <Highlight product={hover} />
      </group>
    </>
  )
}

/* ------------------------------------------------------------------ flat fallback (no WebGL) */

function FlatSpread({ k, onHit }: { k: number; onHit: PageHit }) {
  const pages = [2 * k, 2 * k + 1].filter((p) => p >= 1 && p <= ATI_BOOK_PAGES)
  return (
    <div className="flat-spread">
      {pages.map((p) => (
        <div key={p} className="flat-page" onClick={() => onHit('click', p, 0, 0)}>
          <img src={PAGES[p - 1]} alt={`Brochure ATi trang ${p}`} />
          {atiOnPage(p).map((prod) => {
            const [x0, y0, x1, y1] = prod.hotspot
            return (
              <button
                key={prod.id}
                className="flat-hotspot"
                style={{ left: `${x0 * 100}%`, top: `${y0 * 100}%`, width: `${(x1 - x0) * 100}%`, height: `${(y1 - y0) * 100}%` }}
                onClick={(e) => (e.stopPropagation(), onHit('click', p, (x0 + x1) / 2, (y0 + y1) / 2))}
                aria-label={`Xem ${prod.name}`}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ product sheet shown inside the book */

function ProductSheet({ p, onClose }: { p: AtiProduct; onClose: () => void }) {
  const { add } = useCart()
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => close.current?.focus(), [p])
  return (
    <div className="book-sheet-wrap" onClick={onClose}>
      <article className="book-sheet" role="dialog" aria-modal="true" aria-label={p.name} onClick={(e) => e.stopPropagation()}>
        <button ref={close} className="icon-btn sheet-close" onClick={onClose} aria-label="Đóng">✕</button>
        <div className="sheet-img"><img src={p.image} alt={p.name} /></div>
        <div className="sheet-body">
          <p className="eyebrow">ATi · {p.categoryLabel} · Trang {p.page}</p>
          <h3>{p.name}</h3>
          <p>{p.description}</p>
          <ul className="ticks">{p.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
          <div className="sheet-actions">
            <button className="btn btn-primary" onClick={() => (add(p.id), onClose())}>Mua hàng</button>
            <Link className="btn btn-ghost" to={`/san-pham/${p.id}`}>Xem chi tiết</Link>
          </div>
        </div>
      </article>
    </div>
  )
}

/* ------------------------------------------------------------------ main */

export default function AtiBook({ startPage }: { startPage?: number }) {
  const [k, setK] = useState(() => (startPage ? Math.floor(startPage / 2) : 0)) // leaves turned
  const [side, setSide] = useState<Side>(startPage && startPage % 2 === 0 ? 'left' : 'right')
  const [hover, setHover] = useState<AtiProduct | null>(null)
  const [open, setOpen] = useState<AtiProduct | null>(null)
  const [narrow, setNarrow] = useState(() => window.innerWidth < 720)
  const webgl = useMemo(hasWebGL, [])
  const lastFlip = useRef(0)

  useEffect(() => {
    const on = () => setNarrow(window.innerWidth < 720)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  const go = useCallback((nk: number, ns: Side) => {
    nk = Math.max(0, Math.min(LEAVES, nk))
    lastFlip.current = performance.now()
    setHover(null)
    setK(nk)
    setSide(nk === 0 ? 'right' : nk === LEAVES ? 'left' : ns)
  }, [])

  // Desktop turns a spread; narrow screens read one page at a time.
  const next = () => (narrow && side === 'left' && k < LEAVES ? go(k, 'right') : go(k + 1, 'left'))
  const prev = () => (narrow && side === 'right' && k > 0 ? go(k, 'left') : go(k - 1, 'right'))
  const toPage = (p: number) => go(Math.floor(p / 2), p % 2 === 0 ? 'left' : 'right')

  const onHit: PageHit = (type, page, u, v) => {
    const settled = performance.now() - lastFlip.current > 700
    const prod = settled ? hotspotAt(page, u, v) : undefined
    if (type === 'move') {
      setHover((h) => (h?.id === prod?.id ? h : prod ?? null))
      return
    }
    if (prod) setOpen(prod)
    else if (page % 2 === 1) next()
    else prev()
  }

  useEffect(() => {
    document.body.style.cursor = hover ? 'pointer' : ''
    return () => void (document.body.style.cursor = '')
  }, [hover])

  const visible = narrow ? [side === 'left' ? 2 * k : 2 * k + 1] : [2 * k, 2 * k + 1]
  const shown = visible.filter((p) => p >= 1 && p <= ATI_BOOK_PAGES)
  const onSpread = shown.flatMap(atiOnPage)

  return (
    <div className="book">
      <div
        className="book-stage"
        tabIndex={0}
        aria-label="Brochure ATi dạng sách lật. Dùng phím mũi tên trái phải để lật trang."
        onKeyDown={(e) => (e.key === 'ArrowRight' ? next() : e.key === 'ArrowLeft' ? prev() : null)}
        onPointerLeave={() => setHover(null)}
      >
        {webgl ? (
          <Canvas flat dpr={[1, 2]} camera={{ fov: 32, position: [0, 0, 4] }}>
            <Suspense fallback={null}>
              <Scene k={k} side={side} narrow={narrow} hover={hover} onHit={onHit} />
            </Suspense>
          </Canvas>
        ) : (
          <FlatSpread k={k} onHit={onHit} />
        )}
        {hover && !open && <div className="book-tip">{hover.name} — bấm để xem</div>}
        {open && <ProductSheet p={open} onClose={() => setOpen(null)} />}
      </div>

      <div className="book-bar">
        <button className="btn btn-ghost" onClick={prev} disabled={k === 0 && side === 'right'} aria-label="Trang trước">‹ Trước</button>
        <span className="book-pages" aria-live="polite">
          Trang {shown.join('–')} / {ATI_BOOK_PAGES}
        </span>
        <button className="btn btn-primary" onClick={next} disabled={k === LEAVES} aria-label="Trang sau">Sau ›</button>
      </div>

      <div className="book-chapters">
        {CHAPTERS.map((c) => (
          <button key={c.page} className={shown.includes(c.page) ? 'on' : ''} onClick={() => toPage(c.page)}>{c.label}</button>
        ))}
        <a href="/doc/ati-brochure.pdf" download className="dl">Tải PDF</a>
      </div>

      {onSpread.length > 0 && (
        <div className="book-chips" aria-label="Sản phẩm trên trang đang mở">
          <span>Sản phẩm trên trang này:</span>
          {onSpread.map((p) => <button key={p.id} onClick={() => setOpen(p)} onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)}>{p.name}</button>)}
        </div>
      )}
      <p className="book-hint">Bấm vào sản phẩm trên trang sách để xem chi tiết và đặt mua · Bấm lề trang hoặc dùng phím ← → để lật · {ATI.length} sản phẩm</p>
    </div>
  )
}
