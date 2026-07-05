import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIBUMBALUMBA - Kota Batu",
  description:
    "Sistem Informasi BUMD dan BLUD Kota Batu — Manajemen, Monitoring, Evaluasi, Seleksi dan AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      {/*
        suppressHydrationWarning WAJIB ada di sini karena script di
        bawah memodifikasi class pada elemen <html> ini SEBELUM React
        sempat hydrate. Tanpa flag ini, React mendeteksi mismatch pada
        elemen root (html) — bukan sekadar warning kosmetik, ini bisa
        membuat React GAGAL hydrate seluruh halaman, sehingga semua
        interaktivitas (termasuk form login) mati total dan form
        submit secara native (reload polos, kembali kosong tanpa
        pesan error apa pun) — persis gejala yang dilaporkan.
      */}
      <head>
        {/*
          Script ini SENGAJA inline & synchronous (bukan di useEffect
          komponen manapun) supaya jalan SEBELUM cat pertama browser,
          dan berlaku di SEMUA halaman — termasuk /login yang tidak
          merender <Navbar>/<ThemeToggle>. Sebelumnya, logika dark mode
          hanya ada di dalam ThemeToggle (dipakai Navbar), sehingga
          halaman tanpa Navbar (login, dsb.) selalu tampil terang
          walau preferensi tersimpan gelap — inilah penyebab bug
          "background jadi putih saat refresh halaman login".
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem('sibumbalumba-theme');
                  var prefersDark = stored === 'dark' ||
                    (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (prefersDark) document.documentElement.classList.add('dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
