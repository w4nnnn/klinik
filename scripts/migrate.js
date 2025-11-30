#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'clinic.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schemaPath = path.join(root, 'db', 'schema.sql');
if (!fs.existsSync(schemaPath)) {
  console.error('Schema file not found at', schemaPath);
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

function seedAdmin() {
  const userCount = db.prepare('SELECT COUNT(1) as c FROM users').get();
  if (userCount && userCount.c > 0) {
    console.log('Users already exist — skipping admin seed.');
    return;
  }

  const password = 'admin123';
  const hashed = bcrypt.hashSync(password, 10);
  const insert = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
  insert.run('admin', hashed, 'admin');
  console.log('Seeded default admin (username: admin, password: admin123)');
}

function seedCounters() {
  const existing = db.prepare('SELECT COUNT(1) as c FROM counters').get();
  if (existing && existing.c > 0) {
    console.log('Counters already exist — skipping counters seed.');
    return;
  }

  const insert = db.prepare('INSERT INTO counters (name, is_active) VALUES (?, ?)');
  insert.run('Poli Umum', 1);
  insert.run('Poli Gigi', 1);
  console.log('Seeded counters: Poli Umum, Poli Gigi');
}

try {
  db.transaction(() => {
    seedAdmin();
    seedCounters();
  })();
  console.log('Migration + seeding completed. DB at', dbPath);
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
} finally {
  try { db.close(); } catch (e) {}
}
