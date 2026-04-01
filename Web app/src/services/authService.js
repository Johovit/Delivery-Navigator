import { supabase } from "../lib/supabaseClient";

/** Login with email and password */
export async function logIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

/** Signup with email and password */
export async function signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: Object.keys(metadata).length > 0 ? { data: metadata } : undefined
    });
    if (error) throw error;
    return data;
}

/** Log out current user */
export async function logOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}
