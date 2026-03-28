import { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useTournamentStore } from '../../stores/tournamentStore';
import { DEFAULT_CHIP_COLORS } from '@poker/shared';
import { cn } from '../../lib/utils';

interface ChipSetupProps {
  tournamentId: string;
}

export function ChipSetup({ tournamentId }: ChipSetupProps) {
  const { tournament, chips, setChips } = useTournamentStore();
  const [localChips, setLocalChips] = useState(
    chips.length > 0
      ? chips.map((c) => ({ value: c.value, color: c.color, color_name: c.color_name || '', quantity: c.quantity }))
      : DEFAULT_CHIP_COLORS.map((c) => ({ value: c.value, color: c.color, color_name: c.color_name, quantity: 100 }))
  );
  const [saving, setSaving] = useState(false);

  const startingStack = tournament?.starting_chips || 10000;

  // Calculate distribution
  const distribution = calculateDistribution(localChips, startingStack);

  const addChip = () => {
    setLocalChips([...localChips, { value: 0, color: '#888888', color_name: '', quantity: 50 }]);
  };

  const removeChip = (index: number) => {
    setLocalChips(localChips.filter((_, i) => i !== index));
  };

  const updateChip = (index: number, field: string, value: any) => {
    const updated = [...localChips];
    updated[index] = { ...updated[index], [field]: value };
    setLocalChips(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setChips(tournamentId, localChips);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">צ'יפים</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? 'שומר...' : 'שמור'}
        </button>
      </div>

      {/* Chip denominations */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-muted-foreground">ערכי צ'יפים</h3>
        {localChips.map((chip, index) => (
          <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border">
            {/* Color preview */}
            <div
              className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: chip.color }}
            >
              {chip.value > 0 ? (chip.value >= 1000 ? `${chip.value / 1000}K` : chip.value) : '?'}
            </div>

            <input
              type="number"
              placeholder="ערך"
              value={chip.value || ''}
              onChange={(e) => updateChip(index, 'value', parseInt(e.target.value) || 0)}
              className="w-24 bg-secondary border border-border rounded px-2 py-1.5 text-sm"
            />
            <input
              type="color"
              value={chip.color}
              onChange={(e) => updateChip(index, 'color', e.target.value)}
              className="w-10 h-8 rounded cursor-pointer"
            />
            <input
              type="text"
              placeholder="שם צבע"
              value={chip.color_name}
              onChange={(e) => updateChip(index, 'color_name', e.target.value)}
              className="w-24 bg-secondary border border-border rounded px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              placeholder="כמות"
              value={chip.quantity}
              onChange={(e) => updateChip(index, 'quantity', parseInt(e.target.value) || 0)}
              className="w-20 bg-secondary border border-border rounded px-2 py-1.5 text-sm"
            />
            <button onClick={() => removeChip(index)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button onClick={addChip} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-accent text-sm">
          <Plus className="w-4 h-4" /> הוסף צ'יפ
        </button>
      </div>

      {/* Distribution */}
      {distribution.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground">חלוקה לשחקן (Starting Stack: {startingStack.toLocaleString()})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {distribution.map((d, i) => (
              <div key={i} className="p-3 rounded-lg bg-card border border-border flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white/20 flex-shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <div>
                  <div className="font-semibold">{d.count} x {d.value.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">= {(d.count * d.value).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            סה"כ: {distribution.reduce((sum, d) => sum + d.count * d.value, 0).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

function calculateDistribution(chips: any[], startingStack: number): { value: number; color: string; count: number }[] {
  const sorted = [...chips].filter((c) => c.value > 0).sort((a, b) => a.value - b.value);
  if (sorted.length === 0) return [];

  const n = sorted.length;
  const allocated = sorted.map((chip) => ({ value: chip.value, color: chip.color, count: 0 }));

  // Poker-practical distribution:
  // 1. Reserve small chips for blinds/change (5 of each of the two smallest)
  // 2. Give 1 of the largest chip
  // 3. Fill the middle with second-largest denomination
  // 4. Remainder in mid-range chips

  // Step 1: Allocate from LARGEST to smallest with sensible counts
  // Largest: 1, then second-largest fills bulk, small chips for change
  let total = 0;

  // Start with largest: give 1 chip
  if (n >= 2) {
    const largestCount = Math.min(1, Math.floor(startingStack / sorted[n - 1].value));
    allocated[n - 1].count = largestCount;
    total += largestCount * sorted[n - 1].value;
  }

  // Reserve smallest chips: 5 each
  for (let i = 0; i < Math.min(2, n - 1); i++) {
    const count = Math.min(5, Math.floor((startingStack - total) / sorted[i].value));
    allocated[i].count = count;
    total += count * sorted[i].value;
  }

  // Middle chips: 1 each
  for (let i = 2; i < n - 2; i++) {
    const count = Math.min(1, Math.floor((startingStack - total) / sorted[i].value));
    allocated[i].count = count;
    total += count * sorted[i].value;
  }

  // Fill remaining with second-largest
  if (n >= 2) {
    const idx = n - 2;
    const fillCount = Math.floor((startingStack - total) / sorted[idx].value);
    allocated[idx].count += fillCount;
    total += fillCount * sorted[idx].value;
  }

  // Step 2: Adjust to reach exact stack
  let remaining = startingStack - total;
  let iter = 0;
  while (remaining !== 0 && iter < 300) {
    iter++;
    if (remaining > 0) {
      // Add chips — prefer second-largest, then mid-range
      let added = false;
      const order = n > 2
        ? [n - 2, n - 3, ...Array.from({length: n}, (_, i) => i).filter(i => i !== n-2 && i !== n-3).reverse()]
        : Array.from({length: n}, (_, i) => i).reverse();
      for (const i of order) {
        if (i >= 0 && i < n && sorted[i].value <= remaining) {
          allocated[i].count++;
          remaining -= sorted[i].value;
          added = true;
          break;
        }
      }
      if (!added) {
        allocated[0].count++;
        remaining -= sorted[0].value;
      }
    } else {
      // Over — remove from smallest that's > 0
      for (let i = 0; i < n; i++) {
        if (allocated[i].count > 0 && allocated[i].value <= -remaining) {
          allocated[i].count--;
          remaining += allocated[i].value;
          break;
        }
      }
      if (remaining < 0) {
        // Can't fix cleanly
        break;
      }
    }
  }

  return allocated.filter((c) => c.count > 0);
}
