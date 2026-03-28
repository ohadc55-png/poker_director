import { useState } from 'react';
import { Plus, Trash2, GripVertical, Wand2, Save } from 'lucide-react';
import { useTournamentStore } from '../../stores/tournamentStore';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import type { BlindLevel } from '@poker/shared';

interface BlindStructureEditorProps {
  tournamentId: string;
}

export function BlindStructureEditor({ tournamentId }: BlindStructureEditorProps) {
  const { blinds, setBlinds } = useTournamentStore();
  const [localBlinds, setLocalBlinds] = useState<any[]>(
    blinds.length > 0
      ? blinds
      : [{ level_number: 1, small_blind: 25, big_blind: 50, ante: 0, big_blind_ante: 0, duration_minutes: 20, is_break: false }]
  );
  const [showGenerator, setShowGenerator] = useState(false);
  const [saving, setSaving] = useState(false);

  const addLevel = () => {
    const lastLevel = localBlinds[localBlinds.length - 1];
    const newNum = localBlinds.length + 1;
    setLocalBlinds([
      ...localBlinds,
      {
        level_number: newNum,
        small_blind: lastLevel ? lastLevel.big_blind : 25,
        big_blind: lastLevel ? lastLevel.big_blind * 2 : 50,
        ante: 0,
        big_blind_ante: 0,
        duration_minutes: lastLevel?.duration_minutes || 20,
        is_break: false,
      },
    ]);
  };

  const addBreak = () => {
    const newNum = localBlinds.length + 1;
    setLocalBlinds([
      ...localBlinds,
      {
        level_number: newNum,
        small_blind: 0,
        big_blind: 0,
        ante: 0,
        big_blind_ante: 0,
        duration_minutes: 10,
        is_break: true,
        break_name: 'Break',
      },
    ]);
  };

  const removeLevel = (index: number) => {
    const updated = localBlinds.filter((_, i) => i !== index).map((l, i) => ({ ...l, level_number: i + 1 }));
    setLocalBlinds(updated);
  };

  const updateLevel = (index: number, field: string, value: any) => {
    const updated = [...localBlinds];
    updated[index] = { ...updated[index], [field]: value };
    setLocalBlinds(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setBlinds(tournamentId, localBlinds);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (params: any) => {
    try {
      const levels = await api.generateBlinds(params);
      setLocalBlinds(levels);
      setShowGenerator(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">מבנה בליינדים</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGenerator(!showGenerator)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-accent text-sm"
          >
            <Wand2 className="w-4 h-4" />
            מחולל אוטומטי
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>

      {showGenerator && <BlindGenerator onGenerate={handleGenerate} onCancel={() => setShowGenerator(false)} />}

      {/* Blind levels table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-2 py-2 text-start">#</th>
              <th className="px-2 py-2 text-start">Small Blind</th>
              <th className="px-2 py-2 text-start">Big Blind</th>
              <th className="px-2 py-2 text-start">Ante</th>
              <th className="px-2 py-2 text-start">BB Ante</th>
              <th className="px-2 py-2 text-start">זמן (דקות)</th>
              <th className="px-2 py-2 text-start">סוג</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {localBlinds.map((level, index) => (
              <tr
                key={index}
                className={cn(
                  'border-b border-border/50 hover:bg-accent/50',
                  level.is_break && 'bg-yellow-500/10'
                )}
              >
                <td className="px-2 py-1.5 text-muted-foreground">{level.level_number}</td>
                {level.is_break ? (
                  <>
                    <td colSpan={4} className="px-2 py-1.5">
                      <input
                        type="text"
                        value={level.break_name || 'Break'}
                        onChange={(e) => updateLevel(index, 'break_name', e.target.value)}
                        className="bg-transparent border border-border rounded px-2 py-1 w-full text-yellow-400 font-semibold"
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        value={level.small_blind}
                        onChange={(e) => updateLevel(index, 'small_blind', parseInt(e.target.value) || 0)}
                        className="bg-transparent border border-border rounded px-2 py-1 w-20"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        value={level.big_blind}
                        onChange={(e) => updateLevel(index, 'big_blind', parseInt(e.target.value) || 0)}
                        className="bg-transparent border border-border rounded px-2 py-1 w-20"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        value={level.ante}
                        onChange={(e) => updateLevel(index, 'ante', parseInt(e.target.value) || 0)}
                        className="bg-transparent border border-border rounded px-2 py-1 w-20"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        value={level.big_blind_ante}
                        onChange={(e) => updateLevel(index, 'big_blind_ante', parseInt(e.target.value) || 0)}
                        className="bg-transparent border border-border rounded px-2 py-1 w-20"
                      />
                    </td>
                  </>
                )}
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    value={level.duration_minutes}
                    onChange={(e) => updateLevel(index, 'duration_minutes', parseInt(e.target.value) || 1)}
                    className="bg-transparent border border-border rounded px-2 py-1 w-16"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <span className={cn('text-xs px-2 py-0.5 rounded', level.is_break ? 'bg-yellow-500/20 text-yellow-400' : 'bg-primary/20 text-primary')}>
                    {level.is_break ? 'Break' : 'Play'}
                  </span>
                </td>
                <td className="px-2 py-1.5">
                  <button onClick={() => removeLevel(index)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <button onClick={addLevel} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-accent text-sm">
          <Plus className="w-4 h-4" /> הוסף רמה
        </button>
        <button onClick={addBreak} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-sm">
          <Plus className="w-4 h-4" /> הוסף הפסקה
        </button>
      </div>
    </div>
  );
}

function BlindGenerator({ onGenerate, onCancel }: { onGenerate: (params: any) => void; onCancel: () => void }) {
  const [params, setParams] = useState({
    starting_chips: 10000,
    num_players: 20,
    target_duration_hours: 4,
    level_duration_minutes: 20,
    style: 'regular' as const,
    starting_big_blind: 50,
    ante_type: 'bb_ante' as 'none' | 'regular' | 'bb_ante',
    ante_start_level: 5,
    break_every_n_levels: 4,
    break_duration_minutes: 10,
  });

  return (
    <div className="p-4 rounded-lg bg-card border border-border space-y-4">
      <h3 className="font-semibold">מחולל בליינדים אוטומטי</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Field label="Starting Chips" type="number" value={params.starting_chips} onChange={(v) => setParams({ ...params, starting_chips: v })} />
        <Field label="מספר שחקנים" type="number" value={params.num_players} onChange={(v) => setParams({ ...params, num_players: v })} />
        <Field label="משך רצוי (שעות)" type="number" value={params.target_duration_hours} onChange={(v) => setParams({ ...params, target_duration_hours: v })} />
        <Field label="משך רמה (דקות)" type="number" value={params.level_duration_minutes} onChange={(v) => setParams({ ...params, level_duration_minutes: v })} />
        <div>
          <label className="text-xs text-muted-foreground block mb-1">סגנון</label>
          <select
            value={params.style}
            onChange={(e) => setParams({ ...params, style: e.target.value as any })}
            className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm"
          >
            <option value="turbo">Turbo</option>
            <option value="regular">Regular</option>
            <option value="deep_stack">Deep Stack</option>
          </select>
        </div>
        <Field label="Big Blind ראשון" type="number" value={params.starting_big_blind} onChange={(v) => setParams({ ...params, starting_big_blind: v })} />
        <div>
          <label className="text-xs text-muted-foreground block mb-1">סוג אנטה</label>
          <select
            value={params.ante_type}
            onChange={(e) => setParams({ ...params, ante_type: e.target.value as any })}
            className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm"
          >
            <option value="none">ללא אנטה</option>
            <option value="regular">אנטה רגיל</option>
            <option value="bb_ante">BB Ante</option>
          </select>
        </div>
        {params.ante_type !== 'none' && (
          <Field label="אנטה מתחיל ברמה" type="number" value={params.ante_start_level} onChange={(v) => setParams({ ...params, ante_start_level: v })} />
        )}
        <Field label="הפסקה כל X רמות" type="number" value={params.break_every_n_levels} onChange={(v) => setParams({ ...params, break_every_n_levels: v })} />
        <Field label="משך הפסקה (דקות)" type="number" value={params.break_duration_minutes} onChange={(v) => setParams({ ...params, break_duration_minutes: v })} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onGenerate(params)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">צור מבנה</button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-secondary text-sm">ביטול</button>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange }: { label: string; type: string; value: any; onChange: (v: any) => void }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm"
      />
    </div>
  );
}
