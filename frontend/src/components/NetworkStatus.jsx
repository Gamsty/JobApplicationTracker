import { useState, useEffect } from "react";
import './NetworkStatus.css';

// Shows a banner when the browser reports offline. Returns null otherwise so it
// occupies no space when there's nothing to say.
function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="network-status offline">
            <span>You're offline. Some features may not work.</span>
        </div>
    );
}

export default NetworkStatus;
