import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  theme: 'dark' | 'light';
  locale: 'he' | 'en';
  soundEnabled: boolean;
  soundVolume: number;
  warningThresholds: number[]; // seconds

  setTheme: (theme: 'dark' | 'light') => void;
  setLocale: (locale: 'he' | 'en') => void;
  toggleSound: () => void;
  setSoundVolume: (volume: number) => void;
  setWarningThresholds: (thresholds: number[]) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      locale: 'he',
      soundEnabled: true,
      soundVolume: 0.7,
      warningThresholds: [60, 30, 10],

      setTheme: (theme) => {
        document.documentElement.classList.toggle('light', theme === 'light');
        set({ theme });
      },
      setLocale: (locale) => {
        document.documentElement.dir = locale === 'he' ? 'rtl' : 'ltr';
        document.documentElement.lang = locale;
        set({ locale });
      },
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      setSoundVolume: (soundVolume) => set({ soundVolume }),
      setWarningThresholds: (warningThresholds) => set({ warningThresholds }),
    }),
    { name: 'poker-director-settings' }
  )
);
