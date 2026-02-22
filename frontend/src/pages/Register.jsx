import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import './Auth.css';

function Register() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [comfirmPassword, setComfirmPassword] = useState(''); // Held separately so it can be compared against password client-side
    const [error, setError] = useState('');      // Holds the error message shown above the form on failed registration
    const [loading, setLoading] = useState(false); // Disables the button and shows "Creating account..." while the request is in flight
    const { register } = useAuth(); // register() is defined in AuthContext — calls the backend and stores the JWT

    // Called when the form is submitted.
    // Runs client-side validation first (password match, length), then delegates
    // to AuthContext.register() which handles the API call, localStorage, and navigation.
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent the browser's default form submission (page reload)
        setError('');        // Clear any previous error before retrying

        // Client-side validation — catches obvious errors before sending a request to the backend
        if (password !== comfirmPassword) {
            setError('Passwords do not match');
            return; // Stop here — do not call the backend
        }

        if (password.length < 6) {
            setError('Password must be atleast 6 characters');
            return; // Stop here — do not call the backend
        }

        setLoading(true);

        const result = await register(fullName, email, password);

        if (!result.success) {
            setError(result.error); // Show the error message returned by the backend (e.g. "Email already registered")
            setLoading(false);      // Re-enable the button so the user can try again
        }
        // On success, AuthContext.register() calls navigate('/') — no handling needed here
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>📋 Job Tracker</h1>
                    <h2>Create Account</h2>
                    <p>Start tracking your job applications today</p>
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
                        <label htmlFor="fullName">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="John Doe"
                            required
                            autoComplete="name"
                        />
                    </div>

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
                            placeholder="At least 6 characters"
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    {/* Confirm password is only used for client-side comparison — not sent to the backend */}
                    <div className="form-group">
                        <label htmlFor="comfirmPassword">Comfirm Password</label>
                        <input
                            type="password"
                            id="comfirmPassword"
                            value={comfirmPassword}
                            onChange={(e) => setComfirmPassword(e.target.value)}
                            placeholder="Re-enter your password"
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    {/* Button is disabled while the registration request is pending to prevent duplicate submissions */}
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;