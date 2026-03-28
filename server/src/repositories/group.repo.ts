import { Database } from '../db/connection.js';

export interface GroupRow {
  id: string;
  name: string;
  color: string;
  description: string | null;
  created_at: string;
}

export interface GroupWithMembers extends GroupRow {
  member_count: number;
  members: { player_id: string; player_name: string; avatar_color: string | null }[];
}

export class GroupRepo {
  constructor(private db: Database) {}

  create(data: { name: string; color?: string; description?: string }): GroupRow {
    const info = this.db.prepare(
      `INSERT INTO groups (name, color, description) VALUES (@name, @color, @description)`
    ).run({
      name: data.name,
      color: data.color || '#6366f1',
      description: data.description || null,
    });
    return this.db.prepare('SELECT * FROM groups WHERE rowid = ?').get(info.lastInsertRowid) as GroupRow;
  }

  getAll(): GroupWithMembers[] {
    const groups = this.db.prepare('SELECT * FROM groups ORDER BY name').all() as GroupRow[];
    return groups.map((g) => this.withMembers(g));
  }

  getById(id: string): GroupWithMembers | undefined {
    const group = this.db.prepare('SELECT * FROM groups WHERE id = ?').get(id) as GroupRow | undefined;
    if (!group) return undefined;
    return this.withMembers(group);
  }

  update(id: string, data: { name?: string; color?: string; description?: string }): GroupRow | undefined {
    this.db.prepare(
      `UPDATE groups SET
        name = COALESCE(@name, name),
        color = COALESCE(@color, color),
        description = COALESCE(@description, description)
      WHERE id = @id`
    ).run({ ...data, id });
    return this.db.prepare('SELECT * FROM groups WHERE id = ?').get(id) as GroupRow | undefined;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM groups WHERE id = ?').run(id);
  }

  // Members
  addMember(groupId: string, playerId: string): void {
    this.db.prepare(
      'INSERT OR IGNORE INTO group_members (group_id, player_id) VALUES (?, ?)'
    ).run(groupId, playerId);
  }

  addMembers(groupId: string, playerIds: string[]): void {
    const stmt = this.db.prepare(
      'INSERT OR IGNORE INTO group_members (group_id, player_id) VALUES (?, ?)'
    );
    const tx = this.db.transaction(() => {
      for (const pid of playerIds) {
        stmt.run(groupId, pid);
      }
    });
    tx();
  }

  removeMember(groupId: string, playerId: string): void {
    this.db.prepare(
      'DELETE FROM group_members WHERE group_id = ? AND player_id = ?'
    ).run(groupId, playerId);
  }

  getPlayerGroups(playerId: string): GroupRow[] {
    return this.db.prepare(
      `SELECT g.* FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.player_id = ?
       ORDER BY g.name`
    ).all(playerId) as GroupRow[];
  }

  getGroupPlayerIds(groupId: string): string[] {
    return this.db.prepare(
      'SELECT player_id FROM group_members WHERE group_id = ?'
    ).all(groupId).map((r: any) => r.player_id);
  }

  private withMembers(group: GroupRow): GroupWithMembers {
    const members = this.db.prepare(
      `SELECT p.id as player_id, p.name as player_name, p.avatar_color
       FROM players p
       JOIN group_members gm ON p.id = gm.player_id
       WHERE gm.group_id = ?
       ORDER BY p.name`
    ).all(group.id) as { player_id: string; player_name: string; avatar_color: string | null }[];

    return { ...group, member_count: members.length, members };
  }
}
