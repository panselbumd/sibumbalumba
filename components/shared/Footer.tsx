export function Footer() {
  return (
    <footer
      className="border-t mt-16"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="font-semibold mb-2">SIBUMBALUMBA</div>
          <p className="text-gray-500 max-w-xs">
            Sistem Informasi Badan Usaha Milik Daerah dan Badan Layanan Umum
            Daerah Kota Batu.
          </p>
        </div>
        <div>
          <div className="font-medium mb-2">Tautan</div>
          <ul className="space-y-1 text-gray-500">
            <li>Regulasi & SOP</li>
            <li>Jadwal Seleksi</li>
            <li>FAQ</li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-2">Kontak</div>
          <p className="text-gray-500">
            Pemerintah Kota Batu
            <br />
            Jawa Timur, Indonesia
          </p>
        </div>
      </div>
      <div
        className="text-center text-xs text-gray-400 py-4 border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        © {new Date().getFullYear()} Pemerintah Kota Batu — SIBUMBALUMBA
      </div>
    </footer>
  );
}
