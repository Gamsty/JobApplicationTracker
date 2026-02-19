import { useState, useEffect } from "react";
import './NetworkStatus.css';

// NetworkStatus — displays a fixed banner at the top of the screen when the user goes offline
// Uses the browser's navigator.onLine API and online/offline events to detect connectivity changes
// When online, renders nothing (returns null) so it's invisible
function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine); // Initialize with current online status

    // Listen for browser online/offline events to update the status in real-time
    // Cleanup removes the event listeners when the component unmounts
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Cleanup — remove event listeners to prevent memory leaks
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Don't render anything when the user is online
    if (isOnline) return null;

    // Show a fixed red banner at the top of the page when offline
    return (
        <div className="network-status offline">
            <span>You're offline. Some features may not work.</span>
        </div>
    );
}

export default NetworkStatus;
