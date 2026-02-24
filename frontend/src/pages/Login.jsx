import { useState } from "react";
import { Link } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import './Auth.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');     // Holds the error message shown below the form on failed login
    const [loading, setLoading] = useState(false); // Disables the button and shows "Signing in..." while the request is in flight
    const { login } = useAuth(); // login() is defined in AuthContext — calls the backend and stores the JWT

    // Called when the form is submitted.
    // Delegates to AuthContext.login() which handles the API call, localStorage, and navigation.
    // On failure, displays the error message returned by the backend.
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent the browser's default form submission (page reload)
        setError('');        // Clear any previous error before retrying
        setLoading(true);

        const result = await login(email, password);

        if (!result.success) {
            setError(result.error); // Show the error message (e.g. "Invalid email or password")
            setLoading(false);      // Re-enable the button so the user can try again
        }

        // On success, AuthContext.login() calls navigate('/') — no handling needed here
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>📋 Job Tracker</h1>
                    <h2>Welcome back</h2>
                    <p>Sign in to continue tracking your applications</p>
                </div>

                {/* Controlled form — each input is bound to state via value + onChange */}
                <form onSubmit={handleSubmit} className="auth-form">
                    {/* Only rendered when there is an error to display */}
                    {error && (
                        <div className="error-alert">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    {/* Button is disabled while the login request is pending to prevent duplicate submissions */}
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Don't have an account? <Link to='/register'>Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;