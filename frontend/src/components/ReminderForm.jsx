import { useState, useEffect } from "react";
import { REMINDER_TYPE, REMINDER_TYPE_LABELS } from "../utils/constants";
import './ReminderForm.css';
import './ApplicationForm.css';

// Modal form for creating a new reminder or editing an existing one.
// reminder    — if provided, pre-fills the form for editing; null/undefined means creating
// applications — list of the user's applications to optionally link the reminder to
// onSubmit    — called with the validated payload when the user saves
// onCancel    — called when the user closes without saving
function ReminderForm({ reminder, applications, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({ 
        reminderType: REMINDER_TYPE.CUSTOM,
        title: '',
        message: '',
        scheduledDate: '',
        scheduledTime: '',
        applicationId: '',
        enabled: true
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // When editing, pre-fill the form with the existing reminder's values
    useEffect(() => {
        if (reminder) {
            const dateTime = new Date(reminder.scheduledFor);
            const dateStr = dateTime.toISOString().split('T')[0];          
            const timeStr = dateTime.toISOString().split('T')[1].slice(0, 5);

            setFormData({
                reminderType: reminder.reminderType,
                title: reminder.title,
                message: reminder.message || '',
                scheduledDate: dateStr,
                scheduledTime: timeStr,
                applicationId: reminder.applicationId || '',
                enabled: reminder.enabled
            });
        }
    }, [reminder]);

    // Updates a single field in formData and clears its validation error
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear the field's error as soon as the user starts correcting it
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    // Returns true if all required fields pass validation; populates errors state otherwise
    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.scheduledDate) {
            newErrors.scheduledDate = 'Date is required';
        }

        if (!formData.scheduledTime) {
            newErrors.scheduledTime = 'Time is required';
        }

        // Reject reminders scheduled in the past — backend also validates this with @Future
        if (formData.scheduledDate && formData.scheduledTime) {
            const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`)
            if (scheduledDateTime <= new Date()) {
                newErrors.scheduledDate = 'Reminder must be scheduled for a future time';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Validates, assembles the API payload, and calls onSubmit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Combine separate date and time fields into a single LocalDateTime string
            const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);

            const submitData = {
                reminderType: formData.reminderType,
                title: formData.title,
                message: formData.message || null,
                // Spring LocalDateTime requires "2026-03-10T14:30:00" — slice removes ms and Z suffix
                scheduledFor: scheduledDateTime.toISOString().slice(0, 19),
                applicationId: formData.applicationId ? parseInt(formData.applicationId) : null,
                enabled: formData.enabled
            };

            await onSubmit(submitData);
        } catch (err) {
            console.error('Form submission error', err);
            alert('Failed to save reminder. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="form-overlay">
            <div className="form-container reminder-form-container">
                <div className="form-header">
                    <h2>
                        {reminder ? 'Edit Reminder' : 'Create Reminder'}
                    </h2>
                    <button
                        className="close-button"
                        onClick={onCancel}
                    >
                        ×
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="application-form"
                >
                    {/* Reminder Type */}
                    <div className="form-group">
                        <label htmlFor="reminderType">
                            Reminder Type
                            <span className="required">*</span>
                        </label>
                        <select
                            id="reminderType"
                            name="reminderType"
                            value={formData.reminderType}
                            onChange={handleChange}
                        >
                            {/* Render one option per enum value using human-readable labels */}
                            {Object.keys(REMINDER_TYPE).map(type => (
                                <option key={type} value={type}>
                                    {REMINDER_TYPE_LABELS[type]}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div className="form-group">
                        <label htmlFor="title">
                            Title
                            <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={errors.title ? 'input-error' : ''}
                            placeholder="e.g., Follow up with Google"
                        />
                        {errors.title && (
                            <span className="error-message">{errors.title}</span>
                        )}
                    </div>

                    {/* Message (optional) */}
                    <div className="form-group">
                        <label htmlFor="message">
                            Message (Optional)
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Additional details about this reminder"
                        />
                    </div>

                    {/* Date and Time — side by side on wider screens via form-row */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="scheduledDate">
                                Date
                                <span className="required">*</span>
                            </label>
                            <input
                                type="date"
                                id="scheduledDate"
                                name="scheduledDate"
                                value={formData.scheduledDate}
                                onChange={handleChange}
                                className={errors.scheduledDate ? 'input-error' : ''}
                            />
                            {errors.scheduledDate && (
                                <span className="error-message">{errors.scheduledDate}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="scheduledTime">
                                Time
                                <span className="required">*</span>
                            </label>
                            <input
                                type="time"
                                id="scheduledTime"
                                name="scheduledTime"
                                value={formData.scheduledTime}
                                onChange={handleChange}
                                className={errors.scheduledTime ? 'input-error' : ''}
                            />
                            {errors.scheduledTime && (
                                <span className="error-message">{errors.scheduledTime}</span>
                            )}
                        </div>
                    </div>

                    {/* Link to Application (only shown if the user has existing applications) */}
                    {applications && applications.length > 0 && (
                        <div className="form-group">
                            <label htmlFor="applicationId">
                                Link to Application (Optional)
                            </label>
                            <select
                                id="applicationId"
                                name="applicationId"
                                value={formData.applicationId}
                                onChange={handleChange}
                            >
                                <option value="">None</option>
                                {applications.map(app => (
                                    <option key={app.id} value={app.id}>
                                        {app.companyName} - {app.positionTitle}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Enabled toggle — when unchecked, the reminder is saved but the scheduler skips it */}
                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="enabled"
                                checked={formData.enabled}
                                onChange={handleChange}
                            />
                            <span>Reminder enabled (you'll receive an email)</span>
                        </label>
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="cancel-button"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="submit-button"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (reminder ? 'Update Reminder' : 'Create Reminder')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ReminderForm;
