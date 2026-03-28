import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useTournamentStore } from '../../stores/tournamentStore';
import { formatCurrency } from '../../lib/utils';

interface TournamentSettingsProps {
  tournamentId: string;
}

export function TournamentSettings({ tournamentId }: TournamentSettingsProps) {
  const { tournament, updateTournament } = useTournamentStore();
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (tournament) {
      setForm({
        name: tournament.name,
        date: tournament.date,
        location: tournament.location || '',
        game_type: tournament.game_type,
        buy_in_amount: tournament.buy_in_amount,
        buy_in_fee: tournament.buy_in_fee,
        starting_chips: tournament.starting_chips,
        rebuy_amount: tournament.rebuy_amount || '',
        rebuy_chips: tournament.rebuy_chips || '',
        max_rebuys: tournament.max_rebuys ?? '',
        rebuy_deadline_level: tournament.rebuy_deadline_level || '',
        addon_amount: tournament.addon_amount || '',
        addon_chips: tournament.addon_chips || '',
        bounty_amount: tournament.bounty_amount || '',
        late_reg_level: tournament.late_reg_level || '',
        currency: tournament.currency,
      });
    }
  }, [tournament]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Record<string, any> = { ...form };
      // Convert empty strings to null for optional numeric fields
      for (const key of ['rebuy_amount', 'rebuy_chips', 'max_rebuys', 'rebuy_deadline_level', 'addon_amount', 'addon_chips', 'bounty_amount', 'late_reg_level']) {
        if (data[key] === '' || data[key] === null) {
          data[key] = undefined;
        } else {
          data[key] = Number(data[key]);
        }
      }
      data.buy_in_amount = Number(data.buy_in_amount);
      data.buy_in_fee = Number(data.buy_in_fee);
      data.starting_chips = Number(data.starting_chips);
      await updateTournament(tournamentId, data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!tournament) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">הגדרות טורניר</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? 'שומר...' : saved ? 'נשמר ✓' : 'שמור שינויים'}
        </button>
      </div>

      {/* General */}
      <Section title="כללי">
        <Field label="שם הטורניר" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="תאריך" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
        <Field label="מיקום" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
        <div>
          <label className="text-xs text-muted-foreground block mb-1">סוג משחק</label>
          <select
            value={form.game_type || ''}
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
        <div>
          <label className="text-xs text-muted-foreground block mb-1">מטבע</label>
          <select
            value={form.currency || '₪'}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm"
          >
            <option value="₪">₪ (שקל)</option>
            <option value="$">$ (דולר)</option>
            <option value="€">€ (יורו)</option>
          </select>
        </div>
      </Section>

      {/* Buy-in */}
      <Section title="כניסה (Buy-in)">
        <Field label="סכום כניסה" type="number" value={form.buy_in_amount} onChange={(v) => setForm({ ...form, buy_in_amount: v })} />
        <Field label="Fee/Rake" type="number" value={form.buy_in_fee} onChange={(v) => setForm({ ...form, buy_in_fee: v })} />
        <Field label="Starting Chips" type="number" value={form.starting_chips} onChange={(v) => setForm({ ...form, starting_chips: v })} />
      </Section>

      {/* Rebuy */}
      <Section title="Rebuy">
        <Field label="סכום ריבאי (ריק = ללא)" type="number" value={form.rebuy_amount} onChange={(v) => setForm({ ...form, rebuy_amount: v })} />
        <Field label="צ'יפים בריבאי" type="number" value={form.rebuy_chips} onChange={(v) => setForm({ ...form, rebuy_chips: v })} />
        <Field label="מקסימום ריבאיים (ריק = ללא הגבלה)" type="number" value={form.max_rebuys} onChange={(v) => setForm({ ...form, max_rebuys: v })} />
        <Field label="ריבאי עד רמה" type="number" value={form.rebuy_deadline_level} onChange={(v) => setForm({ ...form, rebuy_deadline_level: v })} />
      </Section>

      {/* Add-on */}
      <Section title="Add-on">
        <Field label="סכום אדאון (ריק = ללא)" type="number" value={form.addon_amount} onChange={(v) => setForm({ ...form, addon_amount: v })} />
        <Field label="צ'יפים באדאון" type="number" value={form.addon_chips} onChange={(v) => setForm({ ...form, addon_chips: v })} />
      </Section>

      {/* Bounty */}
      <Section title="Bounty">
        <Field label="סכום באונטי לראש (ריק = ללא)" type="number" value={form.bounty_amount} onChange={(v) => setForm({ ...form, bounty_amount: v })} />
      </Section>

      {/* Other */}
      <Section title="אחר">
        <Field label="Late Registration עד רמה" type="number" value={form.late_reg_level} onChange={(v) => setForm({ ...form, late_reg_level: v })} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground border-b border-border pb-2">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange }: { label: string; type?: string; value: any; onChange: (v: any) => void }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm"
      />
    </div>
  );
}
