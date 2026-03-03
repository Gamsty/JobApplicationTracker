// Raw status values sent to / received from the backend (must match ApplicationStatus enum)
export const APPLICATION_STATUS = {
    APPLIED: 'APPLIED',
    INTERVIEWING: 'INTERVIEWING',
    OFFER_RECEIVED: 'OFFER_RECEIVED',
    REJECTED: 'REJECTED',
    WITHDRAWN: 'WITHDRAWN',
    HIRED: 'HIRED'
};

// CSS colour names used to style application status badges
export const STATUS_COLORS = {
    APPLIED: 'blue',
    INTERVIEWING: 'orange',
    OFFER_RECEIVED: 'green',
    REJECTED: 'red',
    WITHDRAWN: 'gray',
    HIRED: 'purple'
};

// Human-readable labels displayed in the UI for each application status
export const STATUS_LABELS = {
    APPLIED: 'Applied',
    INTERVIEWING: 'Interviewing',
    OFFER_RECEIVED: 'Offer Received',
    REJECTED: 'Rejected',
    WITHDRAWN: 'Withdrawn',
    HIRED: 'Hired'
};

// Raw status values sent to / received from the backend (must match InterviewStatus enum)
export const INTERVIEW_STATUS = {
    SCHEDULED: 'SCHEDULED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    NO_SHOW: 'NO_SHOW'
};

// CSS colour names used to style interview status badges
export const INTERVIEW_STATUS_COLORS = {
    SCHEDULED: 'blue', 
    COMPLETED: 'green',   
    CANCELLED: 'red',  
    NO_SHOW: 'orange'    
};

// Human-readable labels displayed in the UI for each interview status
export const INTERVIEW_STATUS_LABELS = {
    SCHEDULED: 'Scheduled',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No Show'
};

// Raw format values sent to / received from the backend (must match InterviewFormat enum)
export const INTERVIEW_FORMAT = {
    IN_PERSON: 'IN_PERSON',
    VIDEO_CALL: 'VIDEO_CALL',
    PHONE_CALL: 'PHONE_CALL',
    ASSESSMENT: 'ASSESSMENT'
};

// Human-readable labels displayed in the UI for each interview format
export const INTERVIEW_FORMAT_LABELS = {
    IN_PERSON: 'In Person',
    VIDEO_CALL: 'Video Call',
    PHONE_CALL: 'Phone Call',
    ASSESSMENT: 'Assessment'
};

// Raw type values sent to / received from the backend (must match DocumentType enum)
export const DOCUMENT_TYPE = {
    RESUME: 'RESUME',
    COVER_LETTER: 'COVER_LETTER',
    PORTFOLIO: 'PORTFOLIO',
    CERTIFICATE: 'CERTIFICATE',
    TRANSCRIPT: 'TRANSCRIPT',
    REFERENCE: 'REFERENCE',
    OTHER: 'OTHER'
};

// Human-readable labels displayed in the UI for each document type
export const DOCUMENT_TYPE_LABELS = {
    RESUME: 'Resume',
    COVER_LETTER: 'Cover Letter',
    PORTFOLIO: 'Portfolio',
    CERTIFICATE: 'Certificate',
    TRANSCRIPT: 'Transcript',
    REFERENCE: 'Reference',
    OTHER: 'Other'
};

// Maps a file's MIME type to a representative emoji icon.
// Used in DocumentList and Dashboard wherever a file-format icon is shown.
export const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word') || fileType.includes('document')) return '📘';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('text')) return '📄';
    return '📎';
};

export const REMINDER_TYPE = {
    FOLLOW_UP: 'FOLLOW_UP',
    INTERVIEW_UPCOMING: 'INTERVIEW_UPCOMING',
    APPLICATION_DEADLINE: 'APPLICATION_DEADLINE',
    CUSTOM: 'CUSTOM'
};

export const REMINDER_TYPE_LABELS = {
    FOLLOW_UP: 'Follow Up',
    INTERVIEW_UPCOMING: 'Interview Reminder',
    APPLICATION_DEADLINE: 'Application Deadline',
    CUSTOM: 'Custom Reminder'
};

export const REMINDER_TYPE_ICONS = {
  FOLLOW_UP: '📞',
  INTERVIEW_UPCOMING: '📅',
  APPLICATION_DEADLINE: '⏰',
  CUSTOM: '🔔'
};
