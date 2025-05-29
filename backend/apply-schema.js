import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

(async () => {
  try {
    // Open or create the SQLite database file
    const dbPath = path.resolve('logs.db');
    const db = new Database(dbPath);

    // Read the schema SQL
    const schemaPath = path.resolve('db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute each statement
    for (const stmt of schema.split(';').map(s => s.trim()).filter(Boolean)) {
      db.exec(stmt);
    }

    db.close();
    console.log('✅ Schema applied successfully');
  } catch (err) {
    console.error('❌ Schema application failed:', err);
    process.exit(1);
  }
})();