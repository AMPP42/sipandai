export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          created_at: string
          documents_count: number
          estimasi: string | null
          id: string
          jenis: Database["public"]["Enums"]["application_type"]
          judul: string | null
          keterangan: string | null
          progress: number
          status: Database["public"]["Enums"]["application_status"]
          submitter_id: string
          submitter_name: string | null
          submitter_unit: string | null
          tanggal_pengajuan: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          documents_count?: number
          estimasi?: string | null
          id?: string
          jenis: Database["public"]["Enums"]["application_type"]
          judul?: string | null
          keterangan?: string | null
          progress?: number
          status?: Database["public"]["Enums"]["application_status"]
          submitter_id: string
          submitter_name?: string | null
          submitter_unit?: string | null
          tanggal_pengajuan?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          documents_count?: number
          estimasi?: string | null
          id?: string
          jenis?: Database["public"]["Enums"]["application_type"]
          judul?: string | null
          keterangan?: string | null
          progress?: number
          status?: Database["public"]["Enums"]["application_status"]
          submitter_id?: string
          submitter_name?: string | null
          submitter_unit?: string | null
          tanggal_pengajuan?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          meta: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          application_id: string
          created_at: string
          created_by: string
          drive_link: string | null
          id: string
          title: string
        }
        Insert: {
          application_id: string
          created_at?: string
          created_by: string
          drive_link?: string | null
          id?: string
          title: string
        }
        Update: {
          application_id?: string
          created_at?: string
          created_by?: string
          drive_link?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      dokumen_usulan: {
        Row: {
          catatan_verifikasi: string | null
          file_path: string | null
          file_size: number | null
          id: string
          is_required: boolean | null
          jenis_dokumen: string
          nama_dokumen: string
          status_verifikasi: string | null
          uploaded_at: string | null
          usulan_id: string
        }
        Insert: {
          catatan_verifikasi?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_required?: boolean | null
          jenis_dokumen: string
          nama_dokumen: string
          status_verifikasi?: string | null
          uploaded_at?: string | null
          usulan_id: string
        }
        Update: {
          catatan_verifikasi?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_required?: boolean | null
          jenis_dokumen?: string
          nama_dokumen?: string
          status_verifikasi?: string | null
          uploaded_at?: string | null
          usulan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dokumen_usulan_usulan_id_fkey"
            columns: ["usulan_id"]
            isOneToOne: false
            referencedRelation: "usulan_mutasi"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          agama: string | null
          alamat: string | null
          created_at: string
          email: string | null
          grade_kelas_jabatan: string | null
          handphone: string | null
          id: string
          jabatan: string | null
          jenis_kelamin: string | null
          kriteria_asn: string | null
          masa_kerja: string | null
          nama: string
          nik: string | null
          nip: string | null
          pangkat: string | null
          pendidikan_terakhir: string | null
          status: string | null
          status_pernikahan: string | null
          tanggal_lahir: string | null
          tempat_lahir: string | null
          tmt_cpns: string | null
          tmt_jabatan_terakhir: string | null
          tmt_pangkat_terakhir: string | null
          tmt_pensiun: string | null
          tmt_pns: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          agama?: string | null
          alamat?: string | null
          created_at?: string
          email?: string | null
          grade_kelas_jabatan?: string | null
          handphone?: string | null
          id?: string
          jabatan?: string | null
          jenis_kelamin?: string | null
          kriteria_asn?: string | null
          masa_kerja?: string | null
          nama: string
          nik?: string | null
          nip?: string | null
          pangkat?: string | null
          pendidikan_terakhir?: string | null
          status?: string | null
          status_pernikahan?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          tmt_cpns?: string | null
          tmt_jabatan_terakhir?: string | null
          tmt_pangkat_terakhir?: string | null
          tmt_pensiun?: string | null
          tmt_pns?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          agama?: string | null
          alamat?: string | null
          created_at?: string
          email?: string | null
          grade_kelas_jabatan?: string | null
          handphone?: string | null
          id?: string
          jabatan?: string | null
          jenis_kelamin?: string | null
          kriteria_asn?: string | null
          masa_kerja?: string | null
          nama?: string
          nik?: string | null
          nip?: string | null
          pangkat?: string | null
          pendidikan_terakhir?: string | null
          status?: string | null
          status_pernikahan?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          tmt_cpns?: string | null
          tmt_jabatan_terakhir?: string | null
          tmt_pangkat_terakhir?: string | null
          tmt_pensiun?: string | null
          tmt_pns?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          title?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string
          existing: number
          gap: number | null
          id: string
          jabatan: string
          kebutuhan: number
          status: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          existing?: number
          gap?: number | null
          id?: string
          jabatan: string
          kebutuhan?: number
          status?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          existing?: number
          gap?: number | null
          id?: string
          jabatan?: string
          kebutuhan?: number
          status?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          role: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          role: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          role?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      usulan_mutasi: {
        Row: {
          alasan_mutasi: string
          catatan_reviewer: string | null
          created_at: string
          id: string
          jenis_mutasi: string
          nama_pegawai: string
          nip: string
          nomor_usulan: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tanggal_usulan: string
          unit_asal: string
          unit_tujuan: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alasan_mutasi: string
          catatan_reviewer?: string | null
          created_at?: string
          id?: string
          jenis_mutasi: string
          nama_pegawai: string
          nip: string
          nomor_usulan: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tanggal_usulan?: string
          unit_asal: string
          unit_tujuan: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alasan_mutasi?: string
          catatan_reviewer?: string | null
          created_at?: string
          id?: string
          jenis_mutasi?: string
          nama_pegawai?: string
          nip?: string
          nomor_usulan?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tanggal_usulan?: string
          unit_asal?: string
          unit_tujuan?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workflows: {
        Row: {
          actor_id: string
          application_id: string
          created_at: string
          from_status: Database["public"]["Enums"]["application_status"] | null
          id: string
          note: string | null
          to_status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          actor_id: string
          application_id: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          note?: string | null
          to_status: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          actor_id?: string
          application_id?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "workflows_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_nomor_usulan: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin_pusat: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      recount_documents: {
        Args: { app_id: string }
        Returns: undefined
      }
    }
    Enums: {
      application_status:
        | "draft"
        | "submitted"
        | "in_review"
        | "revision_needed"
        | "approved"
        | "rejected"
        | "completed"
      application_type: "mutasi" | "kenaikan_pangkat" | "pensiun" | "konsultasi"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_status: [
        "draft",
        "submitted",
        "in_review",
        "revision_needed",
        "approved",
        "rejected",
        "completed",
      ],
      application_type: ["mutasi", "kenaikan_pangkat", "pensiun", "konsultasi"],
    },
  },
} as const
