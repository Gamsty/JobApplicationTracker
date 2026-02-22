// Root component of the Job Application Tracker
// Handles routing (Applications page + Dashboard page), global state, dark mode, and CRUD operations
import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { applicationService } from './services/frontApplicationService';
import ApplicationList from './components/ApplicationList';
import ApplicationForm from './components/ApplicationForm';
import Toast from './components/ToastNotification'
import StatsSummary from './components/StatsSummary';
import Dashboard from './pages/Dashboard';
import NetworkStatus from './components/NetworkStatus';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
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
  const { isAuthenticated, user, logout } = useAuth();

  // --- Side Effects ---

  // Load applications when the user is authenticated.
  // Re-runs when isAuthenticated changes (e.g. after login) so the list
  // is always populated immediately after the user signs in.
  // Guard prevents a wasted 401 API call while the user is logged out.
  useEffect(() => {
    if (isAuthenticated) {
      loadApplications();
    }
  }, [isAuthenticated]);

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

  // Stable reference for closing the toast — wrapped in useCallback so the function reference
  // doesn't change on every App re-render, which would cause Toast's useEffect to restart
  // the 3-second auto-dismiss timer each time unrelated state (e.g. applications) updates
  const handleToastClose = useCallback(() => setToast(null), []);

  // Fetch applications from the backend API, optionally filtered by status
  // Called on mount, after create/update/delete, and when status filter changes
  const loadApplications = async (status = null, showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
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
  const handleCreateApplication = async (formData) => {
    try {
      await applicationService.createApplication(formData);
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
  // Uses showSpinner=false to avoid unmounting ApplicationList and losing dropdown state
  const handleStatusFilter = async (status) => {
    loadApplications(status, false);
  };

  // Public routes (login/register)
  if (!isAuthenticated) {
    return (
      <>
        <NetworkStatus />
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='*' element={<Navigate to='/login' replace />} />
        </Routes>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  // --- Render ---
  // Router wraps the entire app to enable client-side navigation
  // The header with nav links and theme toggle is always visible on both routes
  return (
    <>
      <NetworkStatus />
      <div className="app">
        {/* App header with title, navigation links, and dark mode toggle */}
        <header className="app-header">
          <div className='header-content'>
            <div>
              <h1>📋 Job Application Tracker</h1>
              <p className='user-greeting'>Welcome back, {user?.fullName}!</p>
            </div>

            {/* Navigation links — NavLink automatically adds an "active" class
                when its href matches the current URL, enabling active-link styling */}
            <nav className='header-nav'>
              <NavLink to='/' end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Applications
              </NavLink>
              <NavLink to='/dashboard' className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Dashboard
              </NavLink>
            </nav>

            <button onClick={logout} className='logout-button'>Logout</button>
            {/* Toggle button to switch between light and dark mode */}
            <button className='theme-toggle' onClick={() => setDarkMode(prev => !prev)}>
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </header>

        <main className="app-main">
          <div className="container">
            <Routes>
              {/* Home route — displays stats summary, add button, and application list */}
              <Route path="/" element={
                <ProtectedRoute>
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
                </ProtectedRoute>
              } />

              {/* Dashboard route — analytics page with charts and metrics */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />

              <Route path='*' element={<Navigate to="/" replace />} />
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
            onClose={handleToastClose}
          />
        )}
      </div>
    </>
  );
}

export default App;