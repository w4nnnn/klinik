import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import sessionOptions from '../../../../lib/session';
import db from '../../../../lib/db';

async function requireAuth(req, res) {
  const session = await getIronSession(req, res, sessionOptions);
  if (!session?.user) return null;
  return session.user;
}

export async function PATCH(req) {
  try {
    const res = new NextResponse();
    const user = await requireAuth(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, action, counter_id } = body || {};
    if (!id || !action) return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });

    const actions = {
      CALL: "UPDATE queues SET status = 'CALLED', counter_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      SKIP: "UPDATE queues SET status = 'SKIPPED', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      FINISH: "UPDATE queues SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    };

    const sql = actions[action];
    if (!sql) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    if (action === 'CALL') {
      db.prepare(sql).run(counter_id || null, id);
    } else {
      db.prepare(sql).run(id);
    }

    const updated = db.prepare('SELECT * FROM queues WHERE id = ?').get(id);
    return NextResponse.json({ ok: true, updated });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
