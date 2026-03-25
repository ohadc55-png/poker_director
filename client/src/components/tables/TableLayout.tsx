import { useState, useEffect } from 'react';
import { Shuffle, Scale, Plus, X } from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

interface TableLayoutProps {
  tournamentId: string;
}

export function TableLayout({ tournamentId }: TableLayoutProps) {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTableCount, setNewTableCount] = useState(1);
  const [newMaxSeats, setNewMaxSeats] = useState(9);

  const loadTables = async () => {
    try {
      const data = await api.getTables(tournamentId);
      setTables(data);
    } catch {}
  };

  useEffect(() => {
    loadTables();
  }, [tournamentId]);

  const handleCreateTables = async () => {
    setLoading(true);
    try {
      await api.createTables(tournamentId, newTableCount, newMaxSeats);
      await loadTables();
    } finally {
      setLoading(false);
    }
  };

  const handleRandomSeat = async () => {
    setLoading(true);
    try {
      await api.seatRandomly(tournamentId);
      await loadTables();
    } finally {
      setLoading(false);
    }
  };

  const handleBalance = async () => {
    setLoading(true);
    try {
      const moves = await api.balanceTables(tournamentId);
      if (moves.length > 0) {
        alert(`העברות:\n${moves.map((m: any) => `${m.player_name}: ${m.from} → ${m.to}`).join('\n')}`);
      } else {
        alert('השולחנות מאוזנים');
      }
      await loadTables();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">שולחנות ({tables.length})</h2>
        <div className="flex gap-2">
          <button
            onClick={handleRandomSeat}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
          >
            <Shuffle className="w-4 h-4" /> הושבה אקראית
          </button>
          <button
            onClick={handleBalance}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-accent text-sm"
          >
            <Scale className="w-4 h-4" /> איזון שולחנות
          </button>
        </div>
      </div>

      {/* Create tables */}
      {tables.length === 0 && (
        <div className="p-4 rounded-lg bg-card border border-border space-y-3">
          <h3 className="font-semibold">צור שולחנות</h3>
          <div className="flex gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">מספר שולחנות</label>
              <input
                type="number"
                value={newTableCount}
                onChange={(e) => setNewTableCount(parseInt(e.target.value) || 1)}
                className="w-20 bg-secondary border border-border rounded px-2 py-1.5 text-sm"
                min={1}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">מקומות לשולחן</label>
              <select
                value={newMaxSeats}
                onChange={(e) => setNewMaxSeats(parseInt(e.target.value))}
                className="bg-secondary border border-border rounded px-2 py-1.5 text-sm"
              >
                <option value={6}>6</option>
                <option value={8}>8</option>
                <option value={9}>9</option>
                <option value={10}>10</option>
              </select>
            </div>
            <button
              onClick={handleCreateTables}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
            >
              <Plus className="w-4 h-4" /> צור
            </button>
          </div>
        </div>
      )}

      {/* Visual table layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <div key={table.id} className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{table.table_name || `Table ${table.table_number}`}</h3>
              <span className="text-xs text-muted-foreground">
                {table.player_count || 0}/{table.max_seats}
              </span>
            </div>

            {/* Oval table representation */}
            <div className="relative w-full aspect-[1.6] bg-green-900/30 rounded-[50%] border-2 border-green-800/50 flex items-center justify-center">
              <span className="text-xs text-green-600 font-semibold">T{table.table_number}</span>

              {/* Seats around the table */}
              {Array.from({ length: table.max_seats }).map((_, seatIdx) => {
                const angle = (seatIdx / table.max_seats) * 2 * Math.PI - Math.PI / 2;
                const radiusX = 48;
                const radiusY = 42;
                const left = 50 + radiusX * Math.cos(angle);
                const top = 50 + radiusY * Math.sin(angle);
                const player = table.players?.find((p: any) => p.seat_number === seatIdx + 1);

                return (
                  <div
                    key={seatIdx}
                    className={cn(
                      'absolute w-8 h-8 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[10px] font-medium border',
                      player ? 'bg-primary/20 border-primary text-primary' : 'bg-secondary border-border text-muted-foreground'
                    )}
                    style={{ left: `${left}%`, top: `${top}%` }}
                    title={player?.player_name || `Seat ${seatIdx + 1}`}
                  >
                    {player ? player.player_name?.charAt(0).toUpperCase() : seatIdx + 1}
                  </div>
                );
              })}
            </div>

            {/* Player list */}
            {table.players && table.players.length > 0 && (
              <div className="mt-3 space-y-1">
                {table.players.map((p: any) => (
                  <div key={p.player_id} className="text-xs flex justify-between text-muted-foreground">
                    <span>Seat {p.seat_number}: {p.player_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
