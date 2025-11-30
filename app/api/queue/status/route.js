import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

export async function GET() {
  try {
    // Get counters
    const counters = db.prepare('SELECT id, name, is_active FROM counters ORDER BY id').all();

    // For each counter, fetch its current called ticket and waiting list (matching by type=name)
    const result = counters.map((c) => {
      const current = db.prepare(`
        SELECT q.*, ct.name AS counter_name
        FROM queues q
        LEFT JOIN counters ct ON q.counter_id = ct.id
        WHERE q.status = 'CALLED' AND q.counter_id = ?
        ORDER BY q.updated_at DESC
        LIMIT 1
      `).get(c.id);

      const waiting = db.prepare('SELECT * FROM queues WHERE status = ? AND type = ? ORDER BY created_at ASC LIMIT 100').all('WAITING', c.name);

      return {
        id: c.id,
        name: c.name,
        is_active: c.is_active,
        current: current || null,
        waiting_list: waiting || [],
      };
    });

    // Also include a global waiting_list for backward compatibility
    const global_waiting = db.prepare("SELECT * FROM queues WHERE status = 'WAITING' ORDER BY created_at ASC LIMIT 100").all();

    return NextResponse.json({ counters: result, waiting_list: global_waiting });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
