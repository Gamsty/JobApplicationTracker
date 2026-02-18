// Statistics summary component displayed above the application list on the home page
// Shows a total applications count card followed by one card per status with count and percentage
// Fetches its own data independently from the backend statistics endpoint
import { useEffect, useState } from "react";
import { applicationService } from "../services/frontApplicationService";
import { STATUS_COLORS, STATUS_LABELS } from "../utils/constants";
import './StatsSummary.css';

function StatsSummary() {
    const [stats, setStats] = useState(null); // Statistics object: { totalApplications, statusCounts }
    const [loading, setLoading] = useState(true); // Loading state while fetching statistics

    // Fetch statistics from the backend when the component mounts
    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await applicationService.getStatistics();
            setStats(data);
        } catch (err) {
            console.error('Error loading stats:', err)
        } finally {
            setLoading(false);
        }
    };

    // Render nothing while loading or if stats failed to load
    // This prevents the component from taking up space before data is ready
    if (loading || !stats) {
        return null;
    }

    // Convert statusCounts object into [status, count] pairs for iteration
    const statusEntries = Object.entries(stats.statusCounts);
    const total = stats.totalApplications;

    return (
        <div className="stats-summary">
            {/* Total applications card — styled differently with the "total" class */}
            <div className="stat-card total">
                <div className="stat-value">
                    {total}
                </div>
                <div className="stat-label">
                    Total Applications
                </div>
            </div>

            {/* One card per status — each shows count, label, and percentage of total */}
            {statusEntries.map(([status, count]) => {
                // Calculate what percentage of total applications have this status
                // Returns 0 if there are no applications to avoid division by zero
                const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
                return (
                    <div
                        key={status}
                        className="stat-card"
                        style={{ borderLeftColor: STATUS_COLORS[status] }} // Colored left border matches status color
                    >
                        <div className="stat-value">
                            {count}
                        </div>
                        <div className="stat-label">
                            {STATUS_LABELS[status]}
                        </div>
                        <div className="stat-percentage">
                            {percentage}%
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default StatsSummary;
