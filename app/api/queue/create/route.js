import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

function makePrefix(type) {
  if (!type) return 'A';
  const t = String(type).trim().toLowerCase();
  // Explicit mappings for clinic services
  if (t.includes('umum') || t.includes('general')) return 'A';
  if (t.includes('gigi') || t.includes('dental')) return 'B';

  const parts = String(type).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A';
  return parts.map(p => p[0].toUpperCase()).join('').slice(0, 1);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const type = body?.type || 'General';

    const prefix = makePrefix(type);
    const last = db.prepare(
      "SELECT queue_number FROM queues WHERE type = ? AND DATE(created_at) = DATE('now','localtime') ORDER BY id DESC LIMIT 1"
    ).get(type);

    let nextNum = 1;
    if (last && last.queue_number) {
      const parts = String(last.queue_number).split('-');
      const num = parseInt(parts[1], 10);
      if (!isNaN(num)) nextNum = num + 1;
    }

    const ticket = `${prefix}-${String(nextNum).padStart(3, '0')}`;
    const insert = db.prepare('INSERT INTO queues (queue_number, type, status) VALUES (?, ?, ?)');
    const info = insert.run(ticket, type, 'WAITING');
    const row = db.prepare('SELECT * FROM queues WHERE id = ?').get(info.lastInsertRowid);
    return NextResponse.json({ ok: true, ticket: row }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
