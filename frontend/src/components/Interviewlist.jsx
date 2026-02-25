import { useState, useEffect } from "react";
import { interviewService } from '../services/interviewService';
import {
    INTERVIEW_FORMAT_LABELS,
    INTERVIEW_STATUS_COLORS,
    INTERVIEW_STATUS_LABELS }
    from "../utils/constants";
import './InterviewList.css';

// Displays all interviews for a single application.
// Props:
//   applicationId — ID of the parent application whose interviews to load
//   onEdit        — callback fired with the full interview object when Edit is clicked
//   onAdd         — callback fired when "Schedule Interview" / "Schedule Your First Interview" is clicked
function InterviewList({ applicationId, onEdit, onAdd }) {
    // Start with an empty array so .length and .map are always safe before data arrives
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Re-fetch whenever the parent swaps to a different application
    useEffect(() => {
        if (applicationId) {
            loadInterviews();
        }
    }, [applicationId]);

    const loadInterviews = async () => {
        try {
            setLoading(true);
            const data = await interviewService.getInterviewsByApplication(applicationId);
            setInterviews(data);
            setError(null);
        } catch (err) {
            setError('Failed to load interviews');
            console.error(err);
        } finally {
            // Always clear the loading spinner, even if the request failed
            setLoading(false);
        }
    };

    // Ask for confirmation before deleting — destructive actions shouldn't be one-click
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this interview?')) {
            try {
                await interviewService.deleteInterview(id);
                loadInterviews(); // Reload list to reflect the deletion
            } catch (err) {
                alert('Failed to delete interview');
                console.error(err);
            }
        }
    };

    // Formats an ISO datetime string into a readable local date + time (e.g. "Mar 1, 2026, 10:00 AM")
    const formatDateTime = (dateTimeString) => {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('en-us', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Returns true if the scheduled date is in the future — used to apply the 'upcoming' CSS modifier
    const isUpcoming = (dateTimeString) => {
        return new Date(dateTimeString) > new Date();
    };

    if (loading) {
        return <div className="interview-loading">Loading interviews</div>;
    }

    if (error) {
        return <div className="interview-error">{error}</div>;
    }

    return (
        <div className="interview-list-container">
            <div className="interview-list-header">
                <h3>Interview Schedule ({interviews.length})</h3>
                <button onClick={onAdd} className="add-button-interview">
                    + Schedule Interview
                </button>
            </div>

            {interviews.length === 0 ? (
                // Empty state — shown before any interviews have been added
                <div className="no-interviews">
                   <p>No interviews scheduled yet.</p>
                   <button onClick={onAdd} className="add-button-first">
                        Schedule Your First Interview
                   </button>
                </div>
            ) : (
                <div className="interviews-timeline">
                    {interviews.map((interview) => (
                        <div
                            key={interview.id}
                            // 'upcoming' / 'past' modifier drives the left border colour in CSS
                            className={`interview-card ${isUpcoming(interview.scheduledDate) ? 'upcoming' : 'past'}`}
                        >
                            {/* Header: round name on the left, status badge on the right */}
                            <div className="interview-card-header">
                                <div className="interview-round">
                                    <span className="round-icon">📅</span>
                                    <h4>{interview.round}</h4>
                                </div>
                                {/* Background colour is driven by INTERVIEW_STATUS_COLORS lookup */}
                                <span
                                    className="interview-status-badge"
                                    style={{ backgroundColor: INTERVIEW_STATUS_COLORS[interview.status] }}
                                >
                                    {INTERVIEW_STATUS_LABELS[interview.status]}
                                </span>
                            </div>

                            <div className="interview-details">
                                {/* Scheduled date and time */}
                                <div className="interview-details-row">
                                    <span className="detail-icon">🕒</span>
                                    <span className="detail-text">
                                        {formatDateTime(interview.scheduledDate)}
                                    </span>
                                </div>

                                {/* Interview format (optional) — icon changes per format type */}
                                {interview.format && (
                                    <div className="interview-details-row">
                                        <span className="detail-icon">
                                            {interview.format === 'VIDEO_CALL' ? '📹':
                                            interview.format === 'PHONE_CALL' ? '📞':
                                            interview.format === 'IN_PERSON' ? '🏢': '📝'}
                                        </span>
                                        <span className="detail-text">
                                            {INTERVIEW_FORMAT_LABELS[interview.format]}
                                        </span>
                                    </div>
                                )}

                                {/* Interviewer name and role (optional) */}
                                {interview.interviewerName && (
                                    <div className="interview-details-row">
                                        <span className="detail-icon">👤</span>
                                        <span className="detail-text">
                                            {interview.interviewerName}
                                            {interview.interviewRole && ` - ${interview.interviewRole}`}
                                        </span>
                                    </div>
                                )}

                                {/* Location (optional) — rendered as a link if it's a URL */}
                                {interview.location && (
                                    <div className="interview-details-row">
                                        <span className="detail-icon">📍</span>
                                        <span className="detail-text location-text">
                                            {interview.location.startsWith('http') ? (
                                                <a href={interview.location} target="_blank" rel="noopener noreferrer">
                                                    Join Meeting
                                                </a>
                                            ) : (
                                                interview.location
                                            )}
                                        </span>
                                    </div>
                                )}

                                {/* Pre-interview notes (optional) */}
                                {interview.notes && (
                                    <div className="interview-notes">
                                        <strong>Notes:</strong>
                                        {interview.notes}
                                    </div>
                                )}

                                {/* Post-interview feedback (optional) */}
                                {interview.feedback && (
                                    <div className="interview-feedback">
                                        <strong>Feedback:</strong>
                                        {interview.feedback}
                                    </div>
                                )}

                                {/* Star rating (optional) — repeats the ⭐ emoji rating times */}
                                {interview.rating && (
                                    <div className="interview-rating">
                                        <strong>Rating:</strong>
                                        {'⭐'.repeat(interview.rating)}
                                    </div>
                                )}
                            </div>

                            <div className="interview-actions">
                                <button
                                    onClick={() => onEdit(interview)}
                                    className="edit-button-interview"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(interview.id)}
                                    className="delete-button-interview"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default InterviewList;
