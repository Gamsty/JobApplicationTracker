import { useEffect, useState } from "react";
import { applicationService } from "../services/applicationService";
import { interviewService } from "../services/interviewService";
import { documentService } from "../services/documentService";
import { reminderService } from "../services/reminderService";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
        CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { STATUS_COLORS, STATUS_LABELS, getFileExtension } from "../utils/constants";
import './Dashboard.css';

function Dashboard() {
    // Default lists to [] so .reduce/.slice never crash before the first fetch lands.
    const [applications, setApplications] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [upcomingInterviews, setUpcomingInterviews] = useState([]);
    const [documentSummary, setDocumentSummary] = useState(null);
    const [reminderSummary, setReminderSummary] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [appsData, statsData, interviewsData, docSummary, remSummary] = await Promise.all([
                applicationService.getApplications(),
                applicationService.getStatistics(),
                interviewService.getUpcomingInterviews(),
                documentService.getDocumentSummary(),
                reminderService.getReminderSummary()
            ]);
            setApplications(appsData);
            setStats(statsData);
            setUpcomingInterviews(interviewsData);
            setDocumentSummary(docSummary);
            setReminderSummary(remSummary);
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                Loading dashboard…
            </div>
        );
    }

    // Guard against partial failures — without this the renders below would NPE on
    // stats.statusCounts when the fetch fails mid-flight.
    if (error || !stats) {
        return (
            <div className="error-container">
                <h2>Failed to load dashboard</h2>
                <p>Could not fetch data from the server. Make sure the backend is running.</p>
                <button onClick={loadData}>Retry</button>
            </div>
        );
    }

    const pieData = Object.entries(stats.statusCounts).map(([status, count]) => ({
        name: STATUS_LABELS[status],
        value: count,
        color: STATUS_COLORS[status]
    }));

    const totalApps = stats.totalApplications;
    const interviews = stats.statusCounts.INTERVIEWING || 0;
    const offers = stats.statusCounts.OFFER_RECEIVED || 0;
    // Response rate counts both interview and offer states as "got a response"
    const responseRate = totalApps > 0 ? ((interviews + offers) / totalApps * 100).toFixed(1) : 0;

    const applicationsByMonth = applications.reduce((acc, app) => {
        const date = new Date(app.applicationDate);
        const monthYear = date.toLocaleDateString('en-US', {year: 'numeric', month: 'short'});
        acc[monthYear] = (acc[monthYear] || 0) + 1;
        return acc;
    }, {});

    const barData = Object.entries(applicationsByMonth)
    .map(([month, count]) => ({month, count}))
    .sort((a, b) => new Date(a.month) - new Date(b.month));

    // Average response time is not yet tracked in the data model (no response date field exists)
    // Shown as N/A until a responseDate field is added to the backend
    const avgDaysToResponse = 'N/A';

    const formatDateTime = (dateTimeString) => {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const daysUntil = (dateTimeString) => {
        const now = new Date();
        const target = new Date(dateTimeString);
        const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Tomorrow';
        return `In ${diff} days`;
    };

    return (
        <div className="dashboard">
            <h2>Dashboard</h2>

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-label">Total applications</div>
                    <div className="metric-value">{totalApps}</div>
                </div>

                <div className="metric-card">
                    <div className="metric-label">Response rate</div>
                    <div className="metric-value">{responseRate}<span className="metric-unit">%</span></div>
                </div>

                <div className="metric-card">
                    <div className="metric-label">Offers received</div>
                    <div className="metric-value">{offers}</div>
                </div>

                <div className="metric-card">
                    <div className="metric-label">Avg. time to response</div>
                    <div className="metric-value">{avgDaysToResponse}</div>
                </div>

                <div className="metric-card">
                    <div className="metric-label">Documents</div>
                    <div className="metric-value">{documentSummary?.totalDocuments || 0}</div>
                    <div className="metric-sublabel">
                        {documentSummary?.totalStorageFormatted || '0 B'} stored
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-label">Pending reminders</div>
                    <div className="metric-value">{reminderSummary?.pendingReminders || 0}</div>
                    <div className="metric-sublabel">
                        of {reminderSummary?.totalReminders || 0} total
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Applications by status</h3>
                    <ResponsiveContainer width='100%' height={350}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx='50%'
                                cy='50%'
                                labelLine={false}
                                label={false}
                                outerRadius={110}
                                fill="#8884d8"
                                dataKey='value'
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>Applications over time</h3>
                    <ResponsiveContainer width='100%' height={300}>
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray='3 3' />
                            <XAxis dataKey='month' />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey='count' fill='#2f5d44' name='Applications' />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="recent-activity">
                <h3>Recent applications</h3>
                <div className="activity-list">
                    {applications.slice(0, 5).map(app => (
                        <div key={app.id} className="activity-item">
                            <div className="activity-icon" style={{ backgroundColor: STATUS_COLORS[app.status] }}>
                                {STATUS_LABELS[app.status][0]}
                            </div>
                            <div className="activity-content">
                                <div className="activity-title">
                                    <strong>{app.companyName}</strong> &mdash; {app.positionTitle}
                                </div>
                                <div className="activity-date">
                                    {new Date(app.applicationDate).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="activity-status" style={{ color: STATUS_COLORS[app.status] }}>
                                {STATUS_LABELS[app.status]}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {documentSummary && documentSummary.recentDocuments.length > 0 && (
                <div className="recent-documents-section">
                    <h3>Recent documents</h3>
                    <div className="recent-documents-list">
                        {documentSummary.recentDocuments.map(doc => (
                            <div
                                key={doc.id}
                                className="recent-document-item"
                            >
                                <div className="doc-icon">
                                    {getFileExtension(doc.originalFileName)}
                                </div>
                                <div className="doc-info">
                                    <div className="doc-filename">
                                        {doc.originalFileName}
                                    </div>
                                    <div className="doc-meta">
                                        {doc.applicationCompany} • {doc.fileSizeFormatted}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {reminderSummary && reminderSummary.upcomingReminders.length > 0 && (
                <div className="upcoming-reminders-section">
                    <h3>Upcoming reminders</h3>
                    <div className="upcoming-reminders-list">
                        {reminderSummary.upcomingReminders.map(reminder => (
                            <div key={reminder.id} className="upcoming-reminder-card">
                                <div className="reminder-time-badge">
                                    {formatDateTime(reminder.scheduledFor)}
                                </div>
                                <div className="reminder-details">
                                    <div className="reminder-title-dash">
                                        {reminder.title}
                                    </div>
                                    {reminder.applicationCompany && (
                                        <div className="reminder-app">
                                            {reminder.applicationCompany}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {upcomingInterviews.length > 0 && (
                <div className="upcoming-interviews-section">
                    <h3>Upcoming interviews</h3>
                    <div className="upcoming-interviews-list">
                        {upcomingInterviews.map(interview => (
                            <div key={interview.id} className="upcoming-interview-card">
                                <div className="interview-badge">
                                    {daysUntil(interview.scheduledDate)}
                                </div>
                                <div className="interview-info">
                                    <div className="interview-company">
                                        {interview.applicationCompany}
                                    </div>
                                    <div className="interview-round">
                                        {interview.round}
                                    </div>
                                    <div className="interview-time">
                                        {formatDateTime(interview.scheduledDate)}
                                    </div>
                                    {interview.location && (
                                        <div className="interview-location">
                                            {interview.location}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;