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
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
        console.error("Supabase auth error: unable to get user for insertion", authErr);
        throw new Error("You must be logged in to save a route.");
    }

    const { data, error } = await supabase
        .from("routes")
        .insert([
            {
                user_id: user.id,
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
    const { data, error } = await supabase
        .from("routes")
        .update({ status, ...extraFields })
        .eq("id", id)
        .select();

    if (error) {
        console.error("Supabase: failed to update route status", error);
        throw error;
    }
    if (!data || data.length === 0) {
        throw new Error("Failed to update route status: Database blocked the update (missing RLS policy?) or route not found.");
    }
    return data[0];
}

/**
 * Mark a route as In Progress and store the timing data needed for
 * live position tracking from any page.
 */
export async function updateRouteStart(id, startTime, estimatedDuration) {
    const { data, error } = await supabase
        .from("routes")
        .update({
            status: "In Progress",
            start_time: startTime,
            estimated_duration: estimatedDuration,
        })
        .eq("id", id)
        .select();

    if (error) {
        console.error("Supabase: failed to update route start", error);
        throw error;
    }
    if (!data || data.length === 0) {
        throw new Error("Failed to start delivery: Database blocked the update (Missing Update RLS policy) or route not found.");
    }
    return data[0];
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
