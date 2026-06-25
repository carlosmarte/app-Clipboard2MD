import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

// DB location is configurable so the container can point it at a mounted
// volume (see docker-compose.yml). Defaults to ./data alongside the server.
const DB_PATH = resolve(process.env.DB_PATH || "./data/clipboard2md.db");

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS conversions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_input       TEXT NOT NULL,
    markdown_output TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const insertStmt = db.prepare(
  `INSERT INTO conversions (raw_input, markdown_output)
   VALUES (@raw, @markdown)`
);

const listStmt = db.prepare(
  `SELECT id, raw_input AS raw, markdown_output AS markdown, created_at AS createdAt
   FROM conversions
   ORDER BY id DESC
   LIMIT @limit`
);

const getStmt = db.prepare(
  `SELECT id, raw_input AS raw, markdown_output AS markdown, created_at AS createdAt
   FROM conversions
   WHERE id = @id`
);

export function saveConversion({ raw, markdown }) {
  const info = insertStmt.run({ raw, markdown });
  return getStmt.get({ id: info.lastInsertRowid });
}

export function listConversions(limit = 50) {
  return listStmt.all({ limit });
}

export { DB_PATH };
export default db;
