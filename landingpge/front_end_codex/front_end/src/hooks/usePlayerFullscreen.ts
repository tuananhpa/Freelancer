import { useEffect, useRef, useState, type RefObject } from "react";

type SafariVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
};

// Keep the existing video mounted so expanding never restarts playback.
export function usePlayerFullscreen(
  container: RefObject<HTMLElement | null>,
  video: RefObject<HTMLVideoElement | null>,
  source?: string,
) {
  const [mode, setMode] = useState<
    "none" | "fullscreen" | "native" | "expanded"
  >("none");
  const trigger = useRef<HTMLElement | null>(null);
  const restoreFocus = () => trigger.current?.focus({ preventScroll: true });
  useEffect(() => {
    const el = video.current;
    const sync = () => {
      setMode(
        document.fullscreenElement === container.current
          ? "fullscreen"
          : "none",
      );
      if (!document.fullscreenElement) restoreFocus();
    };
    const begin = () => setMode("native");
    const end = () => {
      setMode("none");
      restoreFocus();
    };
    document.addEventListener("fullscreenchange", sync);
    el?.addEventListener("webkitbeginfullscreen", begin);
    el?.addEventListener("webkitendfullscreen", end);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      el?.removeEventListener("webkitbeginfullscreen", begin);
      el?.removeEventListener("webkitendfullscreen", end);
    };
  }, [container, video, source]);
  useEffect(() => {
    if (mode !== "expanded") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    container.current?.focus({ preventScroll: true });
    const keyboard = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMode("none");
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(
        container.current?.querySelectorAll<HTMLElement>(
          'button,a[href],[tabindex="0"]',
        ) || [],
      ).filter(
        (el) => el.getClientRects().length && !el.hasAttribute("disabled"),
      );
      const first = items[0],
        last = items[items.length - 1];
      if (!first) return;
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === container.current)
      ) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", keyboard);
      restoreFocus();
    };
  }, [mode, container]);
  function exit() {
    if (
      document.fullscreenElement === container.current &&
      document.exitFullscreen
    ) {
      void document.exitFullscreen().catch(() => setMode("none"));
    } else if (mode === "native") {
      try {
        (video.current as SafariVideo | null)?.webkitExitFullscreen?.();
      } catch {
        // Safari may already have dismissed its native player with Done.
      } finally {
        setMode("none");
        restoreFocus();
      }
    } else {
      setMode("none");
      restoreFocus();
    }
  }
  function toggle() {
    if (mode !== "none") {
      exit();
      return;
    }
    trigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const root = container.current;
    const film = video.current as SafariVideo | null;
    if (root?.requestFullscreen) {
      void root.requestFullscreen().catch(() => setMode("expanded"));
    } else if (film?.webkitEnterFullscreen) {
      // iOS requires this call directly inside the user's click, not after an await.
      try {
        film.webkitEnterFullscreen();
        setMode("native");
      } catch {
        setMode("expanded");
      }
    } else setMode("expanded");
  }
  return {
    active: mode !== "none",
    expanded: mode === "expanded",
    toggle,
    exit,
  };
}
