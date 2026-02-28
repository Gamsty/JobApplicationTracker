import { useState } from "react";
import { DOCUMENT_TYPE, DOCUMENT_TYPE_LABELS } from "../utils/constants";
import './DocumentUploadForm.css';

// Modal form for uploading a document to a specific job application.
// Props:
//   applicationId — ID of the application this document belongs to
//   onSubmit      — async callback(file, documentType, description) called on valid submission
//   onCancel      — callback invoked when the user dismisses the form
function DocumentUploadForm({ applicationId, onSubmit, onCancel }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [documentType, setDocumentType] = useState(DOCUMENT_TYPE.RESUME);
    const [description, setDescription] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // MIME types accepted by the backend file storage service
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'text/plain'
    ];

    const maxSize = 10 * 1024 * 1024; // 10 MB in bytes

    // Validates and stores the chosen file, setting an error message if invalid
    const handleFileSelect = (file) => {
        setErrors({});

        // Reject unsupported MIME types
        if (!allowedTypes.includes(file.type)) {
            setErrors({ file: 'File type not allowed. Please upload PDF, Word, Image, or Text files.'})
            return;
        }

        // Reject files that exceed the size limit
        if (file.size > maxSize) {
            setErrors({ file: 'File size exceeds 10MB limit.'});
            return;
        }

        setSelectedFile(file);
    };

    // Handles file selection via the hidden <input type="file"> element
    const handleFileInputChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    // Handles all drag events to show/hide the drop-zone highlight
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    // Handles the file drop event and passes the dropped file to validation
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    // Validates the form and delegates the upload to the parent via onSubmit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            setErrors({ file: 'Please select a file to upload' })
            return;
        }

        setIsSubmitting(true);

        try {
            await onSubmit(selectedFile, documentType, description || null);
            // Form will be closed by the parent component on success
        } catch (err) {
            console.error('Upload error:', err);
            setErrors({ submit: 'Failed to upload document. Please try again.' })
        } finally {
            setIsSubmitting(false);
        }
    };

    // Converts a byte count to a human-readable MB or KB string
    const formatFileSize = (bytes) => {
        const mb = bytes / (1024 * 1024);
        if (mb >= 1) return `${mb.toFixed(2)} MB`;
        const kb = bytes / 1024;
        return `${kb.toFixed(2)} KB`
    };

    return (
        <div className="form-overlay">
            <div className="form-container document-upload-form">
                <div className="form-header">
                    <h2>Upload Document</h2>
                    <button
                        className="close-button"
                        onClick={onCancel}
                    >x</button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="upload-form"
                >
                    {/* Global submission error banner */}
                    {errors.submit && (
                        <div className="error-alert">
                            {errors.submit}
                        </div>
                    )}

                    {/* Drag-and-drop file zone — also acts as a click-to-browse target */}
                    <div
                        className={`file-drop-zone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {selectedFile ? (
                            /* Selected file preview — shows name, size, and a remove button */
                            <div className="selected-file-info">
                                <div className="file-icon">📎</div>
                                <div className="file-details">
                                    <div className="file-name">
                                        {selectedFile.name}
                                    </div>
                                    <div className="file-size">
                                        {formatFileSize(selectedFile.size)}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedFile(null)}
                                    className="remove-button-file"
                                >
                                    x
                                </button>
                            </div>
                        ) : (
                            /* Empty drop-zone prompt with a hidden file input */
                            <>
                                <div className="upload-icon">📤</div>
                                <p className="upload-text">
                                    <strong>Click to upload</strong> or drag and drop
                                </p>
                                <p className="upload-hint">
                                    PDF, Word, Image, or Text (Max 10MB)
                                </p>
                                <input
                                    type="file"
                                    onChange={handleFileInputChange}
                                    accept=".pdf, .doc, .docx, .jpg, .jpeg, .png, .txt"
                                    className="file-input-hidden"
                                    id="file-input"
                                />
                                <label
                                    htmlFor="file-input"
                                    className="select-button-file"
                                >
                                    Select File
                                </label>
                            </>
                        )}
                    </div>

                    {/* Inline file validation error */}
                    {errors.file && (
                        <div className="error-message">
                            {errors.file}
                        </div>
                    )}

                    {/* Document type selector — maps to the backend DocumentType enum */}
                    <div className="form-group">
                        <label htmlFor="documentType">
                            Document Type <span className="required">*</span>
                        </label>
                        <select
                            id="documentType"
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                        >
                            {Object.keys(DOCUMENT_TYPE).map(type => (
                                <option
                                    key={type}
                                    value={type}
                                >
                                    {DOCUMENT_TYPE_LABELS[type]}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Optional free-text description (max 500 characters) */}
                    <div className="form-group">
                        <label htmlFor="description">
                            Description (Optional)
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="3"
                            placeholder="Add notes about this document..."
                            maxLength="500"
                        />
                        {/* Live character counter */}
                        <span className="char-count">
                            {description.length} / 500
                        </span>
                    </div>

                    {/* Form action buttons — Cancel and Submit */}
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
                            disabled={isSubmitting || !selectedFile}
                        >
                            {isSubmitting ? 'Uploading...' : 'Upload Document'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DocumentUploadForm;
