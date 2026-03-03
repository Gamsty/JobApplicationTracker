import { useState, useEffect } from "react";
import { reminderService } from "../services/reminderService";
import {
    REMINDER_TYPE_LABELS,
    REMINDER_TYPE_ICONS
} from '../utils/constants';
import './ReminderList.css';

// Displays all reminders for the current user with filter tabs (Pending / All / Sent).
// onEdit — called with a reminder object when the user clicks the edit button.
// onCreate — called when the user clicks "Create Reminder".
function ReminderList({ onEdit, onCreate }) {
    const [reminders, setReminders] = useState([]);
    const [filter, setFilter] = useState('PENDING'); // PENDING, ALL, SENT
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Reload the list whenever the filter changes
    useEffect(() => {
        loadReminders();
    }, [filter]);

    // Fetches reminders from the backend based on the active filter tab.
    // PENDING uses the dedicated /pending endpoint; SENT filters client-side from the full list.
    const loadReminders = async () => {
        try {
            setLoading(true);
            let data;
            if (filter === 'PENDING') {
                data = await reminderService.getPendingReminders();
            } else {
                const allReminders = await reminderService.getAllReminders();
                if (filter === 'SENT') {
                    data = allReminders.filter(r => r.sent);
                } else {
                    data = allReminders;
                }
            }

            setReminders(data);
            setError(null);
        } catch (err) {
            setError('Failed to load reminders');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Flips the enabled/disabled state of a reminder and refreshes the list
    const handleToggle = async (id) => {
        try {
            await reminderService.toggleReminder(id);
            loadReminders();
        } catch (err) {
            alert('Failed to toggle reminder');
            console.error(err);
        }
    };

    // Asks for confirmation then permanently deletes the reminder
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this reminder?')) {
            try {
                await reminderService.deleteReminder(id);
                loadReminders();
            } catch (err) {
                alert('Failed to delete reminder');
                console.error(err);
            }
        }
    };

    // Formats a LocalDateTime string (e.g. "2026-03-10T14:30:00") into a readable date+time
    const formatDateTime = (dateTimeString) => {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Returns a human-readable countdown string (e.g. "In 3 days", "In 2 hours", "Very soon")
    const getTimeUntil = (dateTimeString) => {
        const now = new Date();
        const target = new Date(dateTimeString);
        const diffMs = target - now;

        if (diffMs < 0) return 'Past due';

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (diffDays > 0) {
            return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
        } else if (diffHours > 0) {
            return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
        } else {
            return 'Very soon';
        }
    };

    // Returns true if the scheduled time is in the past (used to show the Overdue badge)
    const isPastDue = (dateTimeString) => {
        return new Date(dateTimeString) < new Date();
    };

    if (loading) {
        return <div className="reminders-loading">Loading reminders...</div>
    }

    if (error) {
        return <div className="reminders-error">{error}</div>
    }

    return (
        <div className="reminder-list-container">
            <div className="reminder-list-header">
                <h2>Reminders</h2>
                <button
                    onClick={onCreate}
                    className="create-button-reminder"
                >
                    + Create Reminder
                </button>
            </div>

            {/* Filter tabs — clicking a tab re-fetches with the appropriate filter */}
            <div className="reminder-filter-tabs">
                <button
                    className={`filter-tab ${filter === 'PENDING' ? 'active' : ''}`}
                    onClick={() => setFilter('PENDING')}
                >
                    Pending
                </button>
                <button
                    className={`filter-tab ${filter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setFilter('ALL')}
                >
                    ALL
                </button>
                <button
                    className={`filter-tab ${filter === 'SENT' ? 'active' : ''}`}
                    onClick={() => setFilter('SENT')}
                >
                    SENT
                </button>
            </div>

            {reminders.length === 0 ? (
                // Empty state — show a prompt to create the first reminder when on the Pending tab
                <div className="no-reminders">
                    <p>
                        No {filter.toLowerCase()} reminders.
                    </p>
                    {filter === 'PENDING' && (
                        <button
                            onClick={onCreate}
                            className="create-button-first"
                        >
                            Create Your First Reminder
                        </button>
                    )}
                </div>
            ) : (
                <div className="reminders-list">
                    {reminders.map((reminder) => (
                        // Card gets extra CSS classes based on state for visual styling
                        <div
                            key={reminder.id}
                            className={`reminder-card ${reminder.sent ? 'sent' : ''}
                                        ${!reminder.enabled ? 'disabled' : ''}
                                        ${isPastDue(reminder.scheduledFor)
                                            && !reminder.sent ? 'overdue' : ''}`}
                        >
                            {/* Left icon column — emoji based on reminder type */}
                            <div className="reminder-icon">
                                {REMINDER_TYPE_ICONS[reminder.reminderType]}
                            </div>

                            <div className="reminder-content">
                                <div className="reminder-header">
                                    <h3 className="reminder-title">
                                        {reminder.title}
                                    </h3>
                                    {/* Status badges — at most one of Sent / Disabled / Overdue is shown */}
                                    <div className="reminder-badges">
                                        {reminder.sent && (
                                            <span className="badge sent-badge">
                                                ✓ Sent
                                            </span>
                                        )}
                                        {!reminder.enabled && !reminder.sent && (
                                            <span className="badge disabled-badge">
                                                Disabled
                                            </span>
                                        )}
                                        {isPastDue(reminder.scheduledFor) && !reminder.sent && (
                                            <span className="badge overdue-badge">
                                                Overdue
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Reminder category label (e.g. "Follow Up", "Interview Reminder") */}
                                <div className="reminder-type">
                                    {REMINDER_TYPE_LABELS[reminder.reminderType]}
                                </div>

                                {/* Optional longer message body — only rendered if provided */}
                                {reminder.message && (
                                    <div className="reminder-message">
                                        {reminder.message}
                                    </div>
                                )}

                                {/* Linked application company — only shown if reminder is tied to an application */}
                                {reminder.applicationCompany && (
                                    <div className="reminder-application">
                                        📋 {reminder.applicationCompany}
                                    </div>
                                )}

                                {/* Linked interview round — only shown if reminder is tied to an interview */}
                                {reminder.interviewRound && (
                                    <div className="reminder-interview">
                                       📅 {reminder.interviewRound}
                                    </div>
                                )}

                                {/* Scheduled time + countdown (countdown hidden once sent or disabled) */}
                                <div className="reminder-schedule">
                                    <span className="schedule-time">
                                        {formatDateTime(reminder.scheduledFor)}
                                    </span>
                                    {!reminder.sent && reminder.enabled && (
                                        <span className="time-until">
                                            ({getTimeUntil(reminder.scheduledFor)})
                                        </span>
                                    )}
                                </div>

                                {/* Actual sent timestamp — only shown after the scheduler has processed it */}
                                {reminder.sent && reminder.sentAt && (
                                    <div className="reminder-sent-at">
                                        Sent on {formatDateTime(reminder.sentAt)}
                                    </div>
                                )}
                            </div>

                            {/* Action buttons — edit and toggle are hidden once a reminder has been sent */}
                            <div className="reminder-actions">
                                {!reminder.sent && (
                                    <>
                                        <button
                                            onClick={() => handleToggle(reminder.id)}
                                            className="toggle-button"
                                            title={reminder.enabled ? 'Disable' : 'Enable'}
                                        >
                                            {reminder.enabled ? '🔔' : '🔕'}
                                        </button>
                                        <button
                                            onClick={() => onEdit(reminder)}
                                            className="edit-button-reminder"
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => handleDelete(reminder.id)}
                                    className="delete-button-reminder"
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ReminderList;
