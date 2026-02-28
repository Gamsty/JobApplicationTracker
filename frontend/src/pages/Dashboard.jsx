// Dashboard page component that displays analytics, charts, and recent activity
// Uses recharts library for pie chart (status distribution) and bar chart (applications over time)
import { useEffect, useState } from "react";
import { applicationService } from "../services/frontApplicationService";
import { interviewService } from "../services/interviewService";
import { documentService } from "../services/documentService";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
        CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { STATUS_COLORS, STATUS_LABELS, getFileIcon } from "../utils/constants";
import './Dashboard.css';

function Dashboard() {
    const [applications, setApplications] = useState([]); // Full list of applications for charts and recent activity — default to [] so .reduce/.slice never crash
    const [stats, setStats] = useState(null); // Statistics object from backend (totalApplications, statusCounts)
    const [loading, setLoading] = useState(true); // Loading state while fetching data
    const [error, setError] = useState(false); // True if either API call failed on mount
    const [upcomingInterviews, setUpcomingInterviews] = useState([]);
    const [documentSummary, setDocumentSummary] = useState(null);

    // Fetch both applications and statistics in parallel when component mounts
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Fetch applications and statistics simultaneously for faster page load
            const [appsData, statsData, interviewsData, docSummary] = await Promise.all([
                applicationService.getApplications(),
                applicationService.getStatistics(),
                interviewService.getUpcomingInterviews(),
                documentService.getDocumentSummary()
            ]);
            setApplications(appsData);
            setStats(statsData);
            setUpcomingInterviews(interviewsData);
            setDocumentSummary(docSummary);
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            setError(true); // Signal that the data fetch failed so the error UI is shown
        } finally {
            setLoading(false);
        }
    };

    // Show loading indicator while data is being fetched
    if (loading) {
        return (
            <div className="loading">
                Loading dashboard...
            </div>
        );
    }

    // Show error state if either API call failed — avoids crashing on stats.statusCounts or applications.reduce
    if (error || !stats) {
        return (
            <div className="error-container">
                <h2>⚠️ Failed to load dashboard</h2>
                <p>Could not fetch data from the server. Make sure the backend is running.</p>
                <button onClick={loadData}>Retry</button>
            </div>
        );
    }

    // Transform statusCounts into array format required by recharts PieChart
    // Each entry gets a human-readable name, count value, and color from constants
    const pieData = Object.entries(stats.statusCounts).map(([status, count]) => ({
        name: STATUS_LABELS[status],
        value: count,
        color: STATUS_COLORS[status]
    }));

    // Calculate key metrics from statistics data
    const totalApps = stats.totalApplications;
    const interviews = stats.statusCounts.INTERVIEWING || 0;
    const offers = stats.statusCounts.OFFER_RECEIVED || 0;
    // Response rate = percentage of applications that received an interview or offer
    const responseRate = totalApps > 0 ? ((interviews + offers) / totalApps * 100).toFixed(1) : 0;

    // Group applications by month for the bar chart
    // Uses reduce to count applications per month-year string (e.g., "Feb 2026")
    const applicationsByMonth = applications.reduce((acc, app) => {
        const date = new Date(app.applicationDate);
        const monthYear = date.toLocaleDateString('en-US', {year: 'numeric', month: 'short'});
        acc[monthYear] = (acc[monthYear] || 0) + 1;
        return acc;
    }, {});

    // Convert grouped data to array and sort chronologically for the bar chart
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
            <h2>
                Dashboard & Analytics
            </h2>

            {/* Key Metrics - 4 cards showing total apps, response rate, offers, and avg response time */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon">📊</div>
                    <div className="metric-content">
                        <div className="metric-value">
                            {totalApps}
                        </div>
                        <div className="metric-label">
                            Total Applications
                        </div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">📈</div>
                    <div className="metric-content">
                        <div className="metric-value">
                            {responseRate}%
                        </div>
                        <div className="metric-label">
                            Response Rate
                        </div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">🎯</div>
                    <div className="metric-content">
                        <div className="metric-value">
                            {offers}
                        </div>
                        <div className="metric-label">
                            Offers Received
                        </div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">⏱️</div>
                    <div className="metric-content">
                        <div className="metric-value">
                            {avgDaysToResponse}
                        </div>
                        <div className="metric-label">
                            Avg. Time to Response
                        </div>
                    </div>
                </div>

                {/* Documents metric card — shows total file count and total storage used */}
                <div className="metric-card">
                    <div className="metric-icon">📎</div>
                    <div className="metric-content">
                        {/* Total number of documents uploaded across all applications */}
                        <div className="metric-value">
                            {documentSummary?.totalDocuments || 0}
                        </div>
                        <div className="metric-label">
                            Documents
                        </div>
                        {/* Human-readable total storage (e.g. "1.2 MB used") — falls back to "0 B" */}
                        <div className="metric-sublabel">
                            {documentSummary?.totalStorageFormatted || '0 B'} used
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section - Pie chart for status breakdown, bar chart for timeline */}
            <div className="charts-grid">
                {/* Status Distribution Pie Chart - each slice colored by status */}
                <div className="chart-card">
                    <h3>Applications by Status</h3>
                    <ResponsiveContainer width='100%' height={350}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx='50%'
                                cy='50%'
                                labelLine={true}
                                label={({name, percent}) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey='value'
                            >
                                {/* Apply a unique color to each pie slice based on status */}
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Applications Over Time Bar Chart - grouped by month */}
                <div className="chart-card">
                    <h3>Applications Over Time</h3>
                    <ResponsiveContainer width='100%' height={300}>
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray='3 3' />
                            <XAxis dataKey='month' />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey='count' fill='#667eea' name='Applications' />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Activity - shows the 5 most recent applications with status icons */}
            <div className="recent-activity">
                <h3>Recent Applications</h3>
                <div className="activity-list">
                    {applications.slice(0, 5).map(app => (
                        <div key={app.id} className="activity-item">
                            {/* Colored circle with first letter of the status label */}
                            <div className="activity-icon" style={{ backgroundColor: STATUS_COLORS[app.status] }}>
                                {STATUS_LABELS[app.status][0]}
                            </div>
                            <div className="activity-content">
                                <div className="activity-title">
                                    <strong>{app.companyName}</strong> - {app.positionTitle}
                                </div>
                                <div className="activity-date">
                                    {new Date(app.applicationDate).toLocaleDateString()}
                                </div>
                            </div>
                            {/* Status text colored to match the status icon */}
                            <div className="activity-status" style={{ color: STATUS_COLORS[app.status] }}>
                                {STATUS_LABELS[app.status]}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Documents — only rendered when the summary exists and has at least one document */}
            {documentSummary && documentSummary.recentDocuments.length > 0 && (
                <div className="recent-documents-section">
                    <h3>
                        Recent Documents 📎
                    </h3>
                    <div className="recent-documents-list">
                        {documentSummary.recentDocuments.map(doc => (
                            <div
                                key={doc.id}
                                className="recent-document-item"
                            >
                                {/* Emoji icon chosen based on the file's MIME type */}
                                <div className="doc-icon">
                                    {getFileIcon(doc.fileType)}
                                </div>
                                <div className="doc-info">
                                    {/* Original file name as uploaded by the user */}
                                    <div className="doc-filename">
                                        {doc.originalFileName}
                                    </div>
                                    {/* Company the document belongs to and its formatted size */}
                                    <div className="doc-meta">
                                        {doc.applicationCompany} • {doc.fileSizeFormatted}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming Interviews — only rendered when at least one scheduled interview exists */}
            {upcomingInterviews.length > 0 && (
                <div className="upcoming-interviews-section">
                    <h3>Upcoming Interviews 📅</h3>
                    <div className="upcoming-interviews-list">
                        {/* Parentheses give an implicit return so each card is actually rendered */}
                        {upcomingInterviews.map(interview => (
                            <div key={interview.id} className="upcoming-interview-card">
                                {/* "Today" / "Tomorrow" / "In N days" badge */}
                                <div className="interview-badge">
                                    {daysUntil(interview.scheduledDate)}
                                </div>
                                <div className="interview-info">
                                    {/* Company name comes from the parent application */}
                                    <div className="interview-company">
                                        {interview.applicationCompany}
                                    </div>
                                    {/* Round label e.g. "Phone Screen", "Technical" */}
                                    <div className="interview-round">
                                        {interview.round}
                                    </div>
                                    {/* Formatted local date and time */}
                                    <div className="interview-time">
                                        {formatDateTime(interview.scheduledDate)}
                                    </div>
                                    {/* Location is optional — only shown if present */}
                                    {interview.location && (
                                        <div className="interview-location">
                                            📍 {interview.location}
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