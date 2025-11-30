"use client";
import React, { useState } from 'react';
import useSWR from 'swr';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function AdminPage() {
  const { data, error, mutate } = useSWR('/api/queue/status', fetcher, { refreshInterval: 2000 });
  const counters = data?.counters || [];
  const [busyMap, setBusyMap] = useState({});

  const setBusy = (id, v) => setBusyMap((s) => ({ ...s, [id]: v }));

  async function callNext(counter) {
    if (!counter) return;
    const next = (counter.waiting_list || [])[0];
    if (!next) return alert('Tidak ada pasien berikutnya untuk dipanggil pada loket ini.');
    try {
      setBusy(counter.id, true);
      const res = await fetch('/api/queue/process', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: next.id, action: 'CALL', counter_id: counter.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Gagal memanggil');
      await mutate();
    } catch (err) {
      console.error(err);
      alert('Gagal memanggil pasien.');
    } finally {
      setBusy(counter.id, false);
    }
  }

  async function finishCurrent(counter) {
    if (!counter || !counter.current) return;
    try {
      setBusy(counter.id, true);
      const res = await fetch('/api/queue/process', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: counter.current.id, action: 'FINISH' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Gagal menyelesaikan');
      await mutate();
    } catch (err) {
      console.error(err);
      alert('Gagal menyelesaikan panggilan.');
    } finally {
      setBusy(counter.id, false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {counters.length === 0 && (
            <div className="col-span-full">
              <Card className="p-6 flex items-center justify-center">
                <div className="text-slate-600">Tidak ada loket ditemukan.</div>
              </Card>
            </div>
          )}

          {counters.map((c) => (
            <div key={c.id}>
              <Card className="h-full flex flex-col items-center justify-between p-6">
                <div className="w-full text-left mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{c.name}</h3>
                    <Badge className="bg-slate-100 text-slate-800">{(c.waiting_list || []).length} waiting</Badge>
                  </div>
                  <Separator className="my-3" />
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="text-6xl font-extrabold tracking-wider leading-tight">{c.current?.queue_number || '-'}</div>
                  <div className="mt-3 text-lg text-slate-600">{c.current?.counter_name || (c.current?.counter_id ? `Loket ${c.current.counter_id}` : 'Silakan menunggu...')}</div>
                </div>

                <div className="w-full mt-6" style={{ height: '40%' }}>
                  <div className="text-sm text-slate-500 mb-2">Daftar Menunggu</div>
                  <div className="grid gap-2">
                    {(c.waiting_list || []).slice(0, 6).map((w) => (
                      <div key={w.id} className="flex items-center justify-between p-2 rounded-md bg-slate-50">
                        <div className="font-medium">{w.queue_number}</div>
                        <div className="text-sm text-slate-600">{w.type || '-'}</div>
                      </div>
                    ))}
                    {(c.waiting_list || []).length === 0 && (
                      <div className="text-sm text-slate-500">Kosong</div>
                    )}
                  </div>
                </div>

                <div className="w-full mt-6 grid grid-cols-2 gap-3">
                  <Button onClick={() => callNext(c)} disabled={busyMap[c.id]} className="bg-teal-600 hover:bg-teal-700 text-white">
                    Call Next
                  </Button>
                  <Button onClick={() => finishCurrent(c)} disabled={busyMap[c.id] || !c.current} className="bg-slate-700 hover:bg-slate-800 text-white">
                    Finish
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
