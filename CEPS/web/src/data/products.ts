import scan from './scan.json'
import ati from './ati.json'

export type ScanProduct = (typeof scan)[number]
export type AtiProduct = (typeof ati)[number]
export type Product = ScanProduct | AtiProduct

export const SCAN: ScanProduct[] = scan
export const ATI: AtiProduct[] = ati
export const ALL: Product[] = [...scan, ...ati]

export const byId = (id: string) => ALL.find((p) => p.id === id)

export const ATI_BOOK_PAGES = 20
export const atiOnPage = (page: number) => ATI.filter((p) => p.page === page)

/** Description text uses "\n- " for bullet lists (s::can accessories). */
export function splitDescription(p: Product): { intro: string; bullets: string[] } {
  if ('bullets' in p) return { intro: p.description, bullets: p.bullets }
  const [intro, ...rest] = p.description.split('\n- ')
  return { intro, bullets: rest }
}

/** Accent-insensitive search key. */
export const fold = (s: string) =>
  s.toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '')
