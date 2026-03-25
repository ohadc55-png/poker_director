import { useState, useEffect } from 'react';
import { Save, Calculator } from 'lucide-react';
import { useTournamentStore } from '../../stores/tournamentStore';
import { api } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { PRIZE_TEMPLATES } from '@poker/shared';

interface PayoutEditorProps {
  tournamentId: string;
}

export function PayoutEditor({ tournamentId }: PayoutEditorProps) {
  const { tournament, prizes, setPrizes } = useTournamentStore();
  const [localPrizes, setLocalPrizes] = useState(
    prizes.length > 0
      ? prizes.map((p) => ({ place: p.place, percentage: p.percentage || 0, fixed_amount: p.fixed_amount }))
      : [{ place: 1, percentage: 100, fixed_amount: null as number | null }]
  );
  const [financials, setFinancials] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getFinancials(tournamentId).then(setFinancials).catch(() => {});
  }, [tournamentId]);

  const prizePool = financials?.total_prize_pool || tournament?.stats?.prize_pool || 0;
  const totalPercent = localPrizes.reduce((sum, p) => sum + (p.percentage || 0), 0);

  const addPlace = () => {
    const nextPlace = localPrizes.length + 1;
    setLocalPrizes([...localPrizes, { place: nextPlace, percentage: 0, fixed_amount: null }]);
  };

  const removePlace = (index: number) => {
    setLocalPrizes(localPrizes.filter((_, i) => i !== index).map((p, i) => ({ ...p, place: i + 1 })));
  };

  const updatePrize = (index: number, field: string, value: number) => {
    const updated = [...localPrizes];
    updated[index] = { ...updated[index], [field]: value };
    setLocalPrizes(updated);
  };

  const applyTemplate = (templateKey: keyof typeof PRIZE_TEMPLATES) => {
    const template = PRIZE_TEMPLATES[templateKey];
    setLocalPrizes(template.map((t) => ({ place: t.place, percentage: t.percentage, fixed_amount: null })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setPrizes(tournamentId, localPrizes);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">חלוקת פרסים</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? 'שומר...' : 'שמור'}
        </button>
      </div>

      {/* Prize pool summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard label="Prize Pool" value={formatCurrency(prizePool, tournament?.currency)} />
        <InfoCard label="Buy-ins" value={formatCurrency(financials?.total_buyins || 0, tournament?.currency)} />
        <InfoCard label="Rebuys" value={formatCurrency(financials?.total_rebuys || 0, tournament?.currency)} />
        <InfoCard label="Add-ons" value={formatCurrency(financials?.total_addons || 0, tournament?.currency)} />
      </div>

      {/* Templates */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground py-1">תבניות:</span>
        {Object.entries(PRIZE_TEMPLATES).map(([key, template]) => (
          <button
            key={key}
            onClick={() => applyTemplate(key as keyof typeof PRIZE_TEMPLATES)}
            className="px-3 py-1 rounded-lg bg-secondary hover:bg-accent text-xs"
          >
            {key.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Payout table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="px-3 py-2 text-start">מקום</th>
            <th className="px-3 py-2 text-start">אחוז (%)</th>
            <th className="px-3 py-2 text-start">סכום</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {localPrizes.map((prize, index) => (
            <tr key={index} className="border-b border-border/50">
              <td className="px-3 py-2 font-medium">#{prize.place}</td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  value={prize.percentage}
                  onChange={(e) => updatePrize(index, 'percentage', parseFloat(e.target.value) || 0)}
                  className="bg-transparent border border-border rounded px-2 py-1 w-20"
                  step="0.5"
                />
                %
              </td>
              <td className="px-3 py-2 font-semibold text-primary">
                {formatCurrency(Math.round(prizePool * (prize.percentage || 0) / 100), tournament?.currency)}
              </td>
              <td className="px-3 py-2">
                <button onClick={() => removePlace(index)} className="text-muted-foreground hover:text-destructive text-xs">
                  X
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border font-semibold">
            <td className="px-3 py-2">סה"כ</td>
            <td className="px-3 py-2" style={{ color: Math.abs(totalPercent - 100) > 0.01 ? '#ef4444' : undefined }}>
              {totalPercent}%
            </td>
            <td className="px-3 py-2 text-primary">
              {formatCurrency(Math.round(prizePool * totalPercent / 100), tournament?.currency)}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <button onClick={addPlace} className="px-3 py-2 rounded-lg bg-secondary hover:bg-accent text-sm">
        + הוסף מקום
      </button>

      {Math.abs(totalPercent - 100) > 0.01 && (
        <p className="text-destructive text-sm">
          סה"כ האחוזים חייב להיות 100% (כרגע: {totalPercent}%)
        </p>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-card border border-border">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold mt-1">{value}</div>
    </div>
  );
}
