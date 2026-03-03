"use client";

import React from "react";

/**
 * Renders a video from a URL. Supports:
 * - YouTube (watch, embed, youtu.be) → iframe embed with end-screen overlay (blocks YouTube popups)
 * - Vimeo → iframe embed
 * - Direct video URLs → native <video> tag
 *
 * Note: Console errors "net::ERR_BLOCKED_BY_CLIENT" for youtube.com are from browser
 * extensions (ad blockers, privacy tools) blocking YouTube's tracking requests. They do
 * not affect playback and cannot be fixed in app code.
 */

function getEmbedProps(url: string): { type: "youtube" | "vimeo" | "direct"; src: string; videoId?: string } | null {
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
      return {
        type: "youtube",
        src: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
        videoId,
      };
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

interface YTPlayerInstance {
  destroy?: () => void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (el: string | HTMLElement, opts: Record<string, unknown>) => YTPlayerInstance;
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function YouTubePlayerWithEndOverlay({ videoId }: { videoId: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const playerRef = React.useRef<YTPlayerInstance | null>(null);
  const [videoEnded, setVideoEnded] = React.useState(false);

  React.useEffect(() => {
    if (!videoId || !containerRef.current) return;

    function initPlayer() {
      if (!containerRef.current || !window.YT?.Player) return;
      const existing = containerRef.current.querySelector("#yt-player-root");
      if (existing) return;
      const el = document.createElement("div");
      el.id = "yt-player-root";
      el.className = "absolute inset-0 h-full w-full";
      containerRef.current.appendChild(el);
      playerRef.current = new window.YT!.Player(el, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange(event: { data: number }) {
            if (event.data === window.YT!.PlayerState.ENDED) setVideoEnded(true);
          },
        },
      });
    }

    if (window.YT?.Player) {
      initPlayer();
      return () => {
        playerRef.current?.destroy?.();
        playerRef.current = null;
      };
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScript = document.getElementsByTagName("script")[0];
    firstScript?.parentNode?.insertBefore(tag, firstScript);

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
      prev?.();
    };

    return () => {
      window.onYouTubeIframeAPIReady = prev;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [videoId]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-sm" ref={containerRef}>
      {videoEnded && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-900/95 px-4 text-center"
          aria-live="polite"
        >
          <span className="text-lg font-medium text-white">You&apos;ve reached the end of the video.</span>
          <span className="text-sm text-slate-300">Mark the lesson complete below to continue.</span>
        </div>
      )}
    </div>
  );
}

export function LessonVideoPlayer({ videoUrl }: { videoUrl: string }) {
  const props = getEmbedProps(videoUrl);
  if (!props) return null;

  if (props.type === "youtube" && props.videoId) {
    return <YouTubePlayerWithEndOverlay videoId={props.videoId} />;
  }

  if (props.type === "vimeo") {
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
    <HtmlVideoWithNoForward src={props.src} />
  );
}

function HtmlVideoWithNoForward({ src }: { src: string }) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const maxTimeRef = React.useRef(0);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function handleTimeUpdate() {
      const current = video.currentTime;
      if (current > maxTimeRef.current + 0.35) {
        // Tried to jump ahead – snap back to last watched position
        video.currentTime = maxTimeRef.current;
        return;
      }
      if (current > maxTimeRef.current) {
        maxTimeRef.current = current;
      }
    }

    function handleSeeking() {
      const current = video.currentTime;
      // Allow rewind (seeking to a lower time), block forward beyond max watched
      if (current > maxTimeRef.current + 0.35) {
        video.currentTime = maxTimeRef.current;
      }
    }

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("seeking", handleSeeking);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("seeking", handleSeeking);
    };
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-900 shadow-sm">
      <video ref={videoRef} src={src} controls className="w-full rounded-xl">
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
