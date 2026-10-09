import { Globe } from "lucide-react";
import { useResource } from "../hooks/useResource";
import { repository } from "../services";
import { visibleSocialLinks } from "../services/contacts";
import { useLanguage } from "../app/providers";
import type { SocialPlatform, ManagedImage } from "../types/domain";
import { MediaImage } from "./Media";
import { useState, type FocusEvent, type MouseEvent } from "react";
export function SocialIcon({
  platform,
  icon,
}: {
  platform: SocialPlatform;
  icon?: ManagedImage;
}) {
  if (icon?.src)
    return (
      <MediaImage
        src={icon.src}
        display={icon.display ?? { fit: "contain", x: 50, y: 50 }}
        className="custom-social-logo"
        alt=""
      />
    );
  if (platform === "website") return <Globe size={21} />;
  const files = {
    zalo: "zalo.webp",
    facebook: "facebook.png",
    instagram: "instagram.svg",
    messenger: "messenger.svg",
    tiktok: "tiktok.ico",
    youtube: "youtube.png",
  };
  return (
    <img
      src={`/brand/social/${files[platform]}`}
      className="official-social-logo"
      data-platform={platform}
      alt=""
    />
  );
}
export function SocialWidgets() {
  const { data } = useResource(() => repository.settings.get());
  const { t } = useLanguage();
  const links = visibleSocialLinks(data);
  const [active, setActive] = useState<{
    id: string;
    label: string;
    top: number;
  }>();
  function show(
    event: MouseEvent<HTMLAnchorElement> | FocusEvent<HTMLAnchorElement>,
    id: string,
    label: string,
  ) {
    const el = event.currentTarget;
    const origin = el.closest("nav")!.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    setActive({ id, label, top: rect.top - origin.top + rect.height / 2 });
  }
  if (!links.length) return null;
  return (
    <nav
      className="social-widgets"
      aria-label={t("Kênh liên hệ", "Contact channels")}
      onMouseLeave={() => setActive(undefined)}
    >
      <div className="social-widget-list" onScroll={() => setActive(undefined)}>
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t("Liên hệ qua", "Contact via")} ${link.label}`}
            aria-describedby={
              active?.id === link.id ? "social-contact-tooltip" : undefined
            }
            onMouseEnter={(event) => show(event, link.id, link.label)}
            onFocus={(event) => show(event, link.id, link.label)}
            onBlur={() => setActive(undefined)}
            style={{
              background:
                link.platform === "instagram"
                  ? "linear-gradient(45deg, #f9ce34, #ee2a7b, #6228d7)"
                  : link.platform === "tiktok"
                    ? "#000"
                    : link.platform === "website"
                      ? "#294b35"
                      : "#fff",
            }}
          >
            <SocialIcon platform={link.platform} icon={link.icon} />
          </a>
        ))}
      </div>
      {active && (
        <span
          id="social-contact-tooltip"
          className="social-widget-tooltip"
          role="tooltip"
          style={{ top: active.top }}
        >
          {active.label}
        </span>
      )}
    </nav>
  );
}
