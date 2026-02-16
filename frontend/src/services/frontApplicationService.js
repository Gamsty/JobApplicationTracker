import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/applications';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL, // Base URL for all API requests
    headers: {
    'Content-Type': 'application/json', // Set default content type for requests
    },
});

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

    // Search applications by company name or position
    searchApplications: async (query) => {
        try {
            const response = await api.get(`/search?query=${query}`); // Make GET request to search applications with query parameter
            return response.data;
        } catch (error) {
            console.error(`Error searching applications with query "${query}":`, error);
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
