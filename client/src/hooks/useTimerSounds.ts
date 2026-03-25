import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, volume: number) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gainNode.gain.value = volume;

    // Fade out
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Audio context may not be available
  }
}

export function useTimerSounds(remainingMs: number, isRunning: boolean) {
  const { soundEnabled, soundVolume, warningThresholds } = useSettingsStore();
  const lastWarning = useRef<number>(0);
  const lastLevel = useRef<number>(0);

  useEffect(() => {
    if (!soundEnabled || !isRunning) return;

    const seconds = Math.floor(remainingMs / 1000);

    // Level change sound (remaining resets to high value)
    if (remainingMs > 0 && lastLevel.current > 0 && remainingMs > lastLevel.current + 30000) {
      // New level started — play level change sound
      playTone(880, 0.3, soundVolume);
      setTimeout(() => playTone(1100, 0.3, soundVolume), 150);
      lastLevel.current = remainingMs;
      lastWarning.current = 0;
      return;
    }
    lastLevel.current = remainingMs;

    // Warning sounds at thresholds
    for (const threshold of warningThresholds) {
      if (seconds === threshold && lastWarning.current !== threshold) {
        lastWarning.current = threshold;
        if (threshold <= 10) {
          // Urgent beep
          playTone(1000, 0.15, soundVolume);
        } else if (threshold <= 30) {
          // Warning beep
          playTone(660, 0.2, soundVolume);
        } else {
          // Soft notification
          playTone(440, 0.25, soundVolume);
        }
        break;
      }
    }

    // Level end sound
    if (seconds === 0 && lastWarning.current !== -1) {
      lastWarning.current = -1;
      playTone(523, 0.4, soundVolume);
      setTimeout(() => playTone(659, 0.4, soundVolume), 200);
      setTimeout(() => playTone(784, 0.5, soundVolume), 400);
    }
  }, [remainingMs, isRunning, soundEnabled, soundVolume, warningThresholds]);
}
