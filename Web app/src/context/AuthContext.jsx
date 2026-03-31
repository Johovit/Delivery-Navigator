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
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setAuthLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
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
                        console.error("Error fetching user profile:", error);
                        setRole("user"); // Fallback
                        setUsername(null);
                    } else {
                        setRole(data?.role || "user");
                        setUsername(data?.username || null);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    console.error("Failed to fetch profile:", err);
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
