import { useEffect } from "react"
import './ToastNotification.css';

function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={"toast toast-${type}"}>
            <span className="toast-icon">
                {type === 'success' ? '✓' : type === 'error' ? 'x': 'ℹ'}
            </span>
            <span className="toast-message">
                {message}
            </span>
            <button className="toast-close" onClick={onClose}>x</button>
        </div>
    );
}

export default Toast;


