import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET() {
  try {
    const rows = db.prepare('SELECT id, name, is_active FROM counters ORDER BY id').all();
    return NextResponse.json({ ok: true, counters: rows });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
