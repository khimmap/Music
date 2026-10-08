'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  FLAGS_BY_TIER,
  detectTier,
  lowerTier,
  queryQuality,
  type QualityFlags,
  type QualityMode,
  type Tier,
} from './detect';
import { createFpsMonitor } from './fpsMonitor';

interface QualityContextValue {
  tier: Tier;
  mode: QualityMode;
  setMode: (mode: QualityMode) => void;
  flags: QualityFlags;
  reducedMotion: boolean;
  /** False when the tab is hidden (loops should pause). */
  visible: boolean;
}

const QualityContext = createContext<QualityContextValue | null>(null);

export function useQuality(): QualityContextValue {
  const ctx = useContext(QualityContext);
  if (!ctx) throw new Error('useQuality must be used inside <QualityProvider>');
  return ctx;
}

const STORAGE_KEY = 'ember:quality';

function baseTier(mode: QualityMode): Tier {
  return mode === 'auto' ? detectTier() : mode;
}

export function QualityProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [mode, setModeState] = useState<QualityMode>('auto');
  const [tier, setTier] = useState<Tier>('medium');
  const [visible, setVisible] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const downgradedRef = useRef(false);

  // Client init: query param > saved mode > auto.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as QualityMode | null;
    const initial = queryQuality() ?? stored ?? 'auto';
    setModeState(initial);
    setTier(baseTier(initial));
  }, []);

  const setMode = useCallback((next: QualityMode) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setModeState(next);
    setTier(baseTier(next));
    downgradedRef.current = false;
  }, []);

  // Tab visibility: pause loops when hidden.
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    onVis();
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Runtime auto-downgrade on sustained low FPS (never auto-upgrade).
  useEffect(() => {
    const monitor = createFpsMonitor(() => {
      setTier((prev) => {
        const next = lowerTier(prev);
        if (next !== prev && !downgradedRef.current) {
          downgradedRef.current = true;
          setToast('Graphics lowered for smoother playback');
          window.setTimeout(() => setToast(null), 4000);
        }
        return next;
      });
    });
    monitor.start();
    return () => monitor.stop();
  }, []);

  const value = useMemo<QualityContextValue>(
    () => ({ tier, mode, setMode, flags: FLAGS_BY_TIER[tier], reducedMotion, visible }),
    [tier, mode, setMode, reducedMotion, visible],
  );

  return (
    <QualityContext.Provider value={value}>
      {children}
      {toast && (
        <div
          role="status"
          data-testid="quality-toast"
          className="pointer-events-none fixed bottom-base left-1/2 z-50 -translate-x-1/2 rounded-pill border border-white/10 bg-surface-dark-elevated px-base py-xs font-sans text-caption text-on-dark"
        >
          {toast}
        </div>
      )}
    </QualityContext.Provider>
  );
}
