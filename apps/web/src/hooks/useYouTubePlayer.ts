'use client';

import { useEffect, useRef, useState } from 'react';
import { isStubPlayer } from '@/lib/youtube';

/** Imperative controls shared by the real IFrame player and the e2e stub. */
export interface EmberPlayerControls {
  load(videoId: string, startSeconds: number, autoplay: boolean): void;
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  getTime(): number;
  getDuration(): number;
}

interface Options {
  /** DOM element the player mounts into (lives inside the 3D screen anchor). */
  mountEl: HTMLElement | null;
  /** Called when the current video ends (natural end or stub trigger). */
  onEnded: () => void;
}

declare global {
  interface Window {
    /** Set by the YouTube IFrame API script when it finishes loading. */
    onYouTubeIframeAPIReady?: () => void;
    /** e2e-only hook to deterministically end the current video. */
    __emberStubEnd?: () => void;
    /** e2e-only hook to request a seek (routes through the server). */
    __emberSeek?: (sec: number) => void;
  }
}

// Load the IFrame API exactly once per page.
let apiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<void>((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return apiPromise;
}

/**
 * Owns the YouTube player instance that lives on the 3D screen. Loads the
 * IFrame API once and exposes play/pause/seek/load/getTime. In e2e stub mode it
 * swaps in a deterministic fake with the same interface.
 */
export function useYouTubePlayer({ mountEl, onEnded }: Options): {
  controls: EmberPlayerControls | null;
  ready: boolean;
} {
  const [controls, setControls] = useState<EmberPlayerControls | null>(null);
  const [ready, setReady] = useState(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  useEffect(() => {
    if (!mountEl) return;
    let destroyed = false;
    let cleanup = () => {};

    if (isStubPlayer()) {
      const el = document.createElement('div');
      el.setAttribute('data-testid', 'yt-stub');
      el.style.cssText =
        'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#05070a;color:#e8e6e3;font:600 14px system-ui,sans-serif;letter-spacing:0.04em;';
      mountEl.appendChild(el);

      let videoId = '';
      let playing = false;
      let posAtBase = 0;
      let baseWall = performance.now();
      const duration = 180;
      const getTime = () => (playing ? posAtBase + (performance.now() - baseWall) / 1000 : posAtBase);
      const render = () => {
        el.textContent = videoId ? `stub player ${videoId}` : 'stub player idle';
      };
      render();

      const stub: EmberPlayerControls = {
        load(id, startSeconds, autoplay) {
          videoId = id;
          posAtBase = startSeconds;
          baseWall = performance.now();
          playing = autoplay;
          render();
        },
        play() {
          if (!playing) {
            baseWall = performance.now();
            playing = true;
          }
        },
        pause() {
          posAtBase = getTime();
          playing = false;
        },
        seek(seconds) {
          posAtBase = seconds;
          baseWall = performance.now();
        },
        getTime,
        getDuration: () => duration,
      };

      window.__emberStubEnd = () => onEndedRef.current();
      setControls(stub);
      setReady(true);
      cleanup = () => {
        el.remove();
        delete window.__emberStubEnd;
      };
    } else {
      const inner = document.createElement('div');
      inner.style.cssText = 'width:100%;height:100%;';
      mountEl.appendChild(inner);
      let player: YT.Player | null = null;

      loadYouTubeApi()
        .then(() => {
          if (destroyed || !window.YT) return;
          player = new window.YT.Player(inner, {
            width: '100%',
            height: '100%',
            playerVars: {
              autoplay: 0,
              controls: 0,
              modestbranding: 1,
              rel: 0,
              playsinline: 1,
              disablekb: 1,
              fs: 0,
            },
            events: {
              onReady: () => {
                if (!destroyed) setReady(true);
              },
              onStateChange: (event: YT.OnStateChangeEvent) => {
                if (event.data === window.YT?.PlayerState.ENDED) onEndedRef.current();
              },
            },
          });

          setControls({
            load(id, startSeconds, autoplay) {
              if (!player) return;
              if (autoplay) player.loadVideoById({ videoId: id, startSeconds });
              else player.cueVideoById({ videoId: id, startSeconds });
            },
            play: () => player?.playVideo(),
            pause: () => player?.pauseVideo(),
            seek: (seconds) => player?.seekTo(seconds, true),
            getTime: () => player?.getCurrentTime?.() ?? 0,
            getDuration: () => player?.getDuration?.() ?? 0,
          });
        })
        .catch(() => {
          /* API failed to load; leave controls null */
        });

      cleanup = () => {
        try {
          player?.destroy();
        } catch {
          /* ignore */
        }
        inner.remove();
      };
    }

    return () => {
      destroyed = true;
      setReady(false);
      setControls(null);
      cleanup();
    };
  }, [mountEl]);

  return { controls, ready };
}
