/**
 * Renders a video from a URL. Supports:
 * - YouTube (watch, embed, youtu.be) → iframe embed (privacy-enhanced nocookie domain)
 * - Vimeo → iframe embed
 * - Direct video URLs → native <video> tag
 *
 * Note: Console errors "net::ERR_BLOCKED_BY_CLIENT" for youtube.com are from browser
 * extensions (ad blockers, privacy tools) blocking YouTube's tracking requests. They do
 * not affect playback and cannot be fixed in app code.
 */
function getEmbedProps(url: string): { type: "youtube" | "vimeo" | "direct"; src: string } | null {
  const raw = (url || "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "youtu.be") {
      let videoId: string | null = null;
      if (host === "youtu.be") {
        videoId = parsed.pathname.slice(1).split("/")[0] || null;
      } else if (parsed.pathname === "/embed/" || parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.replace(/^\/embed\//, "").split("/")[0] || null;
      } else {
        videoId = parsed.searchParams.get("v");
      }
      if (!videoId) return null;
      return { type: "youtube", src: `https://www.youtube-nocookie.com/embed/${videoId}` };
    }

    if (host === "vimeo.com") {
      const path = parsed.pathname.replace(/^\/+/, "").split("/")[0];
      if (!path || path === "video") return null;
      return { type: "vimeo", src: `https://player.vimeo.com/video/${path}` };
    }

    return { type: "direct", src: raw };
  } catch {
    return null;
  }
}

export function LessonVideoPlayer({ videoUrl }: { videoUrl: string }) {
  const props = getEmbedProps(videoUrl);
  if (!props) return null;

  if (props.type === "youtube" || props.type === "vimeo") {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-sm">
        <iframe
          src={props.src}
          title="Video"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-900 shadow-sm">
      <video src={props.src} controls className="w-full rounded-xl">
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
