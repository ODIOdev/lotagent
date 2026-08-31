/** Generated-style types for LOTAGENT la_* tables. Keep in sync with supabase/migrations. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      la_profiles: {
        Row: {
          id: string;
          dealership_id: string | null;
          full_name: string | null;
          email: string | null;
          role: "buyer" | "manager" | "admin";
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["la_profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["la_profiles"]["Row"]>;
      };
      la_dealerships: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          currency: string;
          tax_rate: number;
          default_destination_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["la_dealerships"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["la_dealerships"]["Row"]>;
      };
      la_vehicles: {
        Row: {
          id: string;
          dealership_id: string;
          year: number;
          make: string;
          model: string;
          trim: string | null;
          mileage: number;
          vin: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["la_vehicles"]["Row"]> & {
          dealership_id: string;
          year: number;
          make: string;
          model: string;
        };
        Update: Partial<Database["public"]["Tables"]["la_vehicles"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      la_is_member: { Args: { p_dealership: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
  };
}
