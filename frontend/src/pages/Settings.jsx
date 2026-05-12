import { useState } from 'react'; // Bug fix: removed unused useEffect import
import { reminderService } from '../services/reminderService';
import './Settings.css';

// Settings page — currently handles email notification preferences and test email.
// showToast — injected by App.jsx to show success / error notifications
function Settings({ showToast }) {
    // TODO: load the real value from the backend on mount.
    // The User entity has emailNotificationsEnabled which the scheduler respects,
    // but there is currently no GET /api/users/me/settings endpoint to read it here.
    // Until then the toggle is UI-only — it resets to true on every page load.
    const [emailNotifications, setEmailNotifications] = useState(true);

    // true while the test email request is in-flight — disables the button to prevent double-sends
    const [sendingTest, setSendingTest] = useState(false);

    // Sends a test email via POST /api/reminders/test-email to verify the mail config is working
    const handleTestEmail = async () => {
        try {
            setSendingTest(true);
            await reminderService.sendTestEmail();
            showToast('Test email sent! Check your inbox.', 'success');
        } catch (err) {
            console.error('Error sending test email:', err);
            showToast('Failed to send test email. Check your email configuration.', 'error');
        } finally {
            setSendingTest(false);
        }
    };

    // TODO: call PATCH /api/users/me/settings (needs a new backend endpoint + service method)
    // to persist the emailNotificationsEnabled flag so the scheduler honours the preference.
    const handleToggleNotifications = (e) => {
        setEmailNotifications(e.target.checked);
    };

    return (
        <div className='settings-page'>
            <h2>Settings</h2>

            <div className='settings-section'>
                <h3>Email notifications</h3>
                <p className='section-description'>
                   Manage how you receive reminder notifications
                </p>

                {/* Toggle — visually changes but does not yet persist to the backend (see TODO above) */}
                <div className='setting-item'>
                    <div className='setting-info'>
                        <strong>Email reminders</strong>
                        <p>Receive an email when a scheduled reminder is due.</p>
                    </div>
                    <label className='toggle-switch'>
                        <input
                            type='checkbox'
                            checked={emailNotifications}
                            onChange={handleToggleNotifications}
                        />
                        <span className='toggle-slider'></span>
                    </label>
                </div>

                <div className='setting-item'>
                    <div className='setting-info'>
                        <strong>Test the mail setup</strong>
                        <p>Sends a dummy email so you can verify it lands in your inbox.</p>
                    </div>
                    <button
                        onClick={handleTestEmail}
                        disabled={sendingTest}
                        className='test-button-email'
                    >
                        {sendingTest ? 'Sending…' : 'Send test email'}
                    </button>
                </div>
            </div>

            <div className='settings-section'>
                <h3>How it works</h3>
                <div className='email-info-box'>
                    <p>Reminders are sent to the email address on your account.</p>
                    <p>The scheduler checks every 5 minutes and dispatches anything due.</p>
                    <p>You can disable a reminder at any time without deleting it.</p>
                </div>
            </div>
        </div>
    );
}

export default Settings;
