import { supabase } from "../lib/supabaseClient";

/** Fetch all orders ordered newest-first (for current user via RLS) */
export async function fetchOrders() {
    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Supabase: failed to fetch orders", error);
        return [];
    }

    // Safely parse geometry JSON stored as text
    return (data ?? []).map((row) => ({
        ...row,
        geometry: safeParseGeometry(row.geometry),
    }));
}

/** Safely parse a geometry field that may be a JSON string or already an array */
function safeParseGeometry(geometry) {
    if (!geometry) return null;
    if (Array.isArray(geometry)) return geometry;
    try {
        return JSON.parse(geometry);
    } catch {
        return null;
    }
}

/**
 * ADMIN: Fetch ALL orders across all users.
 * Works because Admin RLS policy allows admins to read all rows.
 */
export async function fetchAllOrdersAdmin({ status, dateFrom, dateTo } = {}) {
    let query = supabase
        .from("orders")
        .select("*, user_profiles(id, email)")
        .order("created_at", { ascending: false });

    if (status && status !== "all") {
        query = query.eq("status", status);
    }
    if (dateFrom) {
        query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
        query = query.lte("created_at", dateTo);
    }

    const { data, error } = await query;
    if (error) {
        // Fallback: fetch without join if user_profiles causes issues
        console.warn("Admin order fetch with profile join failed, trying without join:", error.message);
        const { data: fallback, error: fbErr } = await supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });
        if (fbErr) { console.error(fbErr); return []; }
        return fallback ?? [];
    }
    return data ?? [];
}

/** Insert a new order record — returns the inserted row (with generated id) */
export async function insertOrder(record) {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
        console.error("Supabase auth error: unable to get user for insertion", authErr);
        throw new Error("You must be logged in to save an order.");
    }

    // Serialize geometry array as JSON string for DB storage
    const geometryStr = record.geometry
        ? JSON.stringify(record.geometry)
        : null;

    const { data, error } = await supabase
        .from("orders")
        .insert([
            {
                user_id: user.id,
                pickup_address: record.pickupAddress,
                delivery_address: record.deliveryAddress,
                pickup_pincode: record.pickupPincode,
                delivery_pincode: record.deliveryPincode,
                package_type: record.packageType,
                weight: record.weight,
                description: record.description,
                pickup_time: record.pickupTime,
                delivery_time: record.deliveryTime,
                distance_km: record.distanceKm,
                cost: record.cost,
                estimated_duration_minutes: record.estimatedDurationMinutes ?? null,
                geometry: geometryStr,
                status: record.status ?? "planned",
                payment_method: record.paymentMethod,
            },
        ])
        .select()
        .single();

    if (error) {
        console.error("Supabase: failed to insert order", error);
        return null;
    }

    // Parse geometry back on the returned row
    return {
        ...data,
        geometry: safeParseGeometry(data.geometry),
    };
}

/**
 * Update status for an order.
 * Pass extraFields (e.g. { delivery_time: "..." }) to write additional columns
 * in the same request.
 */
export async function updateOrderStatus(id, status, extraFields = {}) {
    const { data, error } = await supabase
        .from("orders")
        .update({ status, ...extraFields })
        .eq("id", id)
        .select();

    if (error) {
        console.error("Supabase: failed to update order status", error);
        throw error;
    }
    if (!data || data.length === 0) {
        throw new Error("Failed to update order status: Database blocked the update (missing RLS policy?) or order not found.");
    }
    return data[0];
}

/** Delete a single order by id */
export async function deleteOrder(id) {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) {
        console.error("Supabase: failed to delete order", error);
    }
}

/** Delete all orders for the current user (due to RLS) */
export async function clearOrders() {
    const { error } = await supabase
        .from("orders")
        .delete()
        .gte("created_at", "1970-01-01");
    if (error) {
        console.error("Supabase: failed to clear orders", error);
    }
}
