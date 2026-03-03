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

            {/* ── Email Notifications section ─────────────────────────────── */}
            <div className='settings-section'>
                <h3>Email Notifications</h3>
                <p className='section-description'>
                   Manage how you receive reminder notifications
                </p>

                {/* Toggle — visually changes but does not yet persist to the backend (see TODO above) */}
                <div className='setting-item'>
                    <div className='setting-info'>
                        <strong>Email Reminders</strong>
                        <p>Receive email notifications for your reminders</p>
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

                {/* Test email — useful for verifying Gmail SMTP credentials are correct */}
                <div className='setting-item'>
                    <div className='setting-info'>
                        <strong>Test Email Configuration</strong>
                        <p>Send a test email to verify your settings</p>
                    </div>
                    <button
                        onClick={handleTestEmail}
                        disabled={sendingTest}
                        className='test-button-email'
                    >
                        {sendingTest ? 'Sending...' : 'Send Test Email'}
                    </button>
                </div>
            </div>

            {/* ── Email Settings info box ──────────────────────────────────── */}
            <div className='settings-section'>
                <h3>Email Settings</h3>
                <div className='email-info-box'>
                    <p>📧 Email reminders are sent to the email address associated with your account.</p>
                    <p>⏰ Reminders are checked and sent every 5 minutes.</p>
                    <p>🔔 You'll receive an email when the scheduled time arrives.</p>
                </div>
            </div>
        </div>
    );
}

export default Settings;
