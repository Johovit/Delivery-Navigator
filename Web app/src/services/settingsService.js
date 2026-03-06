import { supabase } from "../lib/supabaseClient";

const DEFAULT_COST_PER_KM = 10;

/** Fetch costPerKm from app_settings, returns a number */
export async function fetchCostPerKm() {
    const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "costPerKm")
        .single();

    if (error) {
        console.error("Supabase: failed to fetch costPerKm", error);
        return DEFAULT_COST_PER_KM;
    }
    const parsed = Number(data?.value);
    return isNaN(parsed) ? DEFAULT_COST_PER_KM : parsed;
}

/** Persist costPerKm to app_settings */
export async function saveCostPerKm(value) {
    const { error } = await supabase
        .from("app_settings")
        .update({
            value: value.toString(),
            updated_at: new Date().toISOString(),
        })
        .eq("key", "costPerKm");

    if (error) {
        console.error("Supabase: failed to update costPerKm", error);
    }
}
