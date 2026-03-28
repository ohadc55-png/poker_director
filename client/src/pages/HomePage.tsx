import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Play, Clock, Users, Trophy } from 'lucide-react';
import { useTournamentStore } from '../stores/tournamentStore';
import { formatCurrency, cn } from '../lib/utils';

export function HomePage() {
  const { tournaments, loadTournaments, createTournament, deleteTournament, loading } = useTournamentStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  const handleCreate = async (data: any) => {
    const tournament = await createTournament(data);
    navigate(`/tournament/${tournament.id}`);
  };

  const activeTournaments = tournaments.filter((t) => t.status !== 'finished');
  const completedTournaments = tournaments.filter((t) => t.status === 'finished');

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Poker Director</h1>
          <p className="text-muted-foreground mt-1">ניהול טורנירי פוקר בזמן אמת</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        >
          <Plus className="w-5 h-5" />
          טורניר חדש
        </button>
      </div>

      {showCreate && (
        <CreateTournamentForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Active tournaments */}
      {activeTournaments.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            טורנירים פעילים
          </h2>
          <div className="grid gap-3">
            {activeTournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} onDelete={deleteTournament} />
            ))}
          </div>
        </section>
      )}

      {/* Completed tournaments */}
      {completedTournaments.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            טורנירים שהושלמו
          </h2>
          <div className="grid gap-3">
            {completedTournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} onDelete={deleteTournament} />
            ))}
          </div>
        </section>
      )}

      {tournaments.length === 0 && !loading && (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-6xl mb-4">♠</div>
          <p className="text-xl">אין טורנירים עדיין</p>
          <p className="mt-2">לחץ על "טורניר חדש" כדי להתחיל</p>
        </div>
      )}
    </div>
  );
}

function TournamentCard({ tournament, onDelete }: { tournament: any; onDelete: (id: string) => void }) {
  const statusColors: Record<string, string> = {
    setup: 'bg-blue-500/20 text-blue-400',
    running: 'bg-green-500/20 text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
    finished: 'bg-muted text-muted-foreground',
  };

  return (
    <Link
      to={`/tournament/${tournament.id}`}
      className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="text-3xl">♠</div>
        <div>
          <h3 className="font-semibold text-lg">{tournament.name}</h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span>{new Date(tournament.date).toLocaleDateString('he-IL')}</span>
            {tournament.location && <span>{tournament.location}</span>}
            <span>{tournament.game_type}</span>
            <span>Buy-in: {formatCurrency(tournament.buy_in_amount, tournament.currency)}</span>
            {tournament.bounty_amount > 0 && (
              <span className="text-orange-400">Bounty: {formatCurrency(tournament.bounty_amount, tournament.currency)}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={cn('text-xs px-2 py-1 rounded', statusColors[tournament.status])}>
          {tournament.status}
        </span>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (confirm('למחוק את הטורניר?')) onDelete(tournament.id);
          }}
          className="text-muted-foreground hover:text-destructive p-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Link>
  );
}

function CreateTournamentForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    game_type: "Texas Hold'em",
    buy_in_amount: 100,
    buy_in_fee: 20,
    starting_chips: 10000,
    rebuy_amount: 100,
    rebuy_chips: 10000,
    max_rebuys: 1,
    rebuy_deadline_level: 6,
    addon_amount: 100,
    addon_chips: 15000,
    bounty_amount: 0,
    late_reg_level: 6,
    currency: '₪',
  });

  return (
    <div className="p-6 rounded-lg bg-card border border-border space-y-4 animate-slide-in">
      <h2 className="text-xl font-bold">טורניר חדש</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FormField label="שם הטורניר" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <FormField label="תאריך" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
        <FormField label="מיקום" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
        <div>
          <label className="text-xs text-muted-foreground block mb-1">סוג משחק</label>
          <select
            value={form.game_type}
            onChange={(e) => setForm({ ...form, game_type: e.target.value })}
            className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm"
          >
            <option>Texas Hold'em</option>
            <option>Omaha</option>
            <option>PLO</option>
            <option>PLO5</option>
            <option>Mixed</option>
          </select>
        </div>
        <FormField label="Buy-in" type="number" value={form.buy_in_amount} onChange={(v) => setForm({ ...form, buy_in_amount: parseFloat(v) })} />
        <FormField label="Fee/Rake" type="number" value={form.buy_in_fee} onChange={(v) => setForm({ ...form, buy_in_fee: parseFloat(v) })} />
        <FormField label="Starting Chips" type="number" value={form.starting_chips} onChange={(v) => setForm({ ...form, starting_chips: parseInt(v) })} />
        <FormField label="Rebuy Amount" type="number" value={form.rebuy_amount} onChange={(v) => setForm({ ...form, rebuy_amount: parseFloat(v) })} />
        <FormField label="Rebuy Chips" type="number" value={form.rebuy_chips} onChange={(v) => setForm({ ...form, rebuy_chips: parseInt(v) })} />
        <FormField label="Max Rebuys" type="number" value={form.max_rebuys} onChange={(v) => setForm({ ...form, max_rebuys: parseInt(v) })} />
        <FormField label="Add-on Amount" type="number" value={form.addon_amount} onChange={(v) => setForm({ ...form, addon_amount: parseFloat(v) })} />
        <FormField label="Add-on Chips" type="number" value={form.addon_chips} onChange={(v) => setForm({ ...form, addon_chips: parseInt(v) })} />
        <FormField label="Bounty (0 = ללא)" type="number" value={form.bounty_amount} onChange={(v) => setForm({ ...form, bounty_amount: parseFloat(v) })} />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => form.name && onSubmit(form)}
          disabled={!form.name}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm disabled:opacity-50"
        >
          צור טורניר
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-secondary text-sm">ביטול</button>
      </div>
    </div>
  );
}

function FormField({
  label, type = 'text', value, onChange, required,
}: {
  label: string; type?: string; value: any; onChange: (v: any) => void; required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm"
      />
    </div>
  );
}
