import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrapper component that guards routes requiring authentication.
// Wrap any <Route> element with <ProtectedRoute> to redirect unauthenticated
// users to the login page instead of rendering the protected content.
function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth(); // True if a valid JWT is stored in localStorage

    // Redirect to login if no token exists.
    // "replace" removes the current entry from the history stack so the user
    // can't press Back to return to the protected page without logging in first.
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    // Token is present — render the protected page normally
    return children;
}

export default ProtectedRoute;