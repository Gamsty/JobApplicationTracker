import { useEffect, useState } from "react";
import { applicationService } from "../services/applicationService";
import { STATUS_COLORS, STATUS_LABELS } from "../utils/constants";
import './StatsSummary.css';

// Status-count cards shown above the application list. Fetches independently so it
// stays in sync with the cached /statistics endpoint even when the parent's list
// reload is filtered.
function StatsSummary() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

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

    // Render nothing — better than a placeholder skeleton above the (much larger) table.
    if (loading || !stats) {
        return null;
    }

    const statusEntries = Object.entries(stats.statusCounts);
    const total = stats.totalApplications;

    return (
        <div className="stats-summary">
            <div className="stat-card total">
                <div className="stat-value">{total}</div>
                <div className="stat-label">Total applications</div>
            </div>

            {/* One card per status — each shows count, label, and percentage of total */}
            {statusEntries.map(([status, count]) => {
                // Calculate what percentage of total applications have this status
                // Returns 0 if there are no applications to avoid division by zero
                const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
                return (
                    <div key={status} className="stat-card">
                        <div className="stat-value">{count}</div>
                        <div className="stat-label">
                            <span className="stat-dot" style={{ backgroundColor: STATUS_COLORS[status] }}></span>
                            {STATUS_LABELS[status]}
                        </div>
                        <div className="stat-percentage">{percentage}%</div>
                    </div>
                );
            })}
        </div>
    );
}

export default StatsSummary;