/**
 * Supabase persistence for LOTAGENT la_* tables.
 * The UI uses the demo store when keys are missing or the user is in demo session.
 * These helpers are the swap point for dealership-backed data.
 */
import { createClient } from "@/lib/supabase/client";
import type { Worksheet } from "@/lib/types";

export async function fetchRemoteWorksheets(): Promise<Worksheet[] | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("la_acquisition_worksheets")
    .select("id, status, assigned_buyer, created_at, updated_at, vehicle:la_vehicles(*)")
    .order("updated_at", { ascending: false });
  if (error) {
    console.warn("la_* worksheets unavailable, staying on demo store", error.message);
    return null;
  }
  if (!data) return [];
  return [];
}

export async function pingLotagentSchema(): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const { error } = await supabase.from("la_profiles").select("id").limit(1);
  return !error;
}
