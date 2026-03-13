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

/** Insert a new route record — returns the inserted row (with generated id) */
export async function insertRoute(record) {
    const { data, error } = await supabase
        .from("routes")
        .insert([
            {
                source: record.source,
                destination: record.destination,
                distance: record.distanceKm,
                duration: record.durationMinutes,
                cost: record.cost,
                geometry: record.geometry ?? null,
                status: record.status ?? "Planned",
            },
        ])
        .select()
        .single();

    if (error) {
        console.error("Supabase: failed to insert route", error);
        return null;
    }
    return data;
}

/**
 * Update status for a route.
 * Pass extraFields (e.g. { completed_time: "..." }) to write additional columns
 * in the same request.
 */
export async function updateRouteStatus(id, status, extraFields = {}) {
    const { error } = await supabase
        .from("routes")
        .update({ status, ...extraFields })
        .eq("id", id);

    if (error) {
        console.error("Supabase: failed to update route status", error);
    }
}

/**
 * Mark a route as In Progress and store the timing data needed for
 * live position tracking from any page.
 */
export async function updateRouteStart(id, startTime, estimatedDuration) {
    const { error } = await supabase
        .from("routes")
        .update({
            status: "In Progress",
            start_time: startTime,
            estimated_duration: estimatedDuration,
        })
        .eq("id", id);

    if (error) {
        console.error("Supabase: failed to update route start", error);
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
