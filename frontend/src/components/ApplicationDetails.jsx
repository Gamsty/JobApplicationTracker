import { useState } from "react";
import InterviewForm from "./InterviewForm";
import InterviewList from "./Interviewlist";
import DocumentList from "./DocumentList";
import DocumentUploadForm from "./DocumentUploadForm";
import { interviewService } from "../services/interviewService";
import { STATUS_COLORS, STATUS_LABELS } from "../utils/constants";
import './ApplicationDetails.css';
import { documentService } from "../services/documentService";

// Modal panel that shows the full details of a single application and
// hosts the InterviewList / InterviewForm sub-components.
// Props:
//   application — the full application object to display
//   onClose     — callback to close this panel
//   onUpdate    — callback fired with the application when "Edit Application" is clicked
//   showToast   — callback(message, type) for success/error notifications
function ApplicationDetails({ application, onClose, onUpdate, showToast }) {
    // Controls whether the InterviewForm modal is visible
    const [showInterviewForm, setShowInterviewForm] = useState(false);
    // Holds the interview being edited; null when creating a new one
    const [editingInterview, setEditingInterview] = useState(null);
    // Incrementing this key forces InterviewList to remount and re-fetch after a mutation
    const [refreshKey, setRefreshKey] = useState(0);
    // Controls whether the DocumentUploadForm modal is visible
    const [showDocumentUpload, setShowDocumentUpload] = useState(false);
    // Incrementing this key forces DocumentList to remount and re-fetch after an upload or delete
    const [documentRefreshKey, setDocumentRefreshKey] = useState(0);

    // Opens the form in "create" mode (no pre-filled interview)
    const handleAddInterview = () => {
        setEditingInterview(null);
        setShowInterviewForm(true);
    };

    // Opens the form in "edit" mode, pre-filling it with the selected interview
    const handleEditInterview = (interview) => {
        setEditingInterview(interview);
        setShowInterviewForm(true);
    };

    // Closes the form and clears the editing state
    const handleCloseInterviewForm = () => {
        setShowInterviewForm(false);
        setEditingInterview(null);
    };

    // Called by InterviewForm when creating a new interview.
    // On success: bumps refreshKey to reload the list, closes the form, shows a toast.
    // Re-throws on error so InterviewForm can keep its isSubmitting state accurate.
    const handleCreateInterview = async (formData) => {
        try {
            await interviewService.createInterview(formData);
            setRefreshKey(prev => prev + 1);
            handleCloseInterviewForm();
            showToast('Interview scheduled successfully!', 'success');
        } catch (err) {
            console.error('Error creating interview:', err);
            showToast('Failed to schedule interview', 'error');
            throw err;
        }
    };

    // Called by InterviewForm when updating an existing interview.
    // Uses editingInterview.id (set by handleEditInterview) as the target ID.
    const handleUpdateInterview = async (formData) => {
        try {
            await interviewService.updateInterview(editingInterview.id, formData);
            setRefreshKey(prev => prev + 1);
            handleCloseInterviewForm();
            showToast('Interview updated successfully!', 'success');
        } catch (err) {
            console.error('Error updating interview:', err);
            showToast('Failed to update interview', 'error');
            throw err;
        }
    };

    // Formats an ISO date string into a long-form date (e.g. "February 25, 2026")
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Opens the DocumentUploadForm modal
    const handleUploadDocument = () => {
        setShowDocumentUpload(true);
    };

    // Closes the DocumentUploadForm modal
    const handleCloseDocumentUpload = () => {
        setShowDocumentUpload(false);
    };

    // Called by DocumentUploadForm on submission.
    // Uploads the file, bumps documentRefreshKey to reload DocumentList, then closes the modal.
    // Re-throws on error so DocumentUploadForm can keep its isSubmitting state accurate.
    const handleDocumentUpload = async (file, documentType, description) => {
        try {
            await documentService.uploadDocument(file, application.id, documentType, description);
            setDocumentRefreshKey(prev => prev + 1);
            handleCloseDocumentUpload();
            showToast('Document uploaded successfully!', 'success');
        } catch (err) {
            console.error('Error uploading document:', err);
            showToast('Failed to upload document', 'error');
            throw err;
        }
    };

    return (
        <div className="form-overlay">
            <div className="application-details-container">
                <div className="form-header">
                    <h2>Application Details</h2>
                    <button className="close-button" onClick={onClose}>x</button>
                </div>

                <div className="details-content">
                    {/* Application summary section */}
                    <div className="details-section">
                        <div className="company-header">
                            <h3>{application.companyName}</h3>
                            {/* Status badge — background colour driven by STATUS_COLORS lookup */}
                            <span
                                className="status-badge"
                                style={{ backgroundColor: STATUS_COLORS[application.status] }}
                            >
                                {STATUS_LABELS[application.status]}
                            </span>
                        </div>

                        <div className="position-title">
                            {application.positionTitle}
                        </div>

                        <div className="details-grid">
                            <div className="detail-item">
                                <strong>Applied On:</strong>
                                <span>{formatDate(application.applicationDate)}</span>
                            </div>

                            {/* Job posting link — only rendered if a URL was provided */}
                            {application.jobUrl && (
                                <div className="detail-item">
                                    <strong>Job Posting:</strong>
                                    <a
                                        href={application.jobUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="job-link"
                                    >
                                        View Posting →
                                    </a>
                                </div>
                            )}

                            {/* Notes — only rendered if present; spans both grid columns via full-width class */}
                            {application.notes && (
                                <div className="detail-item full-width">
                                    <strong>Notes:</strong>
                                    <p className="notes-text">{application.notes}</p>
                                </div>
                            )}

                            <div className="details-actions">
                                <button
                                    onClick={() => onUpdate(application)}
                                    className="edit-button-app"
                                >
                                    Edit Application
                                </button>
                            </div>
                        </div>

                        {/* Interview section — refreshKey forces a remount after create/update/delete */}
                        <div className="details-section">
                            <InterviewList
                                key={refreshKey}
                                applicationId={application.id}
                                onEdit={handleEditInterview}
                                onAdd={handleAddInterview}
                            />
                        </div>
                        
                        {/* Document section — documentRefreshKey forces a remount after upload/delete. */}
                        <div className="details-section">
                            <DocumentList
                                key={documentRefreshKey}
                                applicationId={application.id}
                                onUpload={handleUploadDocument}
                            />
                        </div>
                    </div>

                    {/* Interview form modal — rendered on top of this panel when open.
                        onSubmit routes to create or update depending on whether an interview is being edited. */}
                    {showInterviewForm && (
                        <InterviewForm
                            interview={editingInterview}
                            applicationId={application.id}
                            onSubmit={editingInterview ? handleUpdateInterview : handleCreateInterview}
                            onCancel={handleCloseInterviewForm}
                        />
                    )}

                    {/* Document Upload Form */ }
                    {showDocumentUpload && (
                        <DocumentUploadForm
                            applicationId={application.id}
                            onSubmit={handleDocumentUpload}
                            onCancel={handleCloseDocumentUpload}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default ApplicationDetails;
