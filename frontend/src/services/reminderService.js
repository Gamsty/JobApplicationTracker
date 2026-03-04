import axios from 'axios';

// VITE_API_URL points to the backend root — each service appends its own path
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/reminders';

// Dedicated axios instance for reminder endpoints — baseURL avoids repeating the path in every call
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach the JWT from localStorage to every outgoing request as a Bearer token
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

// If the server returns 401 (token expired or invalid), clear local auth state and redirect to login
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

export const reminderService = {

    // POST /api/reminders — creates a new reminder; returns the created ReminderResponse
    createReminder: async (reminderData) => {
        try {
            const response = await api.post('', reminderData);
            return response.data;
        } catch (error) {
            console.error('Error creating reminder:', error);
            throw error;
        }
    },

    // GET /api/reminders — returns all reminders for the current user, including already-sent ones
    getAllReminders: async () => {
        try {
            const response = await api.get('');
            return response.data;
        } catch (error) {
            console.error('Error fetching reminders:', error);
            throw error;
        }
    },

    // GET /api/reminders/pending — returns only unsent, enabled, future reminders
    getPendingReminders: async () => {
        try {
            const response = await api.get('/pending');
            return response.data;
        } catch (error) {
            console.error('Error fetching pending reminders:', error);
            throw error;
        }
    },

    // GET /api/reminders/:id — returns a single reminder by its ID
    getSingleReminderById: async (id) => {
        try {
            const response = await api.get(`/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching reminder ${id}:`, error);
            throw error;
        }
    },

    // PUT /api/reminders/:id — replaces all fields of an existing reminder (only allowed if not yet sent)
    updateReminder: async (id, reminderData) => {
        try {
            const response = await api.put(`/${id}`, reminderData);
            return response.data;
        } catch (error) {
            console.error(`Error updating reminder ${id}:`, error);
            throw error;
        }
    },

    // DELETE /api/reminders/:id — permanently removes a reminder
    deleteReminder: async (id) => {
        try {
            await api.delete(`/${id}`);
        } catch (error) {
            console.error(`Error deleting reminder ${id}:`, error);
            throw error;
        }
    },

    // PATCH /api/reminders/:id/toggle — flips the enabled flag without changing other fields
    toggleReminder: async (id) => {
        try {
            const response = await api.patch(`/${id}/toggle`);
            return response.data;
        } catch (error) {
            console.error(`Error toggling reminder ${id}:`, error);
            throw error;
        }
    },

    // GET /api/reminders/summary — returns total, pending, sent counts and next 5 upcoming reminders
    getReminderSummary: async () => {
        try {
            const response = await api.get('/summary');
            return response.data;
        } catch (error) {
            console.error('Error fetching reminder summary:', error);
            throw error;
        }
    },

    // POST /api/reminders/test-email — sends a test email to the current user to verify email config
    sendTestEmail: async () => {
        try {
            const response = await api.post('/test-email');
            return response.data;
        } catch (error) {
            console.error('Error sending test email:', error);
            throw error;
        }
    },
}