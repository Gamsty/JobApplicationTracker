import axios from 'axios';

// VITE_API_URL points to the backend root — each service appends its own path
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/applications';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach the JWT from localStorage to every outgoing request as a Bearer token.
// Missing token means an anonymous request — the backend will respond with 401.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// On a 401 the JWT is expired or invalid — clear local auth state and bounce to login
// so the user doesn't get stuck in a half-authenticated state.
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

export const applicationService = {

    // GET /api/applications?status= — list applications, optionally filtered by status
    getApplications: async (status = null) => {
        try {
            const params = status ? { status } : {};
            const response = await api.get('', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching applications:', error);
            throw error;
        }
    },

    // GET /api/applications/{id}
    getApplicationById: async (id) => {
        try {
            const response = await api.get(`/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching application ${id}:`, error);
            throw error;
        }
    },

    // POST /api/applications
    createApplication: async (applicationData) => {
        try {
            const response = await api.post('', applicationData);
            return response.data;
        } catch (error) {
            console.error('Error creating application:', error);
            throw error;
        }
    },

    // PUT /api/applications/{id}
    updateApplication: async (id, applicationData) => {
        try {
            const response = await api.put(`/${id}`, applicationData);
            return response.data;
        } catch (error) {
            console.error(`Error updating application ${id}:`, error);
            throw error;
        }
    },

    // DELETE /api/applications/{id}
    deleteApplication: async (id) => {
        try {
            await api.delete(`/${id}`);
        } catch (error) {
            console.error(`Error deleting application ${id}:`, error);
            throw error;
        }
    },

    // GET /api/applications/search?company= — substring match on company name (DB ILIKE)
    searchApplications: async (company) => {
        try {
            const response = await api.get('/search', { params: { company } });
            return response.data;
        } catch (error) {
            console.error('Error searching applications:', error);
            throw error;
        }
    },

    // GET /api/applications/full-text-search?q= — Azure AI Search across company, position,
    // notes, and interview content. Each result includes a `highlights` map that maps the
    // matched field to snippets like "...used <em>Kotlin</em> and Spring...", which the UI
    // renders inline to show why a match was returned. Fails soft to [] so a search
    // service hiccup doesn't blank the whole list.
    fullTextSearch: async (query) => {
        try {
            const response = await api.get('/full-text-search', { params: { q: query } });
            return response.data;
        } catch (error) {
            console.error('Full-text search failed:', error);
            return [];
        }
    },

    // GET /api/applications/statistics — cached for 5 min, evicted on writes
    getStatistics: async () => {
        try {
            const response = await api.get('/statistics');
            return response.data;
        } catch (error) {
            console.error('Error fetching application statistics:', error);
            throw error;
        }
    },
};
