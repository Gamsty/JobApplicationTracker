import { useState, useEffect } from "react";
import { documentService } from "../services/documentService";
import { DOCUMENT_TYPE_LABELS, getFileIcon } from '../utils/constants';
import './DocumentList.css';

// Displays all documents attached to a single job application.
// Props:
//   applicationId — ID of the application whose documents are shown
//   onUpload      — callback invoked when the user clicks an upload button
function DocumentList({ applicationId, onUpload }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Re-fetch documents whenever the viewed application changes
    useEffect(() => {
        if (applicationId) {
            loadDocuments();
        }
    }, [applicationId]);

    // Fetches documents for the current application from the backend
    const loadDocuments = async () => {
        try {
            setLoading(true);
            const data = await documentService.getDocumentByApplication(applicationId);
            setDocuments(data);
            setError(null);
        } catch (err) {
            setError('Failed to load documents');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Triggers a browser file download for the given document
    const handleDownload = async (doc) => {
        try {
            await documentService.downloadDocument(doc.id, doc.originalFileName);
        } catch (err) {
            alert('Failed to download document');
            console.error(err);
        }
    };

    // Asks for confirmation then permanently deletes the document
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                await documentService.deleteDocument(id);
                loadDocuments(); // Refresh the list after deletion
            } catch (err) {
                alert('Failed to delete document');
                console.error(err);
            }
        }
    };

    // Formats an ISO date string to a short, readable format (e.g. "Jan 5, 2025")
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Show a loading placeholder while documents are being fetched
    if (loading) {
        return <div className="documents-loading">Loading documents...</div>;
    }

    // Show an error message if the fetch failed
    if (error) {
        return <div className="documents-error">{error}</div>;
    }

    return (
        <div className="document-list-container">
            {/* Header row with document count and upload button */}
            <div className="document-list-header">
                <h3>
                    Documents ({documents.length})
                </h3>
                <button onClick={onUpload} className="upload-button-document">
                    📤 Upload Document
                </button>
            </div>

            {documents.length === 0 ? (
                /* Empty state — shown when no documents have been uploaded yet */
                <div className="no-documents">
                    <p>
                        No documents uploaded yet.
                    </p>
                    <button onClick={onUpload} className="upload-button-first">
                        Upload Your First Document
                    </button>
                </div>
            ) : (
                /* Document grid — one card per document */
                <div className="documents-grid">
                    {documents.map((doc) => (
                        <div key={doc.id} className="document-card">
                            {/* Emoji icon based on the actual file format (PDF, Word, image, etc.) */}
                            <div className="document-icon">
                                {getFileIcon(doc.fileType)}
                            </div>

                            <div className="document-info">
                                {/* Human-readable document type label */}
                                <div className="document-type-badge">
                                    {DOCUMENT_TYPE_LABELS[doc.documentType]}
                                </div>

                                {/* Original file name as uploaded by the user */}
                                <div className="document-filename">
                                    {doc.originalFileName}
                                </div>

                                {/* File size and upload date metadata */}
                                <div className="document-meta">
                                    <span className="file-size">{doc.fileSizeFormatted}</span>
                                    <span className="seperator">•</span>
                                    <span className="upload-date">{formatDate(doc.uploadedAt)}</span>
                                </div>

                                {/* Optional description — only rendered if present */}
                                {doc.description && (
                                    <div className="document-description">
                                        {doc.description}
                                    </div>
                                )}
                            </div>

                            {/* Action buttons: download and delete */}
                            <div className="document-actions">
                                <button
                                    onClick={() => handleDownload(doc)}
                                    className="download-button"
                                    title="Download"
                                >
                                    ⬇️
                                </button>
                                <button
                                    onClick={() => handleDelete(doc.id)}
                                    className="delete-button-doc"
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

export default DocumentList;
