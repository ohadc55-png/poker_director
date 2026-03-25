import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Timer, Users, LayoutGrid, Trophy, Coins, Settings, History, Home, Moon, Sun, Globe,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'ראשי', labelEn: 'Home' },
  { path: '/players', icon: Users, label: 'שחקנים', labelEn: 'Players' },
  { path: '/leaderboard', icon: Trophy, label: 'דירוג', labelEn: 'Leaderboard' },
  { path: '/history', icon: History, label: 'היסטוריה', labelEn: 'History' },
];

const tournamentNavItems = [
  { tab: 'timer', icon: Timer, label: 'שעון', labelEn: 'Timer' },
  { tab: 'blinds', icon: LayoutGrid, label: 'בליינדים', labelEn: 'Blinds' },
  { tab: 'players', icon: Users, label: 'שחקנים', labelEn: 'Players' },
  { tab: 'prizes', icon: Trophy, label: 'פרסים', labelEn: 'Prizes' },
  { tab: 'tables', icon: LayoutGrid, label: 'שולחנות', labelEn: 'Tables' },
  { tab: 'chips', icon: Coins, label: "צ'יפים", labelEn: 'Chips' },
  { tab: 'settings', icon: Settings, label: 'הגדרות', labelEn: 'Settings' },
];

export function AppLayout() {
  const { theme, setTheme, locale, setLocale } = useSettingsStore();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-16 md:w-56 flex-shrink-0 border-e border-border bg-card flex flex-col">
        <div className="p-3 md:p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-lg">
            <span className="text-2xl">♠</span>
            <span className="hidden md:inline">Poker Director</span>
          </Link>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(({ path, icon: Icon, label, labelEn }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                location.pathname === path
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden md:inline">{locale === 'he' ? label : labelEn}</span>
            </Link>
          ))}
        </nav>

        <div className="p-2 border-t border-border space-y-1">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent w-full"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="hidden md:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          <button
            onClick={() => setLocale(locale === 'he' ? 'en' : 'he')}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent w-full"
          >
            <Globe className="w-5 h-5" />
            <span className="hidden md:inline">{locale === 'he' ? 'English' : 'עברית'}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
