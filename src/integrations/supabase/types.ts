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
          detailed_verification_status: string | null
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
          detailed_verification_status?: string | null
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
          detailed_verification_status?: string | null
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
      appointment_notifications: {
        Row: {
          appointment_id: string
          created_at: string
          email_sent: boolean | null
          id: string
          recipient_id: string
          sent_at: string
          type: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          email_sent?: boolean | null
          id?: string
          recipient_id: string
          sent_at?: string
          type: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          email_sent?: boolean | null
          id?: string
          recipient_id?: string
          sent_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          catatan_admin: string | null
          created_at: string
          email: string
          id: string
          jam_konsultasi: string
          jenis_konsultasi: string
          keterangan: string | null
          konselor_id: string | null
          nama_lengkap: string
          nip: string
          nomor_hp: string
          status: string
          tanggal_konsultasi: string
          unit_kerja: string
          updated_at: string
          user_id: string
        }
        Insert: {
          catatan_admin?: string | null
          created_at?: string
          email: string
          id?: string
          jam_konsultasi: string
          jenis_konsultasi: string
          keterangan?: string | null
          konselor_id?: string | null
          nama_lengkap: string
          nip: string
          nomor_hp: string
          status?: string
          tanggal_konsultasi: string
          unit_kerja: string
          updated_at?: string
          user_id: string
        }
        Update: {
          catatan_admin?: string | null
          created_at?: string
          email?: string
          id?: string
          jam_konsultasi?: string
          jenis_konsultasi?: string
          keterangan?: string | null
          konselor_id?: string | null
          nama_lengkap?: string
          nip?: string
          nomor_hp?: string
          status?: string
          tanggal_konsultasi?: string
          unit_kerja?: string
          updated_at?: string
          user_id?: string
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
      auto_replies: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          keywords: string[]
          reply_text: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          keywords: string[]
          reply_text: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          reply_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          message_text: string | null
          message_type: string
          sender_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message_text?: string | null
          message_type?: string
          sender_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message_text?: string | null
          message_type?: string
          sender_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          archived_at: string | null
          assigned_at: string | null
          created_at: string
          ended_at: string | null
          feedback: string | null
          id: string
          is_archived: boolean | null
          metadata: Json | null
          officer_id: string | null
          priority: string | null
          queue_position: number | null
          rating: number | null
          session_duration_seconds: number | null
          started_at: string
          status: string
          ticket_id: string | null
          topic: string | null
          updated_at: string
          user_id: string
          wait_time_seconds: number | null
        }
        Insert: {
          archived_at?: string | null
          assigned_at?: string | null
          created_at?: string
          ended_at?: string | null
          feedback?: string | null
          id?: string
          is_archived?: boolean | null
          metadata?: Json | null
          officer_id?: string | null
          priority?: string | null
          queue_position?: number | null
          rating?: number | null
          session_duration_seconds?: number | null
          started_at?: string
          status?: string
          ticket_id?: string | null
          topic?: string | null
          updated_at?: string
          user_id: string
          wait_time_seconds?: number | null
        }
        Update: {
          archived_at?: string | null
          assigned_at?: string | null
          created_at?: string
          ended_at?: string | null
          feedback?: string | null
          id?: string
          is_archived?: boolean | null
          metadata?: Json | null
          officer_id?: string | null
          priority?: string | null
          queue_position?: number | null
          rating?: number | null
          session_duration_seconds?: number | null
          started_at?: string
          status?: string
          ticket_id?: string | null
          topic?: string | null
          updated_at?: string
          user_id?: string
          wait_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "consultation_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_tickets: {
        Row: {
          created_at: string
          deskripsi: string
          feedback: string | null
          id: string
          judul: string
          kategori: string
          konselor_id: string | null
          konselor_name: string | null
          nomor_ticket: string
          prioritas: string
          rating: number | null
          status: string
          updated_at: string
          user_id: string
          user_name: string
          user_unit: string
        }
        Insert: {
          created_at?: string
          deskripsi: string
          feedback?: string | null
          id?: string
          judul: string
          kategori: string
          konselor_id?: string | null
          konselor_name?: string | null
          nomor_ticket?: string
          prioritas: string
          rating?: number | null
          status?: string
          updated_at?: string
          user_id: string
          user_name: string
          user_unit: string
        }
        Update: {
          created_at?: string
          deskripsi?: string
          feedback?: string | null
          id?: string
          judul?: string
          kategori?: string
          konselor_id?: string | null
          konselor_name?: string | null
          nomor_ticket?: string
          prioritas?: string
          rating?: number | null
          status?: string
          updated_at?: string
          user_id?: string
          user_name?: string
          user_unit?: string
        }
        Relationships: []
      }
      consultation_types: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_types: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_required: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_verifications: {
        Row: {
          admin_notes: string | null
          application_id: string
          created_at: string
          document_id: string | null
          document_link: string | null
          document_name: string
          document_type: string
          id: string
          status: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          application_id: string
          created_at?: string
          document_id?: string | null
          document_link?: string | null
          document_name: string
          document_type: string
          id?: string
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          application_id?: string
          created_at?: string
          document_id?: string | null
          document_link?: string | null
          document_name?: string
          document_type?: string
          id?: string
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_verifications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          application_id: string
          created_at: string
          created_by: string
          document_category: string | null
          document_index: number | null
          drive_link: string | null
          id: string
          title: string
        }
        Insert: {
          application_id: string
          created_at?: string
          created_by: string
          document_category?: string | null
          document_index?: number | null
          drive_link?: string | null
          id?: string
          title: string
        }
        Update: {
          application_id?: string
          created_at?: string
          created_by?: string
          document_category?: string | null
          document_index?: number | null
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
      faq_items: {
        Row: {
          created_at: string
          display_order: number | null
          helpful: number
          id: string
          is_active: boolean
          jawaban: string
          kategori: string
          not_helpful: number
          pertanyaan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          helpful?: number
          id?: string
          is_active?: boolean
          jawaban: string
          kategori: string
          not_helpful?: number
          pertanyaan: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          helpful?: number
          id?: string
          is_active?: boolean
          jawaban?: string
          kategori?: string
          not_helpful?: number
          pertanyaan?: string
          updated_at?: string
        }
        Relationships: []
      }
      mutation_types: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          app_enabled: boolean | null
          created_at: string | null
          email_enabled: boolean | null
          id: string
          notification_type: string
          sms_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_enabled?: boolean | null
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          notification_type: string
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_enabled?: boolean | null
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          notification_type?: string
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          body: string | null
          channels: Json | null
          created_at: string
          email_sent: boolean | null
          email_sent_at: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          notification_type: string | null
          priority: string | null
          read_at: string | null
          recipient_id: string
          sms_sent: boolean | null
          sms_sent_at: string | null
          title: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          body?: string | null
          channels?: Json | null
          created_at?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string | null
          priority?: string | null
          read_at?: string | null
          recipient_id: string
          sms_sent?: boolean | null
          sms_sent_at?: string | null
          title: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          body?: string | null
          channels?: Json | null
          created_at?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string | null
          priority?: string | null
          read_at?: string | null
          recipient_id?: string
          sms_sent?: boolean | null
          sms_sent_at?: string | null
          title?: string
        }
        Relationships: []
      }
      officer_skills: {
        Row: {
          created_at: string | null
          id: string
          officer_id: string
          proficiency_level: string | null
          skill_category: string
          skill_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          officer_id: string
          proficiency_level?: string | null
          skill_category: string
          skill_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          officer_id?: string
          proficiency_level?: string | null
          skill_category?: string
          skill_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "officer_skills_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      officer_status: {
        Row: {
          average_rating: number | null
          created_at: string
          current_active_chats: number | null
          id: string
          is_available: boolean | null
          last_seen: string
          max_concurrent_chats: number | null
          officer_id: string
          status: string
          total_chats_handled: number | null
          updated_at: string
        }
        Insert: {
          average_rating?: number | null
          created_at?: string
          current_active_chats?: number | null
          id?: string
          is_available?: boolean | null
          last_seen?: string
          max_concurrent_chats?: number | null
          officer_id: string
          status?: string
          total_chats_handled?: number | null
          updated_at?: string
        }
        Update: {
          average_rating?: number | null
          created_at?: string
          current_active_chats?: number | null
          id?: string
          is_available?: boolean | null
          last_seen?: string
          max_concurrent_chats?: number | null
          officer_id?: string
          status?: string
          total_chats_handled?: number | null
          updated_at?: string
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
      ranks: {
        Row: {
          code: string
          created_at: string
          golongan: string
          id: string
          is_active: boolean
          level: number
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          golongan: string
          id?: string
          is_active?: boolean
          level: number
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          golongan?: string
          id?: string
          is_active?: boolean
          level?: number
          name?: string
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
      work_units: {
        Row: {
          category: string
          code: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category: string
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
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
      archive_old_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      archive_old_chat_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      assign_chat_to_officer: {
        Args: { session_id: string }
        Returns: string
      }
      can_edit_employee_unit: {
        Args: { employee_unit: string }
        Returns: boolean
      }
      cleanup_old_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      complete_chat_session: {
        Args: { session_id: string }
        Returns: undefined
      }
      create_notification: {
        Args: {
          p_action_label?: string
          p_action_url?: string
          p_body: string
          p_priority?: string
          p_recipient_id: string
          p_title: string
          p_type?: string
        }
        Returns: string
      }
      generate_nomor_usulan: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_ticket_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin_pusat: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_pusat_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_unit_for_application: {
        Args: { app_id: string }
        Returns: boolean
      }
      recount_documents: {
        Args: { app_id: string }
        Returns: undefined
      }
      update_chat_queue: {
        Args: Record<PropertyKey, never>
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
      application_type:
        | "mutasi"
        | "kenaikan_pangkat"
        | "pensiun"
        | "konsultasi"
        | "mutasi_terpadu"
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
      application_type: [
        "mutasi",
        "kenaikan_pangkat",
        "pensiun",
        "konsultasi",
        "mutasi_terpadu",
      ],
    },
  },
} as const
