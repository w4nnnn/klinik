"use client";
import React, { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import useTTS from '@/hooks/use-tts';

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function TVPage() {
  const { announce, prime, cancel, needsUserInteraction } = useTTS();
  // Start muted until the TTS system is primed / user enables audio
  const [isMuted, setIsMuted] = useState(true);

  // When the TTS hook reports no longer needing user interaction, consider audio enabled
  React.useEffect(() => {
    if (!needsUserInteraction) setIsMuted(false);
  }, [needsUserInteraction]);
  const { data, error } = useSWR('/api/queue/status', fetcher, { refreshInterval: 2000 });
  const prevNumbersRef = useRef({}); // map counterId -> last announced queue_number

  const counters = data?.counters || [];

  // Announce when any counter's current changes
  useEffect(() => {
    if (!counters || counters.length === 0) return;
    counters.forEach((c) => {
      const cur = c.current;
      if (!cur || !cur.queue_number) return;
      const last = prevNumbersRef.current[c.id];
      if (last === cur.queue_number) return;
      prevNumbersRef.current[c.id] = cur.queue_number;
      if (isMuted) return;
      const counterName = cur.counter_name ? cur.counter_name : (cur.counter_id ? `Loket ${cur.counter_id}` : null);
      try {
        announce(cur.queue_number, counterName);
      } catch (e) {
        // ignore
      }
    });
  }, [counters, announce, isMuted]);

  return (
    <main className="min-h-screen bg-white p-6 justify-center">
      <div className="relative">
        <div className="fixed top-2 right-4 z-50 flex gap-2">
          <Button
            onClick={() => {
              setIsMuted((v) => {
                const next = !v;
                // if muting, cancel any ongoing speech; if unmuting, attempt to prime audio
                if (next) cancel();
                else prime();
                return next;
              });
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white"
            aria-label={isMuted ? 'Enable audio' : 'Disable audio'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch" style={{ height: 'calc(100vh - 48px)' }}>
          {counters.length === 0 && (
            <div className="col-span-full">
              <Card className="h-full p-6 bg-white shadow-lg flex items-center justify-center">
                <div className="text-center text-slate-600">Tidak ada loket ditemukan.</div>
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
                  <div className="text-6xl font-extrabold tracking-wider leading-tight">
                    {c.current?.queue_number || '-'}
                  </div>
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
              </Card>
            </div>
          ))}
        </div>

        {needsUserInteraction && (
          <div className="fixed bottom-6 left-6 z-50">
            <Button
              onClick={() => {
                prime();
                setIsMuted(false);
              }}
              className="bg-yellow-400 text-black"
            >
              Tap to enable audio
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
