import { useEffect, useState } from "react";
import { applicationService } from "../services/frontApplicationService";
import { Piechart, Pie, Cell, Barchart, Bar, XAxis, YAxis, 
        CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
        PieChart} from 'recharts';
import { STATUS_COLORS, STATUS_LABELS } from "../utils/constants";
import './Dashboard.css';

function Dashboard() {
    const [applications, setApplications] = useState();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
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

    if (loading) {
        return 
            <div className="loading">
                Loading dashboard
            </div>
    }

    // Prepare data for pie chart
    const pieData = Object.entries(stats.byStatus).map(([status, count]) => ({
        name: STATUS_LABELS[status],
        value: count,
        color: STATUS_COLORS[status]
    }));

    // Calculate response rate (interview + (offers / total))
    const totalApps = stats.total;
    const interviews = stats.byStatus.INTERVIEWING || 0;
    const offers = stats.byStatus.OFFER_RECEIVED || 0;
    const responseRate = totalApps > 0 ? ((interviews + offers) / totalApps * 100).toFixed(1) : 0;

    // Calculate applications by month
    const applicationsByMonth = applications.reduce((acc, app) => {
        const date = new Date(app.applicationDate);
        const monthYear = date.toLocaleDateString('en-US', {year: 'numeric', month: 'short'});
        acc[monthYear] = (acc[monthYear] || 0) + 1;
        return acc;
    }, {});

    const barData = Object.entries(applicationsByMonth)
    .map(([month, count]) => ({month, count}))
    .sort((a, b) => new Date(a.month) - new Date(b.month));

    // Calculate average time to response (mock data for now)
    const avgDaysToResponse = applications.length > 0 ? 7 : 0;

    return (
        <div className="dashboard">
            <h2>
                Dashboard & Analytics
            </h2>

            {/* Key Metrics */}
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
                        <div className="metric-valuie">
                            {responseRate}
                        </div>
                        <div className="metric-label">
                            Response Rate
                        </div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">🎯</div>
                    <div className="metric-content">
                        <div className="metric-valuie">
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
                        <div className="metric-valuie">
                            {avgDaysToResponse} days
                        </div>
                        <div className="metric-label">
                            Avg. Time to Response
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
                {/* Status Distrubution Pie Chart */}
                <div className="chart-card">
                    <h3>Applications by Status</h3>
                    <ResponsiveContainer width='100%' height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx='50%'
                                cy='50%'
                                labelLine={false}
                                label={({name, percent}) => '${name}: ${(percent * 100).toFixed(0)}%'}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey='value'
                            >
                                {pieData.map((entry, index) => {
                                    <Cell key={'cell-${index}'} fill={entry.color} />
                                })}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Applications Over Time Bar Chart */}
                <div className="chart-card">
                    <h3>Applications Over Time</h3>
                    <ResponsiveContainer width='100%' height={300}>
                        <Barchart data={barData}>
                            <CartesianGrid strokeDasharray='3 3' />
                            <XAxis dataKey='month' />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey='count' fill='#667eea' name='Applications' />
                        </Barchart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
                <h3>Recent Applications</h3>
                <div className="activity-list">
                    {applications.slice(0, 5).map(app => (
                        <div key={app.id} className="activity-item">
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