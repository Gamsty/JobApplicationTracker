import { useEffect, useState } from 'react';
import { applicationService } from './services/frontApplicationService';
import ApplicationList from './components/ApplicationList';
import './App.css';

// Main application component that manages state and interactions for the job application tracker
function App() {
  const [applications, setApplications] = useState([]); // State to hold the list of applications
  const [loading, setLoading] = useState(true); // State to track loading status
  const [error, setError] = useState(null); // State to track any errors during data fetching or operations

  useEffect(() => {
    loadApplications(); // Load applications when component mounts
  }, []);

  // Function to load applications with optional status filter
  const loadApplications = async (status = null) => {
    try {
      setLoading(true); // Set loading state to true before fetching data
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

  // Handler for editing an application (currently just logs the application to be edited)
  const handleEdit = (application) => {
    console.log('Edit application:', application);
  }

  // Handler for deleting an application with confirmation prompt
  const handleDelete = async (id, companyName) => { // Receive both ID and company name for confirmation message
    if (window.confirm(`Are you sure you want to delete the application for ${companyName}?`)) {
      try {
        await applicationService.deleteApplication(id); // Call delete API with application ID
        // Refresh the list after deletion
        loadApplications();
      } catch (err) {
        setError('Failed to delete application');
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
      <div className='loading-container'> /* Container for loading state with spinner and message */
        <div className='spinner'></div> /* CSS spinner for visual loading indication */
        <p>Loading applications...</p> 
      </div>
    );
  }

  // Render error message with retry button if there is an error 
  if (error) {
    return (
      <div className='error-container'> /* Container for error state with message and retry button */
        <h2>
          ⚠️ Error: {error} 
        </h2>
        <p>Please try refreshing the page or check your network connection.</p>
        <button onClick={() => loadApplications()}>Retry</button> 
      </div>
    );
  }

  // Render the main application interface with header, add button, and application list
  return (
    <div className="app-container"> 
      <header className='app-header'>
        <h1>📋 Job Application Tracker</h1>
        <p>Manage and track your job applications</p>
      </header>

      /* Header actions section with Add Application button (currently non-functional) */
      <main className='app-main'>
        <div className='container'>
          <div className='header-actions'>
            <button className='primary-button'>
              ➕ Add Application
            </button>
            </div>
            /* ApplicationList component that displays the list of applications and handles edit, delete, and status filter actions */
            <ApplicationList 
              applications={applications} 
              onEdit={handleEdit} 
              onDelete={handleDelete}
              onStatusFilter={handleStatusFilter}
            />
          </div>
        </main>
        </div>
  );
}

export default App; // Export the App component as the default export of this module