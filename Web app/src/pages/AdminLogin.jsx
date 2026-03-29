import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logIn, logOut } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const isSubmittingRef = useRef(false);
    const timerRef = useRef(null);
    
    const navigate = useNavigate();
    const { session, isAdmin, roleLoading } = useAuth();

    // Redirect already-authenticated admins without calling navigate() during render
    useEffect(() => {
        if (session && !roleLoading) {
            if (isAdmin) {
                navigate("/dashboard", { replace: true });
            }
        }
    }, [session, isAdmin, roleLoading, navigate]);

    // Cleanup cooldown timer on unmount
    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const startCooldown = useCallback((seconds) => {
        setCooldown(seconds);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmittingRef.current || cooldown > 0) return;
        isSubmittingRef.current = true;

        setError(null);
        setLoading(true);

        try {
            const authData = await logIn(email, password);
            const user = authData?.user || authData?.session?.user;
            
            if (user) {
                // Instantly check role before deciding to stay logged in
                const { data, error: profileError } = await supabase
                    .from("user_profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();
                
                if (profileError || data?.role !== "admin") {
                    // Not an admin - sign them out immediately
                    await logOut();
                    throw new Error("Access denied. This account does not have admin privileges.");
                } else {
                    // Is admin - redirect to dashboard
                    navigate("/dashboard");
                }
            }
            
        } catch (err) {
            const msg = err.message?.toLowerCase() || "";
            if (msg.includes("rate limit") || err.status === 429) {
                setError("Too many attempts. Please try again after a few minutes.");
                startCooldown(60);
            } else if (msg.includes("email not confirmed")) {
                setError("Please verify your email address before logging in. Check your inbox.");
                startCooldown(3);
            } else {
                setError(err.message || "Failed to log in");
                startCooldown(3);
            }
        } finally {
            setLoading(false);
            setTimeout(() => { isSubmittingRef.current = false; }, 500);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ borderTop: "4px solid var(--color-error)" }}>
                <div className="auth-header">
                    <div style={{ 
                        width: "48px", height: "48px", borderRadius: "12px", 
                        background: "var(--color-error-pale)", color: "var(--color-error)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "24px", margin: "0 auto 16px"
                    }}>
                        🔐
                    </div>
                    <h2>Admin Portal</h2>
                    <p>Secure access for administrators</p>
                </div>
                
                {error && <div className="auth-error">{error}</div>}
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Admin Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="auth-btn" 
                        disabled={loading || cooldown > 0}
                        style={{ background: "linear-gradient(135deg, var(--color-error), #B91C1C)" }}
                    >
                        {loading ? "Verifying..." : cooldown > 0 ? `Please wait ${cooldown}s` : "Admin Sign In"}
                    </button>
                </form>

                <div className="auth-footer" style={{ marginTop: "24px" }}>
                    <Link to="/login" className="link-btn">← Back to User Login</Link>
                </div>
            </div>
        </div>
    );
}
