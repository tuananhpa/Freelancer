import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { byId } from './data/products'

type Line = { id: string; qty: number }
type Cart = {
  lines: Line[]
  count: number
  add: (id: string, qty?: number) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
  open: boolean
  setOpen: (v: boolean) => void
}

const Ctx = createContext<Cart | null>(null)
const KEY = 'cpes-cart'

function load(): Line[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v.filter((l) => byId(l.id) && l.qty > 0) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<Line[]>(load)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines))
    } catch {
      /* private mode: cart just isn't remembered */
    }
  }, [lines])

  const setQty = (id: string, qty: number) =>
    setLines((ls) => (qty <= 0 ? ls.filter((l) => l.id !== id) : ls.map((l) => (l.id === id ? { ...l, qty } : l))))
  const add = (id: string, qty = 1) => {
    setLines((ls) => (ls.some((l) => l.id === id) ? ls.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l)) : [...ls, { id, qty }]))
    setOpen(true)
  }

  return (
    <Ctx.Provider
      value={{ lines, count: lines.reduce((s, l) => s + l.qty, 0), add, setQty, clear: () => setLines([]), open, setOpen }}
    >
      {children}
    </Ctx.Provider>
  )
}

export const useCart = () => useContext(Ctx)!
