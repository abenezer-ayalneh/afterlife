import { DatabaseSync, backup } from 'node:sqlite';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// A narrow async-shaped interface keeps SQL operations portable. Transactions
// execute synchronously on one connection: no request can interleave a batch.
export function openDatabase(filename) {
  if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true, mode: 0o700 });
  const connection = new DatabaseSync(filename);
  connection.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  function prepare(sql) {
    const statement = connection.prepare(sql);
    const make = values => ({
      bind: (...args) => make(args),
      async first() { const row=statement.get(...values); return row ? {...row} : null; },
      async all() { return {results:statement.all(...values).map(row=>({...row}))}; },
      async run() { return this.execute(); },
      execute() { const result=statement.run(...values); return {meta:{changes:Number(result.changes)}}; },
    });
    return make([]);
  }
  return {
    prepare,
    async batch(statements) {
      connection.exec('BEGIN IMMEDIATE');
      try { const results=statements.map(statement=>statement.execute()); connection.exec('COMMIT'); return results; }
      catch(error) { connection.exec('ROLLBACK'); throw error; }
    },
    connection,
    close() { connection.close(); },
    async backup(destination) { await backup(connection, destination); },
  };
}

export function migrate(db, directory=resolve('migrations')) {
  db.connection.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
  for(const name of readdirSync(directory).filter(name=>/^\d+.*\.sql$/.test(name)).sort()) {
    db.connection.exec('BEGIN IMMEDIATE');
    try {
      if(!db.connection.prepare('SELECT name FROM schema_migrations WHERE name=?').get(name)) {
        db.connection.exec(readFileSync(resolve(directory,name),'utf8'));
        db.connection.prepare('INSERT INTO schema_migrations(name) VALUES(?)').run(name);
      }
      db.connection.exec('COMMIT');
    } catch(error) { db.connection.exec('ROLLBACK'); throw error; }
  }
}
