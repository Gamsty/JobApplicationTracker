import React from 'react';
import './ErrorBoundary.css';

// Error Boundary — a class component that catches JavaScript errors in its child component tree
// When a child component throws during rendering, this displays a fallback UI instead of a white page
// Must be a class component because React does not support error boundaries with hooks
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null }; // Tracks whether an error has been caught
    }

    // Called when a child component throws an error during rendering
    // Updates state so the next render shows the fallback UI instead of the broken component tree
    static getDerivedStateFromError(error) {
        return {
            hasError: true, error
        };
    }

    // Called after an error is caught — logs error details to the console for debugging
    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        // If an error was caught, show the fallback UI with a refresh button
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <h1>Oops! Something went wrong</h1>
                    <p>We're sorry for the inconvenience. Please refresh the page.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="error-boundary-button"
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        // No error — render children normally
        return this.props.children;
    }
}

export default ErrorBoundary;
