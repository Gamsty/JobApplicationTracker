import axios from "axios"

const API_BASE_URL = "http://localhost:8080/api/interviews";

// Dedicated axios instance for the interview API.
// Using a separate instance (rather than the global axios) means interview-specific
// interceptors don't interfere with other services (e.g. applicationService).
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attaches the JWT from localStorage to every outgoing request.
// If no token is stored (user not logged in) the header is simply omitted and the
// backend will respond with 401.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor — handles expired or invalid JWTs globally.
// On a 401 the stored credentials are cleared and the user is redirected to
// the login page, so they don't get stuck in a broken authenticated state.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const interviewService = {

    // GET /api/interviews/application/{applicationId}
    // Returns all interviews for one application, sorted by scheduled date ascending.
    getInterviewsByApplication: async (applicationId) => {
        try {
            const response = await api.get(`/application/${applicationId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching interviews:', error);
            throw error;
        }
    },

    // GET /api/interviews/{id}
    // Returns a single interview by its own ID.
    getInterviewById: async (id) => {
        try {
            const response = await api.get(`/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching interview ${id}:`, error);
            throw error;
        }
    },

    // POST /api/interviews
    // Creates a new interview round. interviewData must match InterviewRequest on the backend.
    // Returns the saved interview with its generated ID (201 Created).
    createInterview: async (interviewData) => {
        try {
            const response = await api.post('', interviewData);
            return response.data;
        } catch (error) {
            console.error('Error creating interview:', error);
            throw error;
        }
    },

    // PUT /api/interviews/{id}
    // Replaces all mutable fields of an existing interview.
    // Returns the updated interview (200 OK).
    updateInterview: async (id, interviewData) => {
        try {
            const response = await api.put(`/${id}`, interviewData);
            return response.data;
        } catch (error) {
            console.error(`Error updating interview ${id}:`, error);
            throw error;
        }
    },

    // DELETE /api/interviews/{id}
    // Deletes the interview. Backend returns 204 No Content so there is no response body.
    deleteInterview: async (id) => {
        try {
            await api.delete(`/${id}`);
        } catch (error) {
            console.error(`Error deleting interview ${id}:`, error);
            throw error;
        }
    },

    // GET /api/interviews/upcoming
    // Returns SCHEDULED interviews with a future date, sorted soonest-first.
    getUpcomingInterviews: async () => {
        try {
            const response = await api.get('/upcoming');
            return response.data;
        } catch (error) {
            console.error('Error fetching upcoming interviews:', error);
            throw error;
        }
    },

    // GET /api/interviews/past
    // Returns all interviews with a past date (any status), sorted most-recent-first.
    getPastInterviews: async () => {
        try {
            const response = await api.get('/past');
            return response.data;
        } catch (error) {
            console.error('Error fetching past interviews:', error);
            throw error;
        }
    },

    // GET /api/interviews/summary
    // Returns aggregated stats (counts per status) plus the next 5 upcoming
    // and 5 most recent past interviews. Used by the dashboard summary card.
    getInterviewSummary: async () => {
        try {
            const response = await api.get('/summary');
            return response.data;
        } catch (error) {
            console.error('Error fetching interview summary:', error);
            throw error;
        }
    },
}
