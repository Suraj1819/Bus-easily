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
      bookings: {
        Row: {
          booked_at: string
          booking_id: string
          bus_id: string
          created_at: string
          id: string
          payment_id: string | null
          payment_status: string | null
          seat_ids: string[]
          status: Database["public"]["Enums"]["booking_status"]
          total_fare: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booked_at?: string
          booking_id: string
          bus_id: string
          created_at?: string
          id?: string
          payment_id?: string | null
          payment_status?: string | null
          seat_ids: string[]
          status?: Database["public"]["Enums"]["booking_status"]
          total_fare: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booked_at?: string
          booking_id?: string
          bus_id?: string
          created_at?: string
          id?: string
          payment_id?: string | null
          payment_status?: string | null
          seat_ids?: string[]
          status?: Database["public"]["Enums"]["booking_status"]
          total_fare?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
        ]
      }
      buses: {
        Row: {
          arrival_time: string
          branch: Database["public"]["Enums"]["branch"]
          bus_number: string
          bus_type: Database["public"]["Enums"]["bus_type"]
          created_at: string
          departure_time: string
          fare: number
          id: string
          is_active: boolean
          route: string
          total_seats: number
          updated_at: string
          year: Database["public"]["Enums"]["year"]
        }
        Insert: {
          arrival_time: string
          branch: Database["public"]["Enums"]["branch"]
          bus_number: string
          bus_type: Database["public"]["Enums"]["bus_type"]
          created_at?: string
          departure_time: string
          fare: number
          id?: string
          is_active?: boolean
          route: string
          total_seats: number
          updated_at?: string
          year: Database["public"]["Enums"]["year"]
        }
        Update: {
          arrival_time?: string
          branch?: Database["public"]["Enums"]["branch"]
          bus_number?: string
          bus_type?: Database["public"]["Enums"]["bus_type"]
          created_at?: string
          departure_time?: string
          fare?: number
          id?: string
          is_active?: boolean
          route?: string
          total_seats?: number
          updated_at?: string
          year?: Database["public"]["Enums"]["year"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          branch: Database["public"]["Enums"]["branch"]
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          updated_at: string
          user_id: string
          year: Database["public"]["Enums"]["year"]
        }
        Insert: {
          branch: Database["public"]["Enums"]["branch"]
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          updated_at?: string
          user_id: string
          year: Database["public"]["Enums"]["year"]
        }
        Update: {
          branch?: Database["public"]["Enums"]["branch"]
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          updated_at?: string
          user_id?: string
          year?: Database["public"]["Enums"]["year"]
        }
        Relationships: []
      }
      seats: {
        Row: {
          bus_id: string
          column_number: number
          created_at: string
          id: string
          locked_by: string | null
          locked_until: string | null
          row_number: number
          seat_number: string
          status: Database["public"]["Enums"]["seat_status"]
          updated_at: string
        }
        Insert: {
          bus_id: string
          column_number: number
          created_at?: string
          id?: string
          locked_by?: string | null
          locked_until?: string | null
          row_number: number
          seat_number: string
          status?: Database["public"]["Enums"]["seat_status"]
          updated_at?: string
        }
        Update: {
          bus_id?: string
          column_number?: number
          created_at?: string
          id?: string
          locked_by?: string | null
          locked_until?: string | null
          row_number?: number
          seat_number?: string
          status?: Database["public"]["Enums"]["seat_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seats_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      release_expired_seat_locks: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "student"
      booking_status: "pending" | "confirmed" | "cancelled"
      branch:
        | "CSE"
        | "ECE"
        | "EEE"
        | "MECH"
        | "CIVIL"
        | "IT"
        | "CHEMICAL"
        | "BIOTECH"
      bus_type: "AC" | "Non-AC"
      seat_status: "available" | "locked" | "booked"
      year: "1st" | "2nd" | "3rd" | "4th"
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
      app_role: ["admin", "student"],
      booking_status: ["pending", "confirmed", "cancelled"],
      branch: [
        "CSE",
        "ECE",
        "EEE",
        "MECH",
        "CIVIL",
        "IT",
        "CHEMICAL",
        "BIOTECH",
      ],
      bus_type: ["AC", "Non-AC"],
      seat_status: ["available", "locked", "booked"],
      year: ["1st", "2nd", "3rd", "4th"],
    },
  },
} as const
