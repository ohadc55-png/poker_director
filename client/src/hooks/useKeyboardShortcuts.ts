import { useEffect } from 'react';
import { useTimerStore } from '../stores/timerStore';

export function useKeyboardShortcuts(tournamentId: string | undefined) {
  const { isRunning, start, pause, resume, nextLevel, prevLevel, addTime } = useTimerStore();

  useEffect(() => {
    if (!tournamentId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (isRunning) {
            pause(tournamentId);
          } else {
            resume(tournamentId);
          }
          break;
        case 'ArrowRight':
        case 'KeyN':
          e.preventDefault();
          nextLevel(tournamentId);
          break;
        case 'ArrowLeft':
        case 'KeyP':
          e.preventDefault();
          prevLevel(tournamentId);
          break;
        case 'KeyF':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              document.documentElement.requestFullscreen();
            }
          }
          break;
        case 'Equal':
        case 'NumpadAdd':
          e.preventDefault();
          addTime(tournamentId, e.shiftKey ? 300 : 60);
          break;
        case 'F11':
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
          break;
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tournamentId, isRunning, start, pause, resume, nextLevel, prevLevel, addTime]);
}
