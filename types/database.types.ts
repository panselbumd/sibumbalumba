/**
 * STUB — gantikan dengan hasil `supabase gen types typescript` dari
 * project Supabase yang sudah menjalankan migration Tahap 12.
 * Struktur di bawah hanya mencakup tabel yang dipakai scaffold ini,
 * agar type-check lolos tanpa perlu koneksi Supabase saat build.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: string;
          nama_lengkap: string;
          entity_id: string | null;
        };
        Insert: {
          id: string;
          role?: string;
          nama_lengkap: string;
          entity_id?: string | null;
        };
        Update: Partial<{
          id: string;
          role: string;
          nama_lengkap: string;
          entity_id: string | null;
        }>;
        Relationships: [];
      };
      nilai_ukk: {
        Row: {
          id: string;
          peserta_id: string;
          tim_ukk_id: string;
          tahap: string;
          skor: number;
          is_final: boolean;
          submitted_at: string | null;
        };
        Insert: {
          id?: string;
          peserta_id: string;
          tim_ukk_id: string;
          tahap: string;
          skor: number;
          is_final?: boolean;
          submitted_at?: string | null;
        };
        Update: Partial<{
          id: string;
          peserta_id: string;
          tim_ukk_id: string;
          tahap: string;
          skor: number;
          is_final: boolean;
          submitted_at: string | null;
        }>;
        Relationships: [];
      };
    };
    Views: {
      v_status_penilaian_ukk: {
        Row: {
          peserta_id: string;
          tahap_selesai: number;
          total_tahap_diinput: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
