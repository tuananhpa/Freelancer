import type { Product } from "../types/domain";
export function createProductDraft(existing: Product[] = []): Product {
  const id = crypto.randomUUID();
  let batchCode: string;
  do {
    batchCode = `HY-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  } while (existing.some((p) => p.batchCode === batchCode));
  return {
    id,
    slug: `san-pham-${id}`,
    batchCode,
    orderUnit: "kg",
    name: "",
    nameEn: "",
    subtitle: { vi: "", en: "" },
    region: { vi: "", en: "" },
    season: { vi: "", en: "" },
    image: "",
    video: "",
    gallery: [],
    story: { vi: "", en: "" },
    transcript: "",
    facts: [],
    harvestedAt: "",
    expiresAt: "",
    certifications: [],
    timeline: [],
    faq: [],
    blocks: ["hero", "story", "journey", "videos", "cta"],
    status: "draft",
    demo: true,
  };
}
