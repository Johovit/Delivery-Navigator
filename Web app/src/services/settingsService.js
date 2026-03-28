import { supabase } from "../lib/supabaseClient";

const DEFAULT_COST_PER_KM = 10;

/** Fetch costPerKm for the current logged-in user */
export async function fetchCostPerKm() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return DEFAULT_COST_PER_KM;

    const { data, error } = await supabase
        .from("user_settings")
        .select("cost_per_km")
        .eq("user_id", userData.user.id)
        .single();

    if (error && error.code !== "PGRST116") {
        console.error("Supabase: failed to fetch costPerKm", error);
        return DEFAULT_COST_PER_KM;
    }
    const parsed = Number(data?.cost_per_km);
    return isNaN(parsed) ? DEFAULT_COST_PER_KM : parsed;
}

/** Persist costPerKm for the current user */
export async function saveCostPerKm(value) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    const { error } = await supabase
        .from("user_settings")
        .upsert({
            user_id: userData.user.id,
            cost_per_km: value,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

    if (error) {
        console.error("Supabase: failed to update costPerKm", error);
    }
}
