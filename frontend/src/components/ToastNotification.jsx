import { useEffect } from "react"
import './ToastNotification.css';

// Toast notification component — displays a temporary message at the bottom-right of the screen
// Props:
//   message - the text to display in the toast
//   type - 'success' (green), 'error' (red), or 'info' (blue) — defaults to 'success'
//   onClose - callback to dismiss the toast (clears the toast state in App.jsx)
function Toast({ message, type = 'success', onClose }) {

    // Auto-dismiss the toast after 3 seconds
    // The cleanup function clears the timer if the component unmounts early (e.g., user clicks close)
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer); // Cleanup on unmount to prevent calling onClose after component is gone
    }, [onClose]);

    return (
        // Template literal builds the className dynamically: "toast toast-success", "toast toast-error", etc.
        // This applies both the base .toast styles and the type-specific color class
        <div className={`toast toast-${type}`}>
            {/* Icon changes based on toast type: checkmark for success, X for error, info symbol for info */}
            <span className="toast-icon">
                {type === 'success' ? '✓' : type === 'error' ? 'x': 'ℹ'}
            </span>
            {/* The notification message text */}
            <span className="toast-message">
                {message}
            </span>
            {/* Manual close button — allows dismissing the toast before the 3-second auto-dismiss */}
            <button className="toast-close" onClick={onClose}>x</button>
        </div>
    );
}

export default Toast;
