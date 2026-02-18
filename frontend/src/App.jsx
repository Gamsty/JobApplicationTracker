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
  const [applications, setApplications] = useState([]); // State to hold the list of applications
  const [loading, setLoading] = useState(true); // State to track loading status
  const [error, setError] = useState(null); // State to track any errors during data fetching or operations
  const [showForm, setShowForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }
  // Initialize dark mode from localStorage, defaulting to light mode
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    loadApplications(); // Load applications when component mounts
  }, []);

  // Apply the data-theme attribute to <html> whenever darkMode changes, and persist in localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  }

  // Function to load applications with optional status filter
  const loadApplications = async (status = null) => {
    try {
      setLoading(true);
      const data = await applicationService.getApplications(status); // Fetch applications with optional status filter
      setApplications(data); // Update state with fetched applications
      setError(null); // Clear any previous errors on successful load
    } catch (err) {
      setError('Failed to load applications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = () => {
    setEditingApplication(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingApplication(null);
  }

  const handleCreateApplication = async (FormData) => {
    try {
      await applicationService.createApplication(FormData);
      await loadApplications(); // Reload list
      handleCloseForm();
      showToast('Application added successfully!', 'success')
    } catch (err) {
      console.error('Error creating application:', err);
      showToast('Failed to create application', 'error')
      throw err; // Let form handle the error
    }
  };

  // Handler for editing an application (currently just logs the application to be edited)
  const handleEdit = (application) => {
    setEditingApplication(application);
    setShowForm(true);
  };

  const handleUpdateApplication = async (formData) => {
    try {
      await applicationService.updateApplication(editingApplication.id, formData);
      await loadApplications(); // Reload list
      handleCloseForm();
      showToast('Application updated successfully', 'success')
    } catch (err) {
      console.error('Error updating application:', err);
      showToast('Failed to update application', 'error')
      throw err;
    }
  };

  // Handler for deleting an application with confirmation prompt
  const handleDelete = async (id, companyName) => { // Receive both ID and company name for confirmation message
    if (window.confirm(`Are you sure you want to delete the application for ${companyName}?`)) {
      try {
        await applicationService.deleteApplication(id); // Call delete API with application ID
        // Refresh the list after deletion
        await loadApplications();
        showToast('Application deleted successfully', 'success')
      } catch (err) {
        showToast('Failed to delete application', 'error')
        console.error(err);
      }
    }
  };

  // Handler for status filter change, calls loadApplications with the selected status
  const handleStatusFilter = async (status) => {
    loadApplications(status); // Load applications with the selected status filter
  };

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>📋 Job Application Tracker</h1>
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
              <Route path="/" element={
                <>
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

              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </div>
        </main>

        {/* Show form when creating or editing */}
        {showForm && (
          <ApplicationForm
            application={editingApplication}
            onSubmit={editingApplication ? handleUpdateApplication : handleCreateApplication}
            onCancel={handleCloseForm}
          />
        )}

        {/* Render toast notification when a toast message exists, auto-dismissed via onClose clearing the toast state */}
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

export default App; // Export the App component as the default export of this module