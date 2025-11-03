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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      application_documents: {
        Row: {
          application_id: string
          document_name: string
          document_type: string
          document_url: string
          file_size: number | null
          id: string
          is_verified: boolean | null
          uploaded_at: string
          uploaded_by: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          application_id: string
          document_name: string
          document_type: string
          document_url: string
          file_size?: number | null
          id?: string
          is_verified?: boolean | null
          uploaded_at?: string
          uploaded_by: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          application_id?: string
          document_name?: string
          document_type?: string
          document_url?: string
          file_size?: number | null
          id?: string
          is_verified?: boolean | null
          uploaded_at?: string
          uploaded_by?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_history: {
        Row: {
          action: string
          application_id: string
          id: string
          new_status: Database["public"]["Enums"]["application_status"] | null
          notes: string | null
          old_status: Database["public"]["Enums"]["application_status"] | null
          performed_at: string
          performed_by: string
        }
        Insert: {
          action: string
          application_id: string
          id?: string
          new_status?: Database["public"]["Enums"]["application_status"] | null
          notes?: string | null
          old_status?: Database["public"]["Enums"]["application_status"] | null
          performed_at?: string
          performed_by: string
        }
        Update: {
          action?: string
          application_id?: string
          id?: string
          new_status?: Database["public"]["Enums"]["application_status"] | null
          notes?: string | null
          old_status?: Database["public"]["Enums"]["application_status"] | null
          performed_at?: string
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          admin_pusat_notes: string | null
          admin_pusat_reviewed_at: string | null
          admin_pusat_reviewed_by: string | null
          admin_unit_notes: string | null
          admin_unit_reviewed_at: string | null
          admin_unit_reviewed_by: string | null
          application_type: Database["public"]["Enums"]["application_type"]
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string | null
          title: string
          updated_at: string
          user_id: string
          work_unit_id: string | null
        }
        Insert: {
          admin_pusat_notes?: string | null
          admin_pusat_reviewed_at?: string | null
          admin_pusat_reviewed_by?: string | null
          admin_unit_notes?: string | null
          admin_unit_reviewed_at?: string | null
          admin_unit_reviewed_by?: string | null
          application_type: Database["public"]["Enums"]["application_type"]
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          title: string
          updated_at?: string
          user_id: string
          work_unit_id?: string | null
        }
        Update: {
          admin_pusat_notes?: string | null
          admin_pusat_reviewed_at?: string | null
          admin_pusat_reviewed_by?: string | null
          admin_unit_notes?: string | null
          admin_unit_reviewed_at?: string | null
          admin_unit_reviewed_by?: string | null
          application_type?: Database["public"]["Enums"]["application_type"]
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          work_unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_work_unit_id_fkey"
            columns: ["work_unit_id"]
            isOneToOne: false
            referencedRelation: "work_units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          rejection_reason: string | null
          status: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          rejection_reason?: string | null
          status?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          rejection_reason?: string | null
          status?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_units: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_user_account: {
        Args: { approver_id: string; target_user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reject_user_account: {
        Args: { reason: string; target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin_pusat" | "admin_unit" | "viewer"
      application_status:
        | "draft"
        | "submitted"
        | "admin_unit_review"
        | "admin_unit_rejected"
        | "admin_unit_approved"
        | "admin_pusat_review"
        | "admin_pusat_rejected"
        | "approved"
        | "completed"
      application_type: "mutasi" | "kenaikan_pangkat" | "pensiun"
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
      app_role: ["admin_pusat", "admin_unit", "viewer"],
      application_status: [
        "draft",
        "submitted",
        "admin_unit_review",
        "admin_unit_rejected",
        "admin_unit_approved",
        "admin_pusat_review",
        "admin_pusat_rejected",
        "approved",
        "completed",
      ],
      application_type: ["mutasi", "kenaikan_pangkat", "pensiun"],
    },
  },
} as const
