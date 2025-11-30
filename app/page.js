export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow px-8 py-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Demo Klinik — Petunjuk Singkat</h1>
        <p className="text-slate-600 mb-6">Aplikasi demo ini menampilkan sistem antrian klinik sederhana. Gunakan link di bawah untuk menjelajahi fitur.</p>

        <div className="grid gap-4 mb-6">
          <a href="/antrian" className="block p-4 rounded border hover:bg-slate-50">
            <strong>/antrian</strong> — Kiosk touchscreen untuk pasien mengambil nomor antrian.
          </a>
          <a href="/tv" className="block p-4 rounded border hover:bg-slate-50">
            <strong>/tv</strong> — Tampilan TV yang menampilkan nomor yang dipanggil per loket dan memutar suara (TTS).
          </a>
          <a href="/admin" className="block p-4 rounded border hover:bg-slate-50">
            <strong>/admin</strong> — Dashboard admin untuk memanggil pasien (Call Next) dan menyelesaikan panggilan.
          </a>
          <a href="/login" className="block p-4 rounded border hover:bg-slate-50">
            <strong>/login</strong> — Halaman masuk untuk admin.
          </a>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Akses Admin</h2>
          <div className="bg-slate-100 p-3 rounded">
            <div className="font-medium">Username: <span className="font-normal">admin</span></div>
            <div className="font-medium">Password: <span className="font-normal">admin123</span></div>
          </div>
        </div>
      </div>
    </main>
  );
}
