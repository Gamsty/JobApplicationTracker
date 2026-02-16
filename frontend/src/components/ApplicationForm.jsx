import { useState, useEffect } from 'react';
import { APPLICATION_STATUS, STATUS_LABELS } from '../utils/constants';
import './ApplicationForm.css';

// Modal form component for creating and editing job applications
// Props:
//   application - existing application object when editing, null when creating
//   onSubmit - callback to handle form submission with the form data
//   onCancel - callback to close the modal without saving
function ApplicationForm({ application, onSubmit, onCancel}) {
    // Form state initialized with empty defaults for new applications
    const [formData, setFormData] = useState({
        companyName: '',
        positionTitle: '',
        applicationDate: '',
        status: 'APPLIED',
        jobUrl: '',
        notes: ''
    });

    const [errors, setErrors] = useState({}); // Tracks validation errors per field
    const [isSubmitting, setIsSubmitting] = useState(false); // Prevents duplicate submissions while API call is in progress

    // If editing, populate form with existing application data when component mounts
    useEffect(() => {
        if (application) {
            setFormData({
                companyName: application.companyName,
                positionTitle: application.positionTitle,
                applicationDate: application.applicationDate,
                status: application.status,
                jobUrl: application.jobUrl || '', // Default to empty string if null from backend
                notes: application.notes || '' // Default to empty string if null from backend
            });
        }
    }, [application]);

    // Generic change handler for all form inputs using the input's name attribute to update the correct field
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value // Dynamically update the field matching the input's name attribute
        }));

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    // Validates all form fields and returns true if the form is valid
    const validateForm = () => {
        const newErrors = {};

        // Company name: required, max 255 characters
        if (!formData.companyName.trim()) {
            newErrors.companyName = 'Company name required';
        } else if (formData.companyName.length > 255) {
            newErrors.companyName = 'Company name must be less than 255 characters';
        }

        // Position title: required, max 255 characters
        if (!formData.positionTitle.trim()) {
            newErrors.positionTitle = 'Position title is required';
        } else if (formData.positionTitle.length > 255) {
            newErrors.positionTitle = 'Position title must be less than 255 characters';
        }

        // Application date: required, cannot be in the future
        if (!formData.applicationDate) {
            newErrors.applicationDate = 'Application date is required';
        } else  {
            const today = new Date().toISOString().split('T')[0]; // Get today as 'YYYY-MM-DD' string

            if (formData.applicationDate > today) { // String comparison works correctly for YYYY-MM-DD format
                newErrors.applicationDate = 'Application date cannot be in the future';
            }
        }

        // Status: required
        if (!formData.status) {
            newErrors.status = 'Status is required';
        }

        // Job URL: optional, but if provided must be max 500 characters
        if (formData.jobUrl && formData.jobUrl.length > 500) {
            newErrors.jobUrl = 'Job URL must be less than 500 characters';
        }

        // Basic URL format validation using the URL constructor
        if (formData.jobUrl && formData.jobUrl.trim()) {
            try {
                new URL(formData.jobUrl); // Throws if URL format is invalid
            } catch {
                newErrors.jobUrl = 'Please enter a valid URL';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; // Return true if no errors found
    };

    // Handles form submission: validates, prepares data, and calls parent onSubmit callback
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default browser form submission

        if (!validateForm()) {
            return; // Stop submission if validation fails
        }

        setIsSubmitting(true); // Disable buttons to prevent duplicate submissions

        try {
            // Prepare data for API: convert empty optional strings to null for backend compatibility
            const submitData = {
                ...formData,
                jobUrl: formData.jobUrl.trim() || null,
                notes: formData.notes.trim() || null
            };

            await onSubmit(submitData); // Call parent handler to make the API request (POST or PUT)
        } catch (err) {
            console.error('Form submission error:', err);
            alert('Failed to save application. Please try again');
        } finally {
            setIsSubmitting(false); // Re-enable buttons regardless of success or failure
        }
    };

    // Resets all form fields to their default empty state and clears any validation errors
    const handleReset = () => {
        setFormData({
            companyName: '',
            positionTitle: '',
            applicationDate: '',
            status: APPLICATION_STATUS.APPLIED,
            jobUrl: '',
            notes: ''
        });
        setErrors({});
    };

    return (
        // Dark semi-transparent overlay that covers the entire screen behind the modal
        <div className='form-overlay'>
            {/* Modal container with the form content */}
            <div className='form-container'>
                {/* Modal header with dynamic title and close button */}
                <div className='form-header'>
                    <h2>
                        {application ? 'Edit Application' : 'Add New Application'}
                    </h2>
                    <button
                        className='close-button' onClick={onCancel}>x
                    </button>
                </div>
                <form onSubmit={handleSubmit} className='application-form'>
                    {/* Company Name - required text field */}
                    <div className='form-group'>
                        <label htmlFor='companyName'>
                            Company Name <span className='required'>*</span>
                        </label>
                        <input
                            type='text'
                            id='companyName'
                            name='companyName'
                            value={formData.companyName}
                            onChange={handleChange}
                            className={errors.companyName ? 'input-error': ''}
                            placeholder='example, Google, Microsoft, Amazon'
                        />
                        {/* Display validation error message if company name fails validation */}
                        {errors.companyName && (
                            <span className='error-message'>{errors.companyName}</span>
                        )}
                    </div>
                    {/* Position Title - required text field */}
                    <div className='form-group'>
                        <label htmlFor='positionTitle'>
                            Position Title <span className='required'>*</span>
                        </label>
                        <input
                            type='text'
                            id='positionTitle'
                            name='positionTitle'
                            value={formData.positionTitle}
                            onChange={handleChange}
                            className={errors.positionTitle ? 'input-error': ''}
                            placeholder='example, Software Engineer, Backend developer'
                        />
                        {errors.positionTitle && (
                            <span className='error-message'>{errors.positionTitle}</span>
                        )}
                    </div>

                    {/* Application Date and Status displayed side by side using form-row flex container */}
                    <div className='form-row'>
                        {/* Application Date - required date picker, max set to today to prevent future dates */}
                        <div className='form-group'>
                            <label htmlFor='applicationDate'>
                                Application Date <span className='required'>*</span>
                            </label>
                            <input
                            type='date'
                            id='applicationDate'
                            name='applicationDate'
                            value={formData.applicationDate}
                            onChange={handleChange}
                            className={errors.applicationDate ? 'input-error': ''}
                            max={new Date().toISOString().split('T')[0]} // Restrict date picker to today and earlier
                            />
                            {errors.applicationDate && (
                                <span className='error-message'>{errors.applicationDate}</span>
                            )}
                        </div>

                        {/* Status - required dropdown populated from APPLICATION_STATUS constants */}
                        <div className='form-group'>
                            <label htmlFor='status'>
                                Status <span className='required'>*</span>
                            </label>
                            <select
                                id='status'
                                name='status'
                                value={formData.status}
                                onChange={handleChange}
                                className={errors.status ? 'input-error': ''}
                                disabled={!application} // Only allow status change when editing
                            >
                                {/* Iterate over status enum keys and display human-readable labels */}
                                {Object.keys(APPLICATION_STATUS).map(status => (
                                    <option key={status} value={status}>
                                        {STATUS_LABELS[status]}
                                    </option>
                                ))}
                            </select>
                            {errors.status && (
                                <span className='error-message'>{errors.status}</span>
                            )}
                        </div>
                    </div>

                        {/* Job URL - optional URL field with format validation */}
                        <div className='form-group'>
                            <label htmlFor='jobURL'>
                                Job Posting URL
                            </label>
                            <input
                                type='url'
                                id='jobUrl'
                                name='jobUrl'
                                value={formData.jobUrl}
                                onChange={handleChange}
                                className={errors.jobUrl ? 'input-error' : ''}
                                placeholder='https://careers.company.com/job/12345'
                            />
                            {errors.jobUrl && (
                                <span className='error-message'>{errors.jobUrl}</span>
                            )}
                        </div>

                        {/* Notes - optional textarea with character count display */}
                        <div className='form-group'>
                            <label htmlFor='notes'>
                                Notes
                            </label>
                            <textarea
                                id='notes'
                                name='notes'
                                value={formData.notes}
                                onChange={handleChange}
                                rows='4'
                                placeholder='Add any relevant notes'
                            />
                            <span className='char-count'>
                                {formData.notes.length} characters
                            </span>
                        </div>

                        {/* Form action buttons: Cancel, Reset, and Submit */}
                        <div className='form-actions'>
                            {/* Cancel button closes the modal without saving */}
                            <button
                                type='button'
                                onClick={onCancel}
                                className='cancel-button'
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            {/* Reset button clears all fields back to empty defaults */}
                            <button
                                type='button'
                                onClick={handleReset}
                                className='reset-button'
                                disabled={isSubmitting}
                            >
                                Reset
                            </button>
                            {/* Submit button shows "Saving..." while API call is in progress */}
                            <button
                                type='submit'
                                className='submit-button'
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : (application ? 'Update Application': 'Add Application')}
                            </button>
                        </div>
                </form>
            </div>
        </div>
    );
}

export default ApplicationForm;
