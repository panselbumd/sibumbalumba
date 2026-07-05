import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

const MENU = [
  { href: "/", label: "Beranda" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/bumd", label: "BUMD" },
  { href: "/blud", label: "BLUD" },
  { href: "/seleksi", label: "Seleksi" },
  { href: "/regulasi", label: "Regulasi" },
  { href: "/berita", label: "Berita" },
];

export function Navbar() {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur border-b"
      style={{
        borderColor: "var(--color-border)",
        background: "color-mix(in srgb, var(--color-surface) 85%, transparent)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold text-sm tracking-tight shrink-0">
          SIBUMBALUMBA
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm overflow-x-auto">
          {MENU.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-md text-gray-500 hover:text-current hover:bg-black/5 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm rounded-md px-3 py-1.5 text-white"
            style={{ background: "var(--color-primary)" }}
          >
            Masuk
          </Link>
        </div>
      </div>
    </header>
  );
}
