// Root component of the Job Application Tracker
// Handles routing (Applications page + Dashboard page), global state, dark mode, and CRUD operations
import { BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom'
import { useEffect, useState } from 'react';
import { applicationService } from './services/frontApplicationService';
import ApplicationList from './components/ApplicationList';
import ApplicationForm from './components/ApplicationForm';
import Toast from './components/ToastNotification'
import StatsSummary from './components/StatsSummary';
import Dashboard from './pages/Dashboard';
import './App.css';

// Main application component that manages state and interactions for the job application tracker
function App() {
  // --- State Management ---
  const [applications, setApplications] = useState([]); // Array of application objects fetched from the backend
  const [loading, setLoading] = useState(true); // True while API calls are in progress
  const [error, setError] = useState(null); // Error message string if API call fails, null otherwise
  const [showForm, setShowForm] = useState(false); // Controls visibility of the ApplicationForm modal
  const [editingApplication, setEditingApplication] = useState(null); // Holds the application being edited, null when creating new
  const [toast, setToast] = useState(null); // Toast notification state: { message, type } or null when hidden
  // Initialize dark mode from localStorage, defaulting to light mode if no preference is saved
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // --- Side Effects ---

  // Load applications from backend on initial mount
  useEffect(() => {
    loadApplications();
  }, []);

  // Sync dark mode preference to the DOM and localStorage whenever it changes
  // Sets data-theme attribute on <html> which CSS variables use to switch themes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // --- Helper Functions ---

  // Display a toast notification with a message and type ('success', 'error', 'info')
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  }

  // Fetch applications from the backend API, optionally filtered by status
  // Called on mount, after create/update/delete, and when status filter changes
  const loadApplications = async (status = null) => {
    try {
      setLoading(true);
      const data = await applicationService.getApplications(status);
      setApplications(data);
      setError(null); // Clear any previous errors on successful load
    } catch (err) {
      setError('Failed to load applications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Form Handlers ---

  // Open the form modal in "create" mode (no existing application to edit)
  const handleOpenForm = () => {
    setEditingApplication(null);
    setShowForm(true);
  };

  // Close the form modal and reset editing state
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingApplication(null);
  }

  // Submit handler for creating a new application via POST request
  // On success: reloads list, closes form, shows success toast
  // On failure: shows error toast and re-throws so the form can handle it
  const handleCreateApplication = async (FormData) => {
    try {
      await applicationService.createApplication(FormData);
      await loadApplications(); // Reload list to include the new application
      handleCloseForm();
      showToast('Application added successfully!', 'success')
    } catch (err) {
      console.error('Error creating application:', err);
      showToast('Failed to create application', 'error')
      throw err; // Re-throw so ApplicationForm can reset its submitting state
    }
  };

  // Open the form modal in "edit" mode, pre-populated with the selected application's data
  const handleEdit = (application) => {
    setEditingApplication(application);
    setShowForm(true);
  };

  // Submit handler for updating an existing application via PUT request
  // Uses editingApplication.id to identify which application to update
  const handleUpdateApplication = async (formData) => {
    try {
      await applicationService.updateApplication(editingApplication.id, formData);
      await loadApplications(); // Reload list to reflect the changes
      handleCloseForm();
      showToast('Application updated successfully', 'success')
    } catch (err) {
      console.error('Error updating application:', err);
      showToast('Failed to update application', 'error')
      throw err;
    }
  };

  // Delete handler with confirmation dialog before making the DELETE request
  // Receives both ID and company name so the confirm dialog shows which application will be deleted
  const handleDelete = async (id, companyName) => {
    if (window.confirm(`Are you sure you want to delete the application for ${companyName}?`)) {
      try {
        await applicationService.deleteApplication(id);
        await loadApplications(); // Refresh the list after deletion
        showToast('Application deleted successfully', 'success')
      } catch (err) {
        showToast('Failed to delete application', 'error')
        console.error(err);
      }
    }
  };

  // Re-fetch applications filtered by the selected status (null = show all)
  const handleStatusFilter = async (status) => {
    loadApplications(status);
  };

  // --- Render ---
  // Router wraps the entire app to enable client-side navigation
  // The header with nav links and theme toggle is always visible on both routes
  return (
    <Router>
      <div className="app">
        {/* App header with title, navigation links, and dark mode toggle */}
        <header className="app-header">
          <h1>📋 Job Application Tracker</h1>
          {/* Navigation between the Applications list and Dashboard analytics page */}
          <nav className="nav-links">
            <Link to="/">Applications</Link>
            <Link to="/dashboard">Dashboard</Link>
          </nav>
          {/* Toggle button to switch between light and dark mode */}
          <button className='theme-toggle' onClick={() => setDarkMode(prev => !prev)}>
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </header>

        <main className="app-main">
          <div className="container">
            <Routes>
              {/* Home route — displays stats summary, add button, and application list */}
              <Route path="/" element={
                <>
                  {/* Conditional rendering: loading spinner → error message → main content */}
                  {loading ? (
                    <div className="loading-container">
                      <div className="spinner"></div>
                      <p>Loading applications...</p>
                    </div>
                  ) : error ? (
                    <div className="error-container">
                      <h2>⚠️ Error</h2>
                      <p>{error}</p>
                      <button onClick={() => loadApplications()}>Retry</button>
                    </div>
                  ) : (
                    <>
                      <StatsSummary />
                      <div className="header-actions">
                        <button className="primary-button" onClick={handleOpenForm}>
                          + Add New Application
                        </button>
                      </div>
                      {/* Application list with edit, delete, and filter callbacks */}
                      <ApplicationList
                        applications={applications}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStatusFilter={handleStatusFilter}
                      />
                    </>
                  )}
                </>
              } />

              {/* Dashboard route — analytics page with charts and metrics */}
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </div>
        </main>

        {/* ApplicationForm modal — rendered outside of Routes so it overlays any page */}
        {/* Passes the correct submit handler based on whether we're creating or editing */}
        {showForm && (
          <ApplicationForm
            application={editingApplication}
            onSubmit={editingApplication ? handleUpdateApplication : handleCreateApplication}
            onCancel={handleCloseForm}
          />
        )}

        {/* Toast notification — auto-dismissed via onClose clearing the toast state */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
