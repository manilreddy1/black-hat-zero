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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string
          created_at: string
          id: string
          is_published: boolean
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_published?: boolean
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_published?: boolean
          title?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_role: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          ip: string | null
          metadata: Json
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip?: string | null
          metadata?: Json
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip?: string | null
          metadata?: Json
        }
        Relationships: []
      }
      auth_throttle: {
        Row: {
          attempts: number
          created_at: string
          first_attempt_at: string
          id: string
          identifier: string
          last_attempt_at: string
          locked_until: string | null
          scope: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          first_attempt_at?: string
          id?: string
          identifier: string
          last_attempt_at?: string
          locked_until?: string | null
          scope: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          first_attempt_at?: string
          id?: string
          identifier?: string
          last_attempt_at?: string
          locked_until?: string | null
          scope?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificate_settings: {
        Row: {
          created_at: string
          fields: Json
          id: string
          is_enabled: boolean
          note: string
          section_subtitle: string
          section_title: string
          template_path: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fields?: Json
          id?: string
          is_enabled?: boolean
          note?: string
          section_subtitle?: string
          section_title?: string
          template_path?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fields?: Json
          id?: string
          is_enabled?: boolean
          note?: string
          section_subtitle?: string
          section_title?: string
          template_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_published: boolean
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      custom_pages: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_published: boolean
          seo_description: string | null
          slug: string
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          seo_description?: string | null
          slug: string
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          seo_description?: string | null
          slug?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_settings: {
        Row: {
          about: string
          college: string
          contact_email: string
          contact_phone: string
          created_at: string
          currency: string
          eligibility: string
          emails_enabled: boolean
          end_time: string
          event_date: string
          event_name: string
          event_state: string
          id: string
          maintenance_mode: boolean
          max_participants: number
          max_team_size: number
          max_teams: number
          min_team_size: number
          mode: string
          payment_deadline: string | null
          payment_instructions: string
          payments_enabled: boolean
          registration_deadline: string
          registration_fee: number
          registration_open: boolean
          social_links: Json
          start_at: string
          start_time: string
          tagline: string
          updated_at: string
          upi_id: string
          upi_payee_name: string
          venue: string
          waitlist_enabled: boolean
        }
        Insert: {
          about?: string
          college?: string
          contact_email?: string
          contact_phone?: string
          created_at?: string
          currency?: string
          eligibility?: string
          emails_enabled?: boolean
          end_time?: string
          event_date?: string
          event_name?: string
          event_state?: string
          id?: string
          maintenance_mode?: boolean
          max_participants?: number
          max_team_size?: number
          max_teams?: number
          min_team_size?: number
          mode?: string
          payment_deadline?: string | null
          payment_instructions?: string
          payments_enabled?: boolean
          registration_deadline?: string
          registration_fee?: number
          registration_open?: boolean
          social_links?: Json
          start_at?: string
          start_time?: string
          tagline?: string
          updated_at?: string
          upi_id?: string
          upi_payee_name?: string
          venue?: string
          waitlist_enabled?: boolean
        }
        Update: {
          about?: string
          college?: string
          contact_email?: string
          contact_phone?: string
          created_at?: string
          currency?: string
          eligibility?: string
          emails_enabled?: boolean
          end_time?: string
          event_date?: string
          event_name?: string
          event_state?: string
          id?: string
          maintenance_mode?: boolean
          max_participants?: number
          max_team_size?: number
          max_teams?: number
          min_team_size?: number
          mode?: string
          payment_deadline?: string | null
          payment_instructions?: string
          payments_enabled?: boolean
          registration_deadline?: string
          registration_fee?: number
          registration_open?: boolean
          social_links?: Json
          start_at?: string
          start_time?: string
          tagline?: string
          updated_at?: string
          upi_id?: string
          upi_payee_name?: string
          venue?: string
          waitlist_enabled?: boolean
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_published: boolean
          question: string
          sort_order: number
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_published?: boolean
          question: string
          sort_order?: number
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question?: string
          sort_order?: number
        }
        Relationships: []
      }
      nav_items: {
        Row: {
          created_at: string
          href: string
          id: string
          is_button: boolean
          is_visible: boolean
          label: string
          new_tab: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          href: string
          id?: string
          is_button?: boolean
          is_visible?: boolean
          label: string
          new_tab?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          href?: string
          id?: string
          is_button?: boolean
          is_visible?: boolean
          label?: string
          new_tab?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_visible: boolean
          key: string
          kind: string
          label: string
          sort_order: number
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          key: string
          kind?: string
          label: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          key?: string
          kind?: string
          label?: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_verifications: {
        Row: {
          created_at: string
          decision: string
          id: string
          notes: string | null
          payment_id: string
          reason: string | null
          registration_id: string
          verified_by: string
        }
        Insert: {
          created_at?: string
          decision: string
          id?: string
          notes?: string | null
          payment_id: string
          reason?: string | null
          registration_id: string
          verified_by: string
        }
        Update: {
          created_at?: string
          decision?: string
          id?: string
          notes?: string | null
          payment_id?: string
          reason?: string | null
          registration_id?: string
          verified_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_verifications_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_verifications_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          paid_on: string | null
          paid_time: string | null
          registration_id: string
          screenshot_path: string | null
          status: string
          updated_at: string
          utr_number: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          paid_on?: string | null
          paid_time?: string | null
          registration_id: string
          screenshot_path?: string | null
          status?: string
          updated_at?: string
          utr_number: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          paid_on?: string | null
          paid_time?: string | null
          registration_id?: string
          screenshot_path?: string | null
          status?: string
          updated_at?: string
          utr_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      prizes: {
        Row: {
          amount: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          sort_order: number
          tier: string | null
          title: string
        }
        Insert: {
          amount?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          tier?: string | null
          title: string
        }
        Update: {
          amount?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          tier?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          last_login: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          last_login?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      registration_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          registration_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          registration_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          registration_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_status_history_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          created_at: string
          expected_amount: number
          fee_at_registration: number
          id: string
          is_demo: boolean
          is_waitlisted: boolean
          registration_code: string
          status: Database["public"]["Enums"]["reg_status"]
          submitted_at: string
          team_id: string
          team_size: number
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          expected_amount: number
          fee_at_registration: number
          id?: string
          is_demo?: boolean
          is_waitlisted?: boolean
          registration_code: string
          status?: Database["public"]["Enums"]["reg_status"]
          submitted_at?: string
          team_id: string
          team_size: number
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          expected_amount?: number
          fee_at_registration?: number
          id?: string
          is_demo?: boolean
          is_waitlisted?: boolean
          registration_code?: string
          status?: Database["public"]["Enums"]["reg_status"]
          submitted_at?: string
          team_id?: string
          team_size?: number
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      rules: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_published: boolean
          sort_order: number
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          sort_order?: number
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      site_texts: {
        Row: {
          created_at: string
          group_name: string
          id: string
          key: string
          label: string
          multiline: boolean
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          group_name?: string
          id?: string
          key: string
          label?: string
          multiline?: boolean
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Update: {
          created_at?: string
          group_name?: string
          id?: string
          key?: string
          label?: string
          multiline?: boolean
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          logo_url: string | null
          name: string
          sort_order: number
          tier: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          logo_url?: string | null
          name: string
          sort_order?: number
          tier?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          logo_url?: string | null
          name?: string
          sort_order?: number
          tier?: string
          website?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          is_leader: boolean
          member_index: number
          phone: string
          student_id: string | null
          team_id: string
          year: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id?: string
          is_leader?: boolean
          member_index: number
          phone: string
          student_id?: string | null
          team_id: string
          year?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          is_leader?: boolean
          member_index?: number
          phone?: string
          student_id?: string | null
          team_id?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          city: string
          college: string
          created_at: string
          department: string
          id: string
          leader_email: string
          leader_name: string
          leader_phone: string
          team_code: string
          team_name: string
          team_size: number
          updated_at: string
          year: string
        }
        Insert: {
          city: string
          college: string
          created_at?: string
          department: string
          id?: string
          leader_email: string
          leader_name: string
          leader_phone: string
          team_code: string
          team_name: string
          team_size: number
          updated_at?: string
          year: string
        }
        Update: {
          city?: string
          college?: string
          created_at?: string
          department?: string
          id?: string
          leader_email?: string
          leader_name?: string
          leader_phone?: string
          team_code?: string
          team_name?: string
          team_size?: number
          updated_at?: string
          year?: string
        }
        Relationships: []
      }
      timeline_items: {
        Row: {
          created_at: string
          description: string | null
          happens_at: string | null
          id: string
          is_published: boolean
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          happens_at?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          happens_at?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          promoted: boolean
          team_name: string | null
          team_size: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          phone: string
          promoted?: boolean
          team_name?: string | null
          team_size?: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          promoted?: boolean
          team_name?: string | null
          team_size?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      next_registration_number: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "coordinator" | "payment_verifier" | "super_admin"
      reg_status:
        | "DRAFT"
        | "PAYMENT_PENDING"
        | "PAYMENT_REVIEW"
        | "PAYMENT_APPROVED"
        | "REGISTERED"
        | "PAYMENT_REJECTED"
        | "CANCELLED"
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
      app_role: ["admin", "coordinator", "payment_verifier", "super_admin"],
      reg_status: [
        "DRAFT",
        "PAYMENT_PENDING",
        "PAYMENT_REVIEW",
        "PAYMENT_APPROVED",
        "REGISTERED",
        "PAYMENT_REJECTED",
        "CANCELLED",
      ],
    },
  },
} as const
