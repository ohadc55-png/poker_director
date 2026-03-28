import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Users, ChevronDown, ChevronUp, UserPlus } from 'lucide-react';
import { api } from '../../lib/api';
import { cn, generateAvatarColor, getPlayerInitials } from '../../lib/utils';
import type { PlayerWithStats } from '@poker/shared';

interface Group {
  id: string;
  name: string;
  color: string;
  description: string | null;
  member_count: number;
  members: { player_id: string; player_name: string; avatar_color: string | null }[];
}

interface GroupManagerProps {
  allPlayers: PlayerWithStats[];
  onChanged?: () => void;
}

export function GroupManager({ allPlayers, onChanged }: GroupManagerProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const loadGroups = async () => {
    try {
      const data = await api.getGroups();
      setGroups(data);
    } catch {}
  };

  useEffect(() => { loadGroups(); }, []);

  const handleCreate = async (name: string, color: string) => {
    await api.createGroup({ name, color });
    setShowCreate(false);
    loadGroups();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק קבוצה?')) return;
    await api.deleteGroup(id);
    loadGroups();
  };

  const handleAddMembers = async (groupId: string, playerIds: string[]) => {
    await api.addGroupMembers(groupId, playerIds);
    setAddingTo(null);
    loadGroups();
    onChanged?.();
  };

  const handleRemoveMember = async (groupId: string, playerId: string) => {
    await api.removeGroupMember(groupId, playerId);
    loadGroups();
    onChanged?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Users className="w-5 h-5" />
          קבוצות
        </h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
        >
          <Plus className="w-4 h-4" />
          קבוצה חדשה
        </button>
      </div>

      {showCreate && (
        <CreateGroupForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {groups.length === 0 && !showCreate && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          אין קבוצות עדיין. צור קבוצה כדי לארגן שחקנים.
        </p>
      )}

      {groups.map((group) => {
        const isExpanded = expandedId === group.id;
        return (
          <div key={group.id} className="rounded-lg border border-border overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : group.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
                <span className="font-medium">{group.name}</span>
                <span className="text-xs text-muted-foreground">{group.member_count} שחקנים</span>
              </div>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-4 pb-3 border-t border-border/50 space-y-2 pt-2">
                {/* Members */}
                <div className="flex flex-wrap gap-2">
                  {group.members.map((m) => (
                    <div
                      key={m.player_id}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary text-sm"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: m.avatar_color || generateAvatarColor(m.player_name) }}
                      >
                        {getPlayerInitials(m.player_name)}
                      </div>
                      <span>{m.player_name}</span>
                      <button
                        onClick={() => handleRemoveMember(group.id, m.player_id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {group.members.length === 0 && (
                    <span className="text-xs text-muted-foreground">אין שחקנים בקבוצה</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setAddingTo(addingTo === group.id ? null : group.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    הוסף שחקנים
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    מחק קבוצה
                  </button>
                </div>

                {/* Add members picker */}
                {addingTo === group.id && (
                  <AddMembersPicker
                    players={allPlayers}
                    existingIds={new Set(group.members.map((m) => m.player_id))}
                    onAdd={(ids) => handleAddMembers(group.id, ids)}
                    onCancel={() => setAddingTo(null)}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CreateGroupForm({ onSubmit, onCancel }: { onSubmit: (name: string, color: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');

  const presetColors = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'];

  return (
    <div className="p-4 rounded-lg bg-card border border-border space-y-3 animate-slide-in">
      <h3 className="font-semibold text-sm">קבוצה חדשה</h3>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground block mb-1">שם הקבוצה</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="למשל: חברים מהעבודה"
            className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm"
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">צבע</label>
          <div className="flex gap-1.5">
            {presetColors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  'w-7 h-7 rounded-full border-2 transition-all',
                  color === c ? 'border-white scale-110' : 'border-transparent'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => name.trim() && onSubmit(name.trim(), color)}
          disabled={!name.trim()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50"
        >
          צור קבוצה
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-secondary text-sm">ביטול</button>
      </div>
    </div>
  );
}

function AddMembersPicker({
  players,
  existingIds,
  onAdd,
  onCancel,
}: {
  players: PlayerWithStats[];
  existingIds: Set<string>;
  onAdd: (ids: string[]) => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const available = players.filter((p) => !existingIds.has(p.id));
  const filtered = search
    ? available.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.nickname?.toLowerCase().includes(search.toLowerCase()))
    : available;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2 animate-slide-in">
      <input
        type="text"
        placeholder="חיפוש שחקן..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm"
        autoFocus
      />
      <div className="max-h-40 overflow-auto space-y-1">
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => toggle(p.id)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm text-start transition-colors',
              selected.has(p.id) ? 'bg-primary/15 text-primary' : 'hover:bg-accent'
            )}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: p.avatar_color || generateAvatarColor(p.name) }}
            >
              {getPlayerInitials(p.name)}
            </div>
            <span>{p.name}</span>
            {selected.has(p.id) && <span className="text-xs ms-auto">✓</span>}
          </button>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">אין שחקנים זמינים</p>}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => selected.size > 0 && onAdd(Array.from(selected))}
          disabled={selected.size === 0}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs disabled:opacity-50"
        >
          הוסף {selected.size > 0 ? `(${selected.size})` : ''}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg bg-secondary text-xs">ביטול</button>
      </div>
    </div>
  );
}
