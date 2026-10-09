export type Language = "vi" | "en";
export type Localized = { vi: string; en: string };
export type ImageDisplay = { fit: "cover" | "contain"; x: number; y: number };
export type ManagedImage = { src: string; display?: ImageDisplay };
export type QuickReply = {
  id?: string;
  enabled?: boolean;
  question: Localized;
  answer: Localized;
};
export type Block = "hero" | "story" | "journey" | "videos" | "cta";
export type QrDestination =
  { kind: "product"; productId: string } | { kind: "external"; url: string };
export type SocialPlatform =
  | "zalo"
  | "facebook"
  | "instagram"
  | "messenger"
  | "tiktok"
  | "youtube"
  | "website";
export type SocialLink = {
  id: string;
  platform: SocialPlatform;
  label: string;
  url: string;
  enabled: boolean;
  icon?: ManagedImage;
};
export type TimelineEvent = {
  title: Localized;
  detail: Localized;
  date: string;
};
export type Product = {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  subtitle: Localized;
  region: Localized;
  season: Localized;
  image: string;
  imageDisplay?: ImageDisplay;
  galleryDisplays?: Record<string, ImageDisplay>;
  video: string;
  gallery: string[];
  story: Localized;
  transcript: string;
  facts: { value: string; label: Localized }[];
  batchCode: string;
  orderUnit?: string;
  harvestedAt: string;
  expiresAt: string;
  certifications: string[];
  timeline: TimelineEvent[];
  faq: QuickReply[];
  blocks: Block[];
  status: "published" | "draft";
  demo: boolean;
  qrDestination?: QrDestination;
};
export type Review = {
  id: string;
  productId: string;
  name: string;
  rating: number;
  text: string;
  image?: string;
  createdAt: string;
};
export type Inquiry = {
  id: string;
  name: string;
  phone: string;
  note: string;
  type: "purchase" | "partner";
  productId?: string;
  productName?: string;
  quantity?: number;
  unit?: string;
  createdAt: string;
  status: "new" | "contacted";
};
export type Message = {
  id: string;
  name: string;
  question: string;
  reply?: string;
  productId?: string;
  createdAt: string;
};
export type Settings = {
  zaloUrl: string;
  email: string;
  organization: string;
  socialLinks: SocialLink[];
  socialWidgetEnabled: boolean;
  chatGreeting: Localized;
  quickReplies: QuickReply[];
  brandLogo?: ManagedImage;
  storyImages: ManagedImage[];
  imageDisplays: Record<string, ImageDisplay>;
};
export type AdminUser = { name: string; role: "admin" };
export type Repository = {
  products: {
    list: (admin?: boolean) => Promise<Product[]>;
    get: (slug: string) => Promise<Product | undefined>;
    save: (product: Product) => Promise<Product>;
    remove: (id: string) => Promise<void>;
  };
  reviews: {
    list: (productId?: string) => Promise<Review[]>;
    add: (review: Omit<Review, "id" | "createdAt">) => Promise<Review>;
  };
  inquiries: {
    list: () => Promise<Inquiry[]>;
    add: (
      inquiry: Omit<Inquiry, "id" | "createdAt" | "status">,
    ) => Promise<Inquiry>;
    update: (id: string, status: Inquiry["status"]) => Promise<void>;
  };
  messages: {
    list: () => Promise<Message[]>;
    add: (message: Omit<Message, "id" | "createdAt">) => Promise<Message>;
    reply: (id: string, reply: string) => Promise<void>;
  };
  settings: {
    get: () => Promise<Settings>;
    save: (settings: Settings) => Promise<void>;
  };
};
