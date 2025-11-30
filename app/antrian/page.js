"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let t;
    if (open) {
      t = setTimeout(() => {
        setOpen(false);
        setTicket(null);
      }, 5000);
    }
    return () => clearTimeout(t);
  }, [open]);

  async function createTicket(type) {
    try {
      setLoading(true);
      const res = await fetch('/api/queue/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to create ticket');
      setTicket(json.ticket?.queue_number || json.ticket?.queue_number);
      setOpen(true);
    } catch (err) {
      console.error(err);
      alert('Gagal membuat nomor antrian. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-teal-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-teal-800">Selamat Datang di Klinik</h1>
          <p className="text-teal-700 mt-2">Silakan pilih layanan dengan menyentuh layar</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-8 flex items-center justify-center bg-white shadow-md rounded-xl">
            <Button
              className="w-full h-48 text-4xl font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => createTicket('Poli Umum')}
              disabled={loading}
            >
              Poli Umum
            </Button>
          </Card>

          <Card className="p-8 flex items-center justify-center bg-white shadow-md roundered-xl">
            <Button
              className="w-full h-48 text-4xl font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => createTicket('Poli Gigi')}
              disabled={loading}
            >
              Poli Gigi
            </Button>
          </Card>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg w-full mx-auto text-center p-8">
            <DialogHeader>
              <DialogTitle className="text-3xl">Nomor Antrian Anda</DialogTitle>
              <DialogDescription className="mt-4 text-xl text-teal-700">
                {ticket || '-'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <div className="mt-6">
                <p className="text-sm text-slate-600">Tunjukkan nomor ini ketika dipanggil.</p>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
