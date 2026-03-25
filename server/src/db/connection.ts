import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

// Wrapper class that provides a better-sqlite3-like synchronous API around sql.js
export class Database {
  private db: SqlJsDatabase;
  private dbPath: string;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private inTransaction = false;

  constructor(db: SqlJsDatabase, dbPath: string) {
    this.db = db;
    this.dbPath = dbPath;
  }

  pragma(statement: string): void {
    try {
      this.db.run(`PRAGMA ${statement}`);
    } catch {
      // sql.js doesn't support all pragmas (like WAL mode) — ignore silently
    }
  }

  exec(sql: string): void {
    this.db.run(sql);
    if (!this.inTransaction) this.scheduleSave();
  }

  prepare(sql: string): Statement {
    return new Statement(this.db, sql, this);
  }

  transaction<T>(fn: () => T): () => T {
    return () => {
      this.inTransaction = true;
      this.db.run('BEGIN');
      try {
        const result = fn();
        this.db.run('COMMIT');
        this.inTransaction = false;
        this.scheduleSave();
        return result;
      } catch (err) {
        try { this.db.run('ROLLBACK'); } catch { /* already rolled back */ }
        this.inTransaction = false;
        throw err;
      }
    };
  }

  save(): void {
    const data = this.db.export();
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.dbPath, Buffer.from(data));
  }

  scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), 500);
  }

  close(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.save();
    }
    this.db.close();
  }

  getRaw(): SqlJsDatabase {
    return this.db;
  }
}

class Statement {
  private db: SqlJsDatabase;
  private sql: string;
  private wrapper: Database;

  constructor(db: SqlJsDatabase, sql: string, wrapper: Database) {
    this.db = db;
    this.sql = sql;
    this.wrapper = wrapper;
  }

  run(...params: any[]): { lastInsertRowid: number; changes: number } {
    const bindParams = this.resolveParams(params);
    this.db.run(this.sql, bindParams);
    const lastId = (this.db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] ?? 0) as number;
    const changes = this.db.getRowsModified();
    this.wrapper.scheduleSave();
    return { lastInsertRowid: lastId, changes };
  }

  get(...params: any[]): any {
    const bindParams = this.resolveParams(params);
    const stmt = this.db.prepare(this.sql);
    try {
      stmt.bind(bindParams);
      let result: any = undefined;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      return result;
    } finally {
      stmt.free();
    }
  }

  all(...params: any[]): any[] {
    const bindParams = this.resolveParams(params);
    const stmt = this.db.prepare(this.sql);
    try {
      stmt.bind(bindParams);
      const results: any[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      return results;
    } finally {
      stmt.free();
    }
  }

  private resolveParams(params: any[]): any {
    if (params.length === 0) return [];
    if (params.length === 1 && typeof params[0] === 'object' && params[0] !== null && !Array.isArray(params[0])) {
      // Named parameters — sql.js uses $name, :name, or @name
      const obj = params[0];
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[`@${key}`] = value === undefined ? null : value;
      }
      return result;
    }
    // Positional parameters
    return params;
  }
}

let db: Database | null = null;

export async function initDatabase(dbPath: string): Promise<Database> {
  const SQL = await initSqlJs();

  let sqlDb: SqlJsDatabase;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(buffer);
  } else {
    sqlDb = new SQL.Database();
  }

  db = new Database(sqlDb, dbPath);

  // Enable foreign keys (WAL not supported in sql.js - it's in-memory)
  db.pragma('foreign_keys = ON');

  return db;
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}
