import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import bcrypt from 'bcryptjs';
import sessionOptions from '../../../lib/session';
import db from '../../../lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body || {};
    if (!username || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });

    const row = db.prepare('SELECT id, username, password, role FROM users WHERE username = ?').get(username);
    if (!row) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const ok = bcrypt.compareSync(password, row.password);
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const res = new NextResponse(JSON.stringify({ ok: true, user: { id: row.id, username: row.username, role: row.role } }), { status: 200 });
    const session = await getIronSession(req, res, sessionOptions);
    session.user = { id: row.id, username: row.username, role: row.role };
    await session.save();
    return res;
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
