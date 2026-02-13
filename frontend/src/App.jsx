import { useEffect, useState } from 'react';
import { applicationService } from './services/frontApplicationService';

function App() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await applicationService.getApplications();
      setApplications(data);
      setError(null);
    } catch (err) {
      setError('Failed to load applications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Job Application Tracker</h1>
      <p>Total Applications: {applications.length}</p>
      <ul>
        {applications.map(app => (
          <li key={app.id}>
            {app.companyName} - {app.positionTitle} ({app.status})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;