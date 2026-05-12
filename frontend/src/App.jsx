import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { applicationService } from './services/applicationService';
import ApplicationList from './components/ApplicationList';
import ApplicationForm from './components/ApplicationForm';
import ApplicationDetails from './components/ApplicationDetails';
import Toast from './components/ToastNotification'
import StatsSummary from './components/StatsSummary';
import Dashboard from './pages/Dashboard';
import NetworkStatus from './components/NetworkStatus';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Reminders from './pages/Reminders';
import Settings from './pages/Settings';
import './App.css';

function App() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const [viewingApplication, setViewingApplication] = useState(null);

  const closeMobileNav = () => setMobileNavOpen(false);

  // Skip the fetch while logged out to avoid a wasted 401 round-trip.
  useEffect(() => {
    if (isAuthenticated) {
      loadApplications();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  }

  // useCallback keeps the reference stable so Toast's auto-dismiss timer
  // isn't restarted every time unrelated App state updates.
  const handleToastClose = useCallback(() => setToast(null), []);

  const loadApplications = async (status = null, showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const data = await applicationService.getApplications(status);
      setApplications(data);
      setError(null);
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

  const handleCreateApplication = async (formData) => {
    try {
      await applicationService.createApplication(formData);
      await loadApplications();
      handleCloseForm();
      showToast('Application added', 'success')
    } catch (err) {
      console.error('Error creating application:', err);
      showToast('Failed to create application', 'error')
      throw err;
    }
  };

  const handleEdit = (application) => {
    setEditingApplication(application);
    setShowForm(true);
  };

  const handleViewDetails = (application) => {
    setViewingApplication(application);
  };

  const handleUpdateApplication = async (formData) => {
    try {
      await applicationService.updateApplication(editingApplication.id, formData);
      await loadApplications();
      handleCloseForm();
      showToast('Application updated', 'success')
    } catch (err) {
      console.error('Error updating application:', err);
      showToast('Failed to update application', 'error')
      throw err;
    }
  };

  const handleDelete = async (id, companyName) => {
    if (window.confirm(`Are you sure you want to delete the application for ${companyName}?`)) {
      try {
        await applicationService.deleteApplication(id);
        await loadApplications();
        showToast('Application deleted', 'success')
      } catch (err) {
        showToast('Failed to delete application', 'error')
        console.error(err);
      }
    }
  };

  const handleCloseDetails = () => {
    setViewingApplication(null);
  };

  // showSpinner=false keeps ApplicationList mounted so its dropdown state isn't reset.
  const handleStatusFilter = async (status) => {
    loadApplications(status, false);
  };

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

  return (
    <>
      <NetworkStatus />
      <div className="app">
        <header className={`app-header ${mobileNavOpen ? 'mobile-open' : ''}`}>
          <div className='header-content'>
            <div className='header-title'>
              <h1>Job Application Tracker</h1>
              <p className='user-greeting'>Signed in as {user?.fullName}</p>
            </div>

            <button
              className='hamburger'
              onClick={() => setMobileNavOpen(v => !v)}
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileNavOpen}
            >
              <span className={`hamburger-icon ${mobileNavOpen ? 'open' : ''}`} />
            </button>

            <nav className='header-nav'>
              {/* `end` stops "/" from matching every nested route as a prefix */}
              <NavLink to='/' end onClick={closeMobileNav} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Applications
              </NavLink>
              <NavLink to='/dashboard' onClick={closeMobileNav} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Dashboard
              </NavLink>
              <NavLink to='/reminders' onClick={closeMobileNav} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Reminders
              </NavLink>
              <NavLink to='/settings' onClick={closeMobileNav} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Settings
              </NavLink>
            </nav>

            <div className='header-actions-group'>
              <button onClick={() => { logout(); closeMobileNav(); }} className='logout-button'>Logout</button>
              <button className='theme-toggle' onClick={() => setDarkMode(prev => !prev)}>
                {darkMode ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        </header>

        <main className="app-main">
          <div className="container">
            <Routes>
              <Route path="/" element={
                <ProtectedRoute>
                  {loading ? (
                    <div className="loading-container">
                      <div className="spinner"></div>
                      <p>Loading applications…</p>
                    </div>
                  ) : error ? (
                    <div className="error-container">
                      <h2>Something went wrong</h2>
                      <p>{error}</p>
                      <button onClick={() => loadApplications()}>Retry</button>
                    </div>
                  ) : (
                    <>
                      <StatsSummary />
                      <div className="header-actions">
                        <button className="primary-button" onClick={handleOpenForm}>
                          + Add application
                        </button>
                      </div>
                      <ApplicationList
                        applications={applications}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStatusFilter={handleStatusFilter}
                        onViewDetails={handleViewDetails}
                      />
                    </>
                  )}
                </ProtectedRoute>
              } />

              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />

              <Route path="/reminders" element={
                <ProtectedRoute>
                  <Reminders showToast={showToast} />
                </ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings showToast={showToast} />
                </ProtectedRoute>
              } />

              <Route path='*' element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

        {showForm && (
          <ApplicationForm
            application={editingApplication}
            onSubmit={editingApplication ? handleUpdateApplication : handleCreateApplication}
            onCancel={handleCloseForm}
          />
        )}

        {viewingApplication && (
          <ApplicationDetails
            application={viewingApplication}
            onClose={handleCloseDetails}
            onUpdate={(app) => {
              handleEdit(app);
              setViewingApplication(null);
            }}
            showToast={showToast}
          />
        )}

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