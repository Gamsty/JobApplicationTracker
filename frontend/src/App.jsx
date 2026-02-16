import { useEffect, useState } from 'react';
import { applicationService } from './services/frontApplicationService';
import ApplicationList from './components/ApplicationList';
import ApplicationForm from './components/ApplicationForm';
import Toast from './components/ToastNotification'
import './App.css';

// Main application component that manages state and interactions for the job application tracker
function App() {
  const [applications, setApplications] = useState([]); // State to hold the list of applications
  const [loading, setLoading] = useState(true); // State to track loading status
  const [error, setError] = useState(null); // State to track any errors during data fetching or operations
  const [showForm, setShowForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }

  useEffect(() => {
    loadApplications(); // Load applications when component mounts
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  }

  // Function to load applications with optional status filter
  const loadApplications = async (status = null) => {
    try {
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
        showToast('Application deleted successfully', 'sucess')
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

  // Render loading spinner and message while data is being fetched
  if (loading) {
    return (
      // Simple loading spinner and message to indicate that applications are being loaded
      <div className='loading-container'>
        <div className='spinner'></div>
        <p>Loading applications...</p>
      </div>
    );
  }

  // Render error message with retry button if there is an error 
  if (error) {
    return (
      // Error container that displays the error message and provides a retry button to attempt loading applications again
      <div className='error-container'>
        <h2>
          ⚠️ Error: {error} 
        </h2>
        <p>{error}</p>
        <button onClick={() => loadApplications()}>Retry</button> 
      </div>
    );
  }

  // Render the main application interface with header, add button, and application list
  return (
    <div className="app"> 
      <header className='app-header'>
        <h1>📋 Job Application Tracker</h1>
        <p>Manage and track your job applications</p>
      </header>
      
      <main className='app-main'>
        <div className='container'>
          <div className='header-actions'>
            <button className='primary-button' onClick={handleOpenForm}>
              ➕ Add Application
            </button>
            </div>
            <ApplicationList
              applications={applications}  /* Pass the list of applications to the ApplicationList component for rendering */
              onEdit={handleEdit} /* Pass the edit handler to the ApplicationList component to allow editing applications from the list */
              onDelete={handleDelete} /* Pass the delete handler to the ApplicationList component to allow deleting applications from the list */
              onStatusFilter={handleStatusFilter} /* Pass the status filter handler to the ApplicationList component to allow filtering applications by status */
            />
          </div>
        </main>

        {/* Show form when creating or editing */}
        {showForm && (
          <ApplicationForm
            application={editingApplication}
            onSubmit={editingApplication ? handleUpdateApplication: handleCreateApplication}
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
  );
}

export default App; // Export the App component as the default export of this module