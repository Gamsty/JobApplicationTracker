// Dashboard page component that displays analytics, charts, and recent activity
// Uses recharts library for pie chart (status distribution) and bar chart (applications over time)
import { useEffect, useState } from "react";
import { applicationService } from "../services/frontApplicationService";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
        CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { STATUS_COLORS, STATUS_LABELS } from "../utils/constants";
import './Dashboard.css';

function Dashboard() {
    const [applications, setApplications] = useState(); // Full list of applications for charts and recent activity
    const [stats, setStats] = useState(null); // Statistics object from backend (totalApplications, statusCounts)
    const [loading, setLoading] = useState(true); // Loading state while fetching data

    // Fetch both applications and statistics in parallel when component mounts
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Fetch applications and statistics simultaneously for faster page load
            const [appsData, statsData] = await Promise.all([
                applicationService.getApplications(),
                applicationService.getStatistics()
            ]);
            setApplications(appsData);
            setStats(statsData);
        } catch (err) {
            console.error('Error loading dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Show loading indicator while data is being fetched
    if (loading) {
        return (
            <div className="loading">
                Loading dashboard
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

    // Placeholder value for average response time (not yet calculated from real data)
    const avgDaysToResponse = applications.length > 0 ? 7 : 0;

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
                            {avgDaysToResponse} days
                        </div>
                        <div className="metric-label">
                            Avg. Time to Response
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
        </div>
    );
}

export default Dashboard;