import { supabase } from "../lib/supabaseClient";

/** Fetch all routes ordered newest-first */
export async function fetchRoutes() {
    const { data, error } = await supabase
        .from("routes")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Supabase: failed to fetch routes", error);
        return [];
    }
    return data ?? [];
}

/** Insert a new route record */
export async function insertRoute(record) {
    const { error } = await supabase.from("routes").insert([
        {
            source: record.source,
            destination: record.destination,
            distance: record.distanceKm,
            duration: record.durationMinutes,
            cost: record.cost,
            geometry: record.geometry ?? null,
        },
    ]);
    if (error) {
        console.error("Supabase: failed to insert route", error);
    }
}

/** Delete a single route by id */
export async function deleteRoute(id) {
    const { error } = await supabase.from("routes").delete().eq("id", id);
    if (error) {
        console.error("Supabase: failed to delete route", error);
    }
}

/** Delete all routes */
export async function clearRoutes() {
    const { error } = await supabase
        .from("routes")
        .delete()
        .gte("created_at", "1970-01-01");
    if (error) {
        console.error("Supabase: failed to clear routes", error);
    }
}
