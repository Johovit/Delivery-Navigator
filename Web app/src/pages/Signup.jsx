import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUp } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

export default function Signup() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    
    const isSubmittingRef = useRef(false);
    const timerRef = useRef(null);
    
    const navigate = useNavigate();
    const { session } = useAuth();

    // Redirect already-authenticated users without calling navigate() during render
    useEffect(() => {
        if (session) navigate("/dashboard", { replace: true });
    }, [session, navigate]);

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

        // 1. Prevent Multiple API Calls
        if (isSubmittingRef.current || cooldown > 0) return;
        isSubmittingRef.current = true;

        setError(null);
        setMessage(null);

        if (password !== confirmPassword) {
            isSubmittingRef.current = false;
            return setError("Passwords do not match");
        }

        if (password.length < 6) {
            isSubmittingRef.current = false;
            return setError("Password must be at least 6 characters");
        }

        setLoading(true);

        try {
            const payload = await signUp(email, password);
            const user = payload?.user;
            
            if (user) {
                const username = email.split('@')[0];
                await supabase.from('user_profiles').upsert({
                    id: user.id,
                    email: email,
                    username: username,
                    role: 'user',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });
            }

            // If Supabase returns a session, email confirmation is disabled. We can auto-login!
            if (payload?.session) {
                setMessage("Account created successfully! Logging you in...");
                setTimeout(() => navigate("/dashboard"), 1500);
            } else {
                // Otherwise require email check
                setMessage("Account created! Please check your email inbox to verify your account before logging in. If you don't see it, check your spam folder.");
                setTimeout(() => navigate("/login"), 5000);
            }
        } catch (err) {
            
            const msg = err.message?.toLowerCase() || "";
            // Detect rate limits
            if (msg.includes("rate limit") || err.status === 429) {
                setError("Too many attempts. Please try again after a few minutes.");
                startCooldown(60); // 60s penalty for rate limit
            } else if (msg.includes("already registered") || msg.includes("already exists")) {
                setError("User already registered. Please log in.");
                startCooldown(3);
            } else {
                setError(err.message || "Failed to create an account.");
                startCooldown(3);
            }
        } finally {
            setLoading(false);
            // 500ms safety debounce
            setTimeout(() => { isSubmittingRef.current = false; }, 500);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <img src="/logo.svg" alt="Delivery Navigator" className="auth-logo" />
                    <h2>Create Account</h2>
                    <p>Join Delivery Navigator</p>
                </div>
                
                {error && <div className="auth-error">{error}</div>}
                {message && <div className="auth-success">{message}</div>}
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button type="submit" className="auth-btn" disabled={loading || cooldown > 0}>
                        {loading ? "Signing up..." : cooldown > 0 ? `Please wait ${cooldown}s` : "Sign Up"}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/login">Log in</Link>
                </div>
            </div>
        </div>
    );
}
