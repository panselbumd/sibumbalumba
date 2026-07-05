import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Middleware ini adalah LAPISAN UX (mencegah render halaman yang
 * tidak relevan untuk role tertentu). Ini BUKAN satu-satunya
 * penjaga keamanan — RLS di Supabase (Tahap 12) tetap lapisan
 * pertahanan utama. Lihat Tahap 10 §3.
 */

const ROLE_ROUTE_PREFIX: Record<string, string[]> = {
  "/internal/seleksi/penilaian-ukk": ["tim_ukk", "super_admin"],
  "/internal/seleksi/dewas-komisaris/assisted-entry": ["super_admin"],
  "/internal/pengguna": ["super_admin"],
  "/internal/audit-log": ["super_admin"],
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (getUserError) {
    // Sengaja dicatat ke log server (terlihat di Vercel Runtime Logs)
    // supaya masalah verifikasi sesi tidak lagi gagal DIAM-DIAM tanpa
    // jejak — ini yang membuat debug sebelumnya sulit dilacak.
    console.error("[middleware] gagal verifikasi sesi:", getUserError.message);
  }

  const path = request.nextUrl.pathname;
  const isInternalRoute = path.startsWith("/internal");

  if (isInternalRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    const restrictedPrefix = Object.keys(ROLE_ROUTE_PREFIX).find((prefix) =>
      path.startsWith(prefix)
    );

    if (restrictedPrefix) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const allowedRoles = ROLE_ROUTE_PREFIX[restrictedPrefix];
      if (!profile || !allowedRoles.includes(profile.role)) {
        return NextResponse.redirect(new URL("/internal/tidak-berwenang", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/internal/:path*"],
};
