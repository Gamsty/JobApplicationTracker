import axios from 'axios';

// In production, VITE_API_URL is set as an environment variable (e.g. in Vercel dashboard)
// In local development, it falls back to the local backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/applications';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL, // Base URL for all API requests
    headers: {
    'Content-Type': 'application/json', // Set default content type for requests
    },
});

// Request interceptor — runs before every outgoing API call.
// Reads the JWT from localStorage and attaches it as a Bearer token in the
// Authorization header so the backend can identify the logged-in user.
// If no token is stored (e.g. user is not logged in), the header is simply omitted.
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

// Response interceptor — runs after every incoming API response.
// If the backend returns 401 Unauthorized (token expired, invalid, or missing),
// the stored token and user data are cleared from localStorage and the user is
// redirected to the login page. All other errors are passed through unchanged.
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

// API functions
export const applicationService = {

    // Get all applications with optional filters
    getApplications: async (status = null) => { // Optional status filter (e.g., "Applied", "Interviewing", "Offered", "Rejected")
        try {
            const params = status ? { status } : {}; // If status is provided, include it as a query parameter; otherwise, use an empty object
            const response = await api.get('', { params }); // Make GET request to fetch applications with optional status filter
            return response.data;
        } catch (error) {
            console.error('Error fetching applications:', error);
            throw error;
        }
    },

    // Get application by ID
    getApplicationById: async (id) => {
        try {
            const response = await api.get(`/${id}`); // Make GET request to fetch application by ID
            return response.data;
        } catch (error) {
            console.error(`Error fetching application with ID ${id}:`, error);
            throw error;
        }
    },

    // Create new application
    createApplication: async (applicationData) => {
        try {
            const response = await api.post('', applicationData); // Make POST request to create new application
            return response.data;
        } catch (error) {
            console.error('Error creating application:', error);
            throw error;
        }
    },

    // Update existing application by ID
    updateApplication: async (id, applicationData) => {
        try {
            const response = await api.put(`/${id}`, applicationData); // Make PUT request to update application by ID
            return response.data;
        } catch (error) {
            console.error(`Error updating application with ID ${id}:`, error);
            throw error;
        }   
    },

    // Delete application by ID
    deleteApplication: async (id) => {
        try {
            await api.delete(`/${id}`); // Make DELETE request to delete application by ID
        } catch (error) {
            console.error(`Error deleting application with ID ${id}:`, error);
            throw error;
        }
    },

    // Search applications by company name (partial, case-insensitive match via backend)
    // Calls GET /api/applications/search?company={company}
    // The backend uses ContainingIgnoreCase so "goo" will match "Google"
    searchApplications: async (company) => {
        try {
            const response = await api.get('/search', { params: { company } }); // Pass company as a query parameter
            return response.data;
        } catch (error) {
            console.error('Error searching applications:', error);
            throw error;
        }
    },

    // Get application statistics
    getStatistics: async () => {
        try {
            const response = await api.get('/statistics'); // Make GET request to fetch application statistics
            return response.data;
        } catch (error) {
            console.error('Error fetching application statistics:', error);
            throw error;
        }
    },
};
