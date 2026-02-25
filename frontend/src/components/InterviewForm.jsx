import { useState, useEffect } from "react";
import {
    INTERVIEW_STATUS,
    INTERVIEW_STATUS_LABELS,
    INTERVIEW_FORMAT,
    INTERVIEW_FORMAT_LABELS
} from '../utils/constants';
import './InterviewForm.css';

// Modal form used for both creating and editing an interview.
// Props:
//   interview     — existing interview object when editing, undefined/null when creating
//   applicationId — ID of the parent application (used when creating a new interview)
//   onSubmit      — async callback called with the validated payload; parent handles the API call
//   onCancel      — callback to close the modal without saving
function InterviewForm({ interview, applicationId, onSubmit, onCancel }) {
    // Separate date and time into two inputs so the user gets a native date picker
    // and a native time picker rather than a single freeform datetime field.
    const [formData, setFormData] = useState({
        applicationId: applicationId || '',
        round: '',
        scheduledDate: '',
        scheduledTime: '',
        status: INTERVIEW_STATUS.SCHEDULED,
        interviewerName: '',
        interviewerRole: '',
        format: '',
        location: '',
        notes: '',
        feedback: '',
        rating: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // When editing, pre-fill every field from the existing interview object.
    // The dependency array ensures this only runs when a different interview is passed in.
    useEffect(() => {
        if (interview) {
            // Split the ISO datetime from the backend into separate date and time strings
            // so they match the value format expected by <input type="date"> and <input type="time">
            const dateTime = new Date(interview.scheduledDate);
            const dateStr = dateTime.toISOString().split('T')[0];   // "YYYY-MM-DD"
            const timeStr = dateTime.toISOString().slice(11, 16);   // "HH:MM"

            setFormData({
                applicationId: interview.applicationId,
                round: interview.round,
                scheduledDate: dateStr,
                scheduledTime: timeStr,
                status: interview.status,
                interviewerName: interview.interviewerName || '',
                interviewerRole: interview.interviewerRole || '',
                format: interview.format || '',
                location: interview.location || '',
                notes: interview.notes || '',
                feedback: interview.feedback || '',
                rating: interview.rating || ''
            });
        }
    }, [interview]);

    // Generic change handler — updates the matching field in formData by input name.
    // Also clears any existing validation error for that field so stale messages disappear.
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    // Client-side validation — returns true if all required fields pass, false otherwise.
    // Sets error messages that are displayed inline next to each field.
    const validateForm = () => {
        const newErrors = {};

        if (!formData.round.trim()) {
            newErrors.round = 'Interview round is required';
        }

        if (!formData.scheduledDate) {
            newErrors.scheduledDate = 'Date is required';
        }

        if (!formData.scheduledTime) {
            newErrors.scheduledTime = 'Time is required';
        }

        if (!formData.status) {
            newErrors.status = 'Status is required';
        }

        // Rating is optional — only validate range if the user actually entered a value
        if (formData.rating && (formData.rating < 1 || formData.rating > 5)) {
            newErrors.rating = 'Rating must be between 1 and 5';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Combine the separate date and time inputs into a single ISO datetime string
            // that the backend's LocalDateTime field can deserialise
            const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);

            const submitData = {
                applicationId: formData.applicationId,
                round: formData.round,
                scheduledDate: scheduledDateTime.toISOString(),
                // Use formData.status so edits to the status dropdown are reflected in the payload
                status: formData.status,
                interviewerName: formData.interviewerName || null,
                // Backend field name is interviewerRole (no extra 'er') — must match exactly
                interviewerRole: formData.interviewerRole || null,
                format: formData.format || null,
                location: formData.location || null,
                notes: formData.notes || null,
                feedback: formData.feedback || null,
                // Backend expects an Integer; parse the string value from the number input
                rating: formData.rating ? parseInt(formData.rating) : null
            };

            await onSubmit(submitData);
        } catch (err) {
            console.error('Form submission error:', err);
            alert('Failed to save interview. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="form-overlay">
            <div className="form-container interview-form-container">
                <div className="form-header">
                    {/* Title changes based on whether we're creating or editing */}
                    <h2>{interview ? 'Edit Interview' : 'Schedule Interview'}</h2>
                    <button className="close-button" onClick={onCancel}>x</button>
                </div>

                <form onSubmit={handleSubmit} className="application-form">
                    {/* Interview Round ── required */}
                    <div className="form-group">
                        <label htmlFor="round">
                            Interview Round
                            <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="round"
                            name="round"
                            value={formData.round}
                            onChange={handleChange}
                            className={errors.round ? 'input-error' : ''}
                            placeholder="e.g., Phone Screen, Technical Round, Final Interview"
                        />
                        {errors.round && (
                            <span className="error-message">{errors.round}</span>
                        )}
                    </div>

                    {/* Date and time — split into two native pickers for better UX */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="scheduledDate">
                                Date <span className="required">*</span>
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

                    {/* Status and Format — both use the constants maps to build the option lists */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="status">
                                Status <span className="required">*</span>
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className={errors.status ? 'input-error' : ''}
                            >
                                {Object.keys(INTERVIEW_STATUS).map(status => (
                                    <option key={status} value={status}>
                                        {INTERVIEW_STATUS_LABELS[status]}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="format">Format</label>
                            <select
                                id="format"
                                name="format"
                                value={formData.format}
                                onChange={handleChange}
                            >
                                <option value="">Select format...</option>
                                {Object.keys(INTERVIEW_FORMAT).map(format => (
                                    <option key={format} value={format}>
                                        {INTERVIEW_FORMAT_LABELS[format]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Interviewer details - both optional */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="interviewerName">Interviewer Name</label>
                            <input
                                type="text"
                                id="interviewerName"
                                name="interviewerName"
                                value={formData.interviewerName}
                                onChange={handleChange}
                                placeholder="e.g., John Doe"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="interviewerRole">Interviewer Role</label>
                            <input
                                type="text"
                                id="interviewerRole"
                                name="interviewerRole"
                                value={formData.interviewerRole}
                                onChange={handleChange}
                                placeholder="e.g., Senior Engineer, Consultant"
                            />
                        </div>
                    </div>

                    {/* Location — optional; can be a physical address or a video call URL */}
                    <div className="form-group">
                        <label htmlFor="location">Location / Meeting Link</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Office address or video call link"
                        />
                    </div>

                    {/* Preparation notes - textarea for multi-line input */}
                    <div className="form-group">
                        <label htmlFor="notes">Preparation Notes</label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Things to prepare, topics to review, questions to ask..."
                        />
                    </div>

                    {/* Feedback and rating - only shown after the interview is marked COMPLETED */}
                    {formData.status === INTERVIEW_STATUS.COMPLETED && (
                        <>
                            <div className="form-group">
                                <label htmlFor="feedback">Interview Feedback</label>
                                <textarea
                                    id="feedback"
                                    name="feedback"
                                    value={formData.feedback}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="How did the interview go? What was discussed?"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="rating">Your Rating (1-5)</label>
                                <input
                                    type="number"
                                    id="rating"
                                    name="rating"
                                    min="1"
                                    max="5"
                                    value={formData.rating}
                                    onChange={handleChange}
                                    placeholder="Rate your interview experience"
                                    className={errors.rating ? 'input-error' : ''}
                                />
                                {errors.rating && (
                                    <span className="error-message">{errors.rating}</span>
                                )}
                                <span className="char-count">
                                    ⭐ Rate from 1 (poor) to 5 (excellent)
                                </span>
                            </div>
                        </>
                    )}

                    {/* Form actions - Cancel dismisses without saving, Submit triggers validation */}
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
                            {isSubmitting ? 'Saving...' : (interview ? 'Update Interview' : 'Schedule Interview')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default InterviewForm;
