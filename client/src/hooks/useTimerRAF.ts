import { useRef, useEffect, useState, useCallback } from 'react';
import { useTimerStore } from '../stores/timerStore';

export function useTimerRAF(): number {
  const { lastServerRemainingMs, lastServerTimestamp, isRunning } = useTimerStore();
  const [displayMs, setDisplayMs] = useState(lastServerRemainingMs);
  const rafRef = useRef<number>(0);

  // Use refs so the RAF callback always reads fresh values
  const remainingRef = useRef(lastServerRemainingMs);
  const timestampRef = useRef(lastServerTimestamp);
  const runningRef = useRef(isRunning);

  remainingRef.current = lastServerRemainingMs;
  timestampRef.current = lastServerTimestamp;
  runningRef.current = isRunning;

  useEffect(() => {
    if (!isRunning) {
      // Paused — freeze at current value
      cancelAnimationFrame(rafRef.current);
      setDisplayMs(lastServerRemainingMs);
      return;
    }

    const animate = () => {
      if (!runningRef.current) return;
      const elapsed = Date.now() - timestampRef.current;
      const remaining = Math.max(0, remainingRef.current - elapsed);
      setDisplayMs(remaining);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning, lastServerRemainingMs, lastServerTimestamp]);

  return displayMs;
}
