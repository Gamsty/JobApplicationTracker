export const APPLICATION_STATUS = {
    APPLIED: 'APPLIED',
    INTERVIEWING: 'INTERVIEWING',
    OFFER_RECEIVED: 'OFFER_RECEIVED',
    REJECTED: 'REJECTED',
    WITHDRAWN: 'WITHDRAWN',
    HIRED: 'HIRED'
};

export const STATUS_COLORS = {
    APPLIED: '#4a6b8a',
    INTERVIEWING: '#b8763a',
    OFFER_RECEIVED: '#2f5d44',
    REJECTED: '#a8362d',
    WITHDRAWN: '#787268',
    HIRED: '#5a4a6b'
};

export const STATUS_LABELS = {
    APPLIED: 'Applied',
    INTERVIEWING: 'Interviewing',
    OFFER_RECEIVED: 'Offer received',
    REJECTED: 'Rejected',
    WITHDRAWN: 'Withdrawn',
    HIRED: 'Hired'
};

export const INTERVIEW_STATUS = {
    SCHEDULED: 'SCHEDULED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    NO_SHOW: 'NO_SHOW'
};

export const INTERVIEW_STATUS_COLORS = {
    SCHEDULED: '#4a6b8a',
    COMPLETED: '#2f5d44',
    CANCELLED: '#a8362d',
    NO_SHOW: '#b8763a'
};

export const INTERVIEW_STATUS_LABELS = {
    SCHEDULED: 'Scheduled',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No show'
};

export const INTERVIEW_FORMAT = {
    IN_PERSON: 'IN_PERSON',
    VIDEO_CALL: 'VIDEO_CALL',
    PHONE_CALL: 'PHONE_CALL',
    ASSESSMENT: 'ASSESSMENT'
};

export const INTERVIEW_FORMAT_LABELS = {
    IN_PERSON: 'In person',
    VIDEO_CALL: 'Video call',
    PHONE_CALL: 'Phone call',
    ASSESSMENT: 'Assessment'
};

export const DOCUMENT_TYPE = {
    RESUME: 'RESUME',
    COVER_LETTER: 'COVER_LETTER',
    PORTFOLIO: 'PORTFOLIO',
    CERTIFICATE: 'CERTIFICATE',
    TRANSCRIPT: 'TRANSCRIPT',
    REFERENCE: 'REFERENCE',
    OTHER: 'OTHER'
};

export const DOCUMENT_TYPE_LABELS = {
    RESUME: 'Resume',
    COVER_LETTER: 'Cover letter',
    PORTFOLIO: 'Portfolio',
    CERTIFICATE: 'Certificate',
    TRANSCRIPT: 'Transcript',
    REFERENCE: 'Reference',
    OTHER: 'Other'
};

// Pulls the extension from a filename and uppercases it (e.g. "PDF", "DOCX").
// Falls back to "FILE" when the extension is missing.
export const getFileExtension = (filename) => {
    if (!filename) return 'FILE';
    const dot = filename.lastIndexOf('.');
    if (dot === -1 || dot === filename.length - 1) return 'FILE';
    return filename.slice(dot + 1).toUpperCase().slice(0, 4);
};

export const REMINDER_TYPE = {
    FOLLOW_UP: 'FOLLOW_UP',
    INTERVIEW_UPCOMING: 'INTERVIEW_UPCOMING',
    APPLICATION_DEADLINE: 'APPLICATION_DEADLINE',
    CUSTOM: 'CUSTOM'
};

export const REMINDER_TYPE_LABELS = {
    FOLLOW_UP: 'Follow up',
    INTERVIEW_UPCOMING: 'Interview reminder',
    APPLICATION_DEADLINE: 'Application deadline',
    CUSTOM: 'Custom reminder'
};
