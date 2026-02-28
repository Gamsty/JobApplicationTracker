import axios from "axios";

const API_BASE_URL = 'http://localhost:8080/api/documents';

// Dedicated axios instance scoped to the documents API base URL.
// Keeps document requests isolated from other services.
const api = axios.create({
    baseURL: API_BASE_URL,
});

// Request interceptor — attaches the JWT from localStorage to every outgoing request.
// If no token is present the request is sent without an Authorization header,
// and the server will respond with 401/403 as appropriate.
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

// Response interceptor — handles expired or invalid tokens globally.
// On a 401 the stored credentials are cleared and the user is redirected to login.
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

export const documentService = {

    // Uploads a file as multipart/form-data.
    // The browser sets the correct Content-Type boundary automatically when FormData is used.
    // POST /api/documents
    uploadDocument: async (file, applicationId, documentType, description = null) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('applicationId', applicationId);
            formData.append('documentType', documentType);
            if (description) {
                formData.append('description', description);
            }

            const response = await api.post('', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading document:', error);
            throw error;
        }
    },

    // Returns all documents linked to a specific job application.
    // GET /api/documents/application/{applicationId}
    getDocumentByApplication: async (applicationId) => {
        try {
            const response = await api.get(`/application/${applicationId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching document:', error);
            throw error;
        }
    },

    // Returns a single document's metadata by its ID.
    // GET /api/documents/{id}
    getDocumentById: async (id) => {
        try {
            const response = await api.get(`/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching document ${id}`, error);
            throw error;
        }
    },

    // Downloads a document as a binary blob and triggers a browser file-save dialog.
    // A temporary <a> element is used to initiate the download without navigating away.
    // GET /api/documents/{id}/download
    downloadDocument: async (id, fileName) => {
        try {
            const response = await api.get(`/${id}/download`, {
                responseType: 'blob',
            });

            // Build a temporary object URL from the blob and click a hidden link to save the file
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            // Release the object URL to free browser memory
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(`Error downloading document ${id}:`, error);
            throw error;
        }
    },

    // Permanently deletes a document by ID (also removes the file from storage).
    // DELETE /api/documents/{id}
    deleteDocument: async (id) => {
        try {
            await api.delete(`/${id}`);
        } catch (error) {
            console.error(`Error deleting document ${id}`, error);
            throw error;
        }
    },

    // Returns all documents uploaded by the currently authenticated user across all applications.
    // GET /api/documents/my-documents
    getAllUserDocuments: async () => {
        try {
            const response = await api.get('/my-documents');
            return response.data;
        } catch (error) {
            console.error('Error fetching user documents:', error);
            throw error;
        }
    },

    // Returns a storage summary (total files, total size, breakdown by type) for the current user.
    // GET /api/documents/summary
    getDocumentSummary: async () => {
        try {
            const response = await api.get('/summary');
            return response.data;
        } catch (error) {
            console.error('Error fetching document summary', error);
            throw error;
        }
    }
};
