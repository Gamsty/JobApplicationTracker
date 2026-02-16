import { useEffect } from "react"
import './toast.css';

// Toast notification component that displays a temporary message and auto-dismisses after 3 seconds
// Props:
//   message - the text to display in the toast
//   type - the style variant: 'success', 'error', or 'info' (defaults to 'success')
//   onClose - callback to remove the toast from parent state
function Toast({ message, type = 'success', onClose }) {
    // Auto-dismiss the toast after 3 seconds by calling onClose
    // Cleanup function clears the timer if the component unmounts early (e.g., user clicks close manually)
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        // Apply base 'toast' class and a type-specific class (e.g., 'toast-success', 'toast-error') for styling
        <div className={`toast toast-${type}`}>
            {/* Display an icon based on toast type: checkmark for success, x for error, info symbol for other */}
            <span className="toast-icon">
                {type === 'success' ? '✓' : type === 'error' ? 'x': 'ℹ'}
            </span>
            {/* The toast message text */}
            <span className="toast-message">
                {message}
            </span>
            {/* Manual close button to dismiss the toast before auto-dismiss */}
            <button className="toast-close" onClick={onClose}>x</button>
        </div>
    );
}

export default Toast;


