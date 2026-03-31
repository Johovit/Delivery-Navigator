import { supabase } from "../lib/supabaseClient";

/**
 * Fetch all messages for the currently authenticated user's conversation thread.
 */
export async function fetchUserMessages() {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_user_id", user.id)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Failed to fetch messages:", error);
        return [];
    }
    return data ?? [];
}

/**
 * Send a message as the current user.
 */
export async function sendUserMessage(messageText) {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("messages")
        .insert([{
            conversation_user_id: user.id,
            sender_id: user.id,
            role: "user",
            message: messageText,
        }])
        .select()
        .single();

    if (error) {
        console.error("Failed to send message:", error);
        throw error;
    }
    return data;
}

/**
 * ADMIN: Fetch a distinct list of all users who have sent messages.
 * Returns unique conversation_user_ids with their most recent message date.
 */
export async function fetchAdminInboxList() {
    const { data: messages, error } = await supabase
        .from("messages")
        .select("conversation_user_id, created_at, message")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Failed to fetch admin inbox:", error.message);
        return [];
    }

    const deduped = deduplicateInbox(messages || []);
    const userIds = [...new Set(deduped.map((r) => normalizeId(r.conversation_user_id)).filter(Boolean))];
    const profilesMap = await fetchProfilesByIds(userIds);

    return deduped.map((r) => ({
        ...r,
        user_profiles: profilesMap[normalizeId(r.conversation_user_id)] || null,
    }));
}

function deduplicateInbox(data) {

    // Deduplicate by conversation_user_id — keep the most recent item per user
    const seenUsers = new Map();
    (data ?? []).forEach(row => {
        if (!seenUsers.has(row.conversation_user_id)) {
            seenUsers.set(row.conversation_user_id, row);
        }
    });
    return Array.from(seenUsers.values());
}

/**
 * ADMIN: Fetch all messages for a specific user's conversation thread.
 */
export async function fetchConversationMessages(conversationUserId) {
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_user_id", conversationUserId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Failed to fetch conversation:", error);
        return [];
    }
    return data ?? [];
}

/**
 * ADMIN: Reply to a specific user's conversation thread.
 */
export async function sendAdminReply(conversationUserId, messageText) {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("messages")
        .insert([{
            conversation_user_id: conversationUserId,
            sender_id: user.id,
            role: "admin",
            message: messageText,
        }])
        .select()
        .single();

    if (error) {
        console.error("Failed to send admin reply:", error);
        throw error;
    }
    return data;
}

async function fetchProfilesByIds(userIds) {
    if (!userIds.length) return {};

    const { data: profiles, error } = await supabase
        .from("user_profiles")
        .select("id, username, email")
        .in("id", userIds);

    if (error) {
        console.error("Failed to fetch user_profiles (id, username, email):", error.message);
        const { data: profiles2, error: err2 } = await supabase
            .from("user_profiles")
            .select("id, username")
            .in("id", userIds);
        if (err2 || !profiles2) {
            console.error("Failed to fetch user_profiles (id, username):", err2?.message || err2);
            return {};
        }
        return profiles2.reduce((acc, p) => {
            acc[normalizeId(p.id)] = p;
            return acc;
        }, {});
    }

    if (!profiles) return {};

    return profiles.reduce((acc, p) => {
        acc[normalizeId(p.id)] = p;
        return acc;
    }, {});
}

function normalizeId(value) {
    return String(value || "").trim().toLowerCase();
}
