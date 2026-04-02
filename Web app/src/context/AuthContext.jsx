import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext({
    session: null,
    user: null,
    authLoading: true,
    role: "user",
    username: null,
    roleLoading: false,
    isAdmin: false,
});

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [role, setRole] = useState("user");
    const [username, setUsername] = useState(null);
    const [roleLoading, setRoleLoading] = useState(false);

    useEffect(() => {
        // Get initial session and handle potential refresh token errors
        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    // If it's a refresh token error or invalid session, handle it gracefully
                    if (error.message?.includes("Refresh Token Not Found") || error.status === 400) {
                        console.warn("Auth session expired, signing out...");
                    } else {
                        console.error("Supabase Auth Error:", error.message);
                    }
                    // Clear local auth state explicitly 
                    await supabase.auth.signOut();
                    setSession(null);
                    setUser(null);
                } else {
                    setSession(session);
                    setUser(session?.user ?? null);
                }
            } catch (err) {
                console.error("Unexpected auth initialization error:", err);
                setSession(null);
                setUser(null);
            } finally {
                setAuthLoading(false);
            }
        };

        initializeAuth();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'TOKEN_REFRESH_FAILED' || event === 'SIGNED_OUT') {
                    if (event === 'TOKEN_REFRESH_FAILED') {
                        console.warn("Token refresh failed, resetting session...");
                        // Use a safe logout that doesn't trigger another cycle unnecessarily
                        await supabase.auth.signOut();
                    }
                    setSession(null);
                    setUser(null);
                } else {
                    setSession(session);
                    setUser(session?.user ?? null);
                }
                setAuthLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) {
            setRole("user");
            setUsername(null);
            setRoleLoading(false);
            return;
        }

        let isMounted = true;
        setRoleLoading(true);

        const fetchRole = async () => {
            try {
                const { data, error } = await supabase
                    .from("user_profiles")
                    .select("role, username")
                    .eq("id", user.id)
                    .single();
                
                if (isMounted) {
                    if (error) {
                        setRole("user"); // Fallback
                        setUsername(null);
                    } else {
                        setRole(data?.role || "user");
                        setUsername(data?.username || null);
                    }
                }
            } catch {
                if (isMounted) {
                    setRole("user");
                    setUsername(null);
                }
            } finally {
                if (isMounted) setRoleLoading(false);
            }
        };

        fetchRole();

        return () => { isMounted = false; };
    }, [user]);

    const isAdmin = role === "admin";

    return (
        <AuthContext.Provider value={{ session, user, authLoading, role, username, roleLoading, isAdmin }}>
            {!authLoading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
