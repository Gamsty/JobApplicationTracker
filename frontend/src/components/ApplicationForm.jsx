import { useState, useEffect } from 'react';
import { APPLICATION_STATUS, STATUS_LABELS } from '../utils/constants';
import './ApplicationForm.css';

function ApplicationForm({ application, onSubmit, onCancel}) {
    const [formData, setFormData] = useState({
        companyName: '',
        positionTitle: '',
        applicationDate: '',
        status: 'APPLIED',
        jobUrl: '',
        notes: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Populate from the existing record when editing. `|| ''` handles fields that
    // come back as null from the backend (jobUrl, notes are nullable).
    useEffect(() => {
        if (application) {
            setFormData({
                companyName: application.companyName,
                positionTitle: application.positionTitle,
                applicationDate: application.applicationDate,
                status: application.status,
                jobUrl: application.jobUrl || '',
                notes: application.notes || ''
            });
        }
    }, [application]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Mirrors the @field constraints in backend ApplicationRequest.kt — keep them in sync.
    const validateForm = () => {
        const newErrors = {};

        if (!formData.companyName.trim()) {
            newErrors.companyName = 'Company name required';
        } else if (formData.companyName.length > 255) {
            newErrors.companyName = 'Company name must be less than 255 characters';
        }

        if (!formData.positionTitle.trim()) {
            newErrors.positionTitle = 'Position title is required';
        } else if (formData.positionTitle.length > 255) {
            newErrors.positionTitle = 'Position title must be less than 255 characters';
        }

        if (!formData.applicationDate) {
            newErrors.applicationDate = 'Application date is required';
        } else  {
            // YYYY-MM-DD string comparison is correct because the format sorts lexically.
            const today = new Date().toISOString().split('T')[0];
            if (formData.applicationDate > today) {
                newErrors.applicationDate = 'Application date cannot be in the future';
            }
        }

        if (!formData.status) {
            newErrors.status = 'Status is required';
        }

        if (formData.jobUrl && formData.jobUrl.length > 500) {
            newErrors.jobUrl = 'Job URL must be less than 500 characters';
        }

        if (formData.jobUrl && formData.jobUrl.trim()) {
            try {
                new URL(formData.jobUrl);
            } catch {
                newErrors.jobUrl = 'Please enter a valid URL';
            }
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
            // Backend expects null (not "") for nullable string fields.
            const submitData = {
                ...formData,
                jobUrl: formData.jobUrl.trim() || null,
                notes: formData.notes.trim() || null
            };

            await onSubmit(submitData);
        } catch (err) {
            console.error('Form submission error:', err);
            alert('Failed to save application. Please try again');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Resets to blank defaults — does NOT restore the original record when editing.
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
                        {application ? 'Edit application' : 'Add new application'}
                    </h2>
                    <button
                        className='close-button'
                        onClick={onCancel}
                        aria-label="Close"
                    >&times;</button>
                </div>
                {/* Form element — onSubmit triggers validation then API call */}
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
                            placeholder='e.g. Google'
                        />
                        {/* Display validation error message if company name fails validation */}
                        {errors.companyName && (
                            <span className='error-message'>{errors.companyName}</span>
                        )}
                    </div>
                    {/* Position Title - required text field */}
                    <div className='form-group'>
                        <label htmlFor='positionTitle'>
                            Position <span className='required'>*</span>
                        </label>
                        <input
                            type='text'
                            id='positionTitle'
                            name='positionTitle'
                            value={formData.positionTitle}
                            onChange={handleChange}
                            className={errors.positionTitle ? 'input-error': ''}
                            placeholder='e.g. Backend Engineer'
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
                                Applied on <span className='required'>*</span>
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
                            <label htmlFor='jobUrl'>
                                Job posting URL
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

                        {/* Form action buttons — all disabled while submitting to prevent duplicate requests */}
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
                            {/* Submit button — label changes based on mode (create vs edit) and loading state */}
                            <button
                                type='submit'
                                className='submit-button'
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving…' : (application ? 'Save changes' : 'Add application')}
                            </button>
                        </div>
                </form>
            </div>
        </div>
    );
}

export default ApplicationForm;