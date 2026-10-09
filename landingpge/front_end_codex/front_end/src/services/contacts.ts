import type { Settings, SocialLink, SocialPlatform } from "../types/domain";
import {
  defaultChatGreeting,
  defaultQuickReplies,
  validateQuickReplies,
} from "../data/quickReplies";
export const socialPlatforms: {
  value: SocialPlatform;
  label: string;
  color: string;
}[] = [
  { value: "zalo", label: "Zalo", color: "#0068ff" },
  { value: "facebook", label: "Facebook", color: "#1877f2" },
  { value: "instagram", label: "Instagram", color: "#ad327b" },
  { value: "messenger", label: "Messenger", color: "#6b43d8" },
  { value: "tiktok", label: "TikTok", color: "#24382b" },
  { value: "youtube", label: "YouTube", color: "#d52828" },
  { value: "website", label: "Website", color: "#294b35" },
];
export function isWebUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !!url.hostname &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
export function normalizeSettings(value: Partial<Settings>): Settings {
  return {
    organization: value.organization ?? "HYTales",
    email: value.email ?? "",
    zaloUrl: value.zaloUrl ?? "",
    socialWidgetEnabled: value.socialWidgetEnabled ?? true,
    chatGreeting: value.chatGreeting ?? structuredClone(defaultChatGreeting),
    quickReplies: value.quickReplies ?? structuredClone(defaultQuickReplies),
    brandLogo: value.brandLogo,
    storyImages: value.storyImages ?? [
      {
        src: "/media/cam-duong-canh.webp",
        display: { fit: "cover", x: 40, y: 50 },
      },
      { src: "/media/nhan-long-scene-1.webp" },
      { src: "/media/nhan-long.webp" },
    ],
    imageDisplays: value.imageDisplays ?? {},
    socialLinks: value.socialLinks ?? [
      {
        id: "zalo",
        platform: "zalo",
        label: "Zalo",
        url: value.zaloUrl ?? "",
        enabled: true,
      },
      {
        id: "facebook",
        platform: "facebook",
        label: "Facebook",
        url: "",
        enabled: true,
      },
    ],
  };
}
export function visibleSocialLinks(settings?: Settings): SocialLink[] {
  return !settings || !settings.socialWidgetEnabled
    ? []
    : settings.socialLinks.filter((link) => link.enabled && isWebUrl(link.url));
}
export function validateContactSettings(settings: Settings) {
  validateQuickReplies(settings.quickReplies);
  for (const link of settings.socialLinks) {
    if (link.url && !isWebUrl(link.url))
      throw new Error(
        `Liên kết ${link.label || link.platform} phải bắt đầu bằng https:// hoặc http://.`,
      );
  }
}
