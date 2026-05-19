"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal types for the YouTube IFrame API surface we actually touch.
type YTPlayerState = -1 | 0 | 1 | 2 | 3 | 5;

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getPlayerState(): YTPlayerState;
  setVolume(v: number): void;
  getVolume(): number;
  destroy(): void;
}

interface YTPlayerCtor {
  new (
    el: HTMLElement | string,
    options: {
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: { data: YTPlayerState; target: YTPlayer }) => void;
      };
    },
  ): YTPlayer;
}

interface YTNamespace {
  Player: YTPlayerCtor;
  PlayerState: { UNSTARTED: -1; ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoadingPromise: Promise<YTNamespace> | null = null;

function loadYouTubeApi(): Promise<YTNamespace> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiLoadingPromise) return apiLoadingPromise;

  apiLoadingPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);
  });

  return apiLoadingPromise;
}

export type PlaybackStatus = "idle" | "loading" | "ready" | "playing" | "paused" | "ended";

export interface UseYouTubePlayerOptions {
  videoId: string;
  startSeconds?: number;
  /** Manual nudge in seconds added on top of player.getCurrentTime() for sync trim. */
  offsetSeconds?: number;
  onTick?: (currentTime: number) => void;
}

export function useYouTubePlayer({
  videoId,
  startSeconds = 0,
  offsetSeconds = 0,
  onTick,
}: UseYouTubePlayerOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const rafRef = useRef<number | null>(null);
  const onTickRef = useRef(onTick);
  const offsetRef = useRef(offsetSeconds);

  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [currentTime, setCurrentTime] = useState<number>(startSeconds);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    offsetRef.current = offsetSeconds;
  }, [offsetSeconds]);

  // Mount/destroy player when videoId changes
  useEffect(() => {
    if (!containerRef.current || !videoId) return;
    let cancelled = false;
    setStatus("loading");

    loadYouTubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;
      // Tear down any prior instance
      playerRef.current?.destroy();
      const host = document.createElement("div");
      host.style.width = "100%";
      host.style.height = "100%";
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(host);

      playerRef.current = new YT.Player(host, {
        videoId,
        playerVars: {
          start: Math.max(0, Math.floor(startSeconds)),
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          controls: 1,
        },
        events: {
          onReady: ({ target }) => {
            if (cancelled) return;
            setStatus("ready");
            setCurrentTime(target.getCurrentTime());
          },
          onStateChange: ({ data }) => {
            if (cancelled) return;
            if (data === 1) setStatus("playing");
            else if (data === 2) setStatus("paused");
            else if (data === 0) setStatus("ended");
            else if (data === 3) setStatus("loading");
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Animation loop only while playing — drives the audio-synced clock
  useEffect(() => {
    if (status !== "playing") {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const tick = () => {
      const p = playerRef.current;
      if (p) {
        const t = p.getCurrentTime() + offsetRef.current;
        setCurrentTime(t);
        onTickRef.current?.(t);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [status]);

  const play = useCallback(() => playerRef.current?.playVideo(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);
  const seekTo = useCallback((s: number) => playerRef.current?.seekTo(Math.max(0, s), true), []);
  const setVolume = useCallback((v: number) => {
    const p = playerRef.current;
    if (!p) return;
    try { p.setVolume(Math.max(0, Math.min(100, v))); } catch { /* noop */ }
  }, []);
  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    const state = p.getPlayerState();
    if (state === 1) p.pauseVideo();
    else p.playVideo();
  }, []);

  /** Linearly fade volume from `from` → `to` over `ms` ms. Returns a cancel fn. */
  const fadeVolume = useCallback((from: number, to: number, ms: number) => {
    const p = playerRef.current;
    if (!p) return () => {};
    const startedAt = performance.now();
    let raf = 0;
    const step = () => {
      const t = Math.min(1, (performance.now() - startedAt) / ms);
      const v = from + (to - from) * t;
      try { p.setVolume(Math.max(0, Math.min(100, v))); } catch { /* noop */ }
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return {
    containerRef,
    status,
    currentTime,
    play,
    pause,
    seekTo,
    setVolume,
    fadeVolume,
    toggle,
    isPlaying: status === "playing",
  };
}
