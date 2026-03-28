import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logIn } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
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

        if (isSubmittingRef.current || cooldown > 0) return;
        isSubmittingRef.current = true;

        setError(null);
        setLoading(true);

        try {
            await logIn(email, password);
            navigate("/dashboard");
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
            <div className="auth-card">
                <div className="auth-header">
                    <img src="/logo.svg" alt="Delivery Navigator Logo" className="auth-logo" />
                    <h2>Welcome Back</h2>
                    <p>Sign in to Delivery Navigator</p>
                </div>
                
                {error && <div className="auth-error">{error}</div>}
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
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
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button type="submit" className="auth-btn" disabled={loading || cooldown > 0}>
                        {loading ? "Signing in..." : cooldown > 0 ? `Please wait ${cooldown}s` : "Sign In"}
                    </button>
                </form>

                <div className="auth-footer">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </div>
            </div>
        </div>
    );
}
