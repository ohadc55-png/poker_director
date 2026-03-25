import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { TournamentPage } from './pages/TournamentPage';
import { DisplayPage } from './pages/DisplayPage';
import { HistoryPage } from './pages/HistoryPage';
import { PlayersPage } from './pages/PlayersPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { useSettingsStore } from './stores/settingsStore';

export default function App() {
  const { theme, locale } = useSettingsStore();

  // Apply theme and locale on mount
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.dir = locale === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [theme, locale]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Display page — standalone, no layout */}
        <Route path="/display/:id" element={<DisplayPage />} />

        {/* Main app with sidebar layout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tournament/:id" element={<TournamentPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
