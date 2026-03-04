import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// VITE_API_URL points to the backend root — each service appends its own path
const AUTH_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/auth';

// Context that holds the authenticated user's data and auth functions.
// Wrap the app in <AuthProvider> so any component can access it via useAuth().
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null); // Starts null — checkAuth validates the stored token before setting it
    const [loading, setLoading] = useState(true); // Prevents a flash of unauthenticated UI on first load
    const navigate = useNavigate();

    // On mount, restore auth state from localStorage and verify the token is still valid.
    // Calls GET /api/auth/me — if the token is expired or invalid, clears stored credentials
    // so the user is redirected to the login page instead of seeing a broken app.
    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                try {
                    // Verify the stored token is still valid by hitting a protected endpoint
                    await axios.get(`${AUTH_API_URL}/me`, {
                        headers: { Authorization: `Bearer ${storedToken}` }
                    });
                    // Token is valid — restore auth state
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                } catch {
                    // Token expired or invalid — clear stale credentials
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false); // Auth check complete — allow the app to render
        };

        checkAuth();
    }, []);

    // Sends login credentials to the backend, stores the returned JWT and user
    // data in localStorage, updates state, and redirects to the home page.
    // Returns { success: true } on success or { success: false, error: string } on failure.
    const login = async (email, password) => {
        try {
            const response = await axios.post(`${AUTH_API_URL}/login`, {
                email,
                password
            });

            const { token, ...userData } = response.data; // Separate the JWT from the rest of the user info

            // Persist so auth survives a page refresh
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            // Sync React state
            setToken(token);
            setUser(userData);

            navigate('/'); // Redirect to dashboard after successful login

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed'
            };
        }
    };

    // Sends registration data to the backend, stores the returned JWT and user
    // data in localStorage, updates state, and redirects to the home page.
    // The backend automatically logs the user in after registration (returns a JWT immediately).
    const register = async (fullName, email, password) => {
        try {
            const response = await axios.post(`${AUTH_API_URL}/register`, {
                fullName,
                email,
                password
            });

            const { token, ...userData } = response.data; // Separate the JWT from the rest of the user info

            // Persist so auth survives a page refresh
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            // Sync React state
            setToken(token);
            setUser(userData);

            navigate('/'); // Redirect to dashboard after successful registration

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    // Clears the JWT and user data from both localStorage and React state,
    // then redirects to the login page.
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        navigate('/login')
    };

    // The value exposed to all child components via useAuth()
    const value = {
        user,       // The logged-in user's data (id, email, fullName, role)
        token,      // The raw JWT string (used by the axios interceptor in applicationService)
        login,
        register,
        logout,
        isAuthenticated: !!token // True if a token exists — used to protect routes
    };

    // Show a spinner while the initial localStorage check runs to avoid
    // briefly rendering a logged-out state for an already-authenticated user.
    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for consuming the AuthContext.
// Throws if used outside of <AuthProvider> to catch wiring mistakes early.
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
