import { Database } from '../db/connection.js';
import type { BlindTemplate, TournamentTemplate } from '@poker/shared';

export class TemplateRepo {
  private stmts: ReturnType<typeof this.prepareStatements>;

  constructor(private db: Database) {
    this.stmts = this.prepareStatements();
  }

  private prepareStatements() {
    return {
      // Blind templates
      createBlindTemplate: this.db.prepare(`
        INSERT INTO blind_templates (name, description, style, levels_json)
        VALUES (@name, @description, @style, @levels_json)
      `),
      getBlindTemplates: this.db.prepare('SELECT * FROM blind_templates ORDER BY name'),
      getBlindTemplate: this.db.prepare('SELECT * FROM blind_templates WHERE id = ?'),
      deleteBlindTemplate: this.db.prepare('DELETE FROM blind_templates WHERE id = ?'),

      // Tournament templates
      createTournamentTemplate: this.db.prepare(`
        INSERT INTO tournament_templates (name, description, config_json)
        VALUES (@name, @description, @config_json)
      `),
      getTournamentTemplates: this.db.prepare('SELECT * FROM tournament_templates ORDER BY name'),
      getTournamentTemplate: this.db.prepare('SELECT * FROM tournament_templates WHERE id = ?'),
      deleteTournamentTemplate: this.db.prepare('DELETE FROM tournament_templates WHERE id = ?'),
    };
  }

  // Blind templates
  createBlindTemplate(data: { name: string; description?: string; style: string; levels_json: string }): BlindTemplate {
    const info = this.stmts.createBlindTemplate.run({
      ...data,
      description: data.description || null,
    });
    return this.db.prepare('SELECT * FROM blind_templates WHERE rowid = ?').get(info.lastInsertRowid) as BlindTemplate;
  }

  getBlindTemplates(): BlindTemplate[] {
    return this.stmts.getBlindTemplates.all() as BlindTemplate[];
  }

  getBlindTemplate(id: string): BlindTemplate | undefined {
    return this.stmts.getBlindTemplate.get(id) as BlindTemplate | undefined;
  }

  deleteBlindTemplate(id: string): void {
    this.stmts.deleteBlindTemplate.run(id);
  }

  // Tournament templates
  createTournamentTemplate(data: { name: string; description?: string; config_json: string }): TournamentTemplate {
    const info = this.stmts.createTournamentTemplate.run({
      ...data,
      description: data.description || null,
    });
    return this.db.prepare('SELECT * FROM tournament_templates WHERE rowid = ?').get(info.lastInsertRowid) as TournamentTemplate;
  }

  getTournamentTemplates(): TournamentTemplate[] {
    return this.stmts.getTournamentTemplates.all() as TournamentTemplate[];
  }

  getTournamentTemplate(id: string): TournamentTemplate | undefined {
    return this.stmts.getTournamentTemplate.get(id) as TournamentTemplate | undefined;
  }

  deleteTournamentTemplate(id: string): void {
    this.stmts.deleteTournamentTemplate.run(id);
  }
}
