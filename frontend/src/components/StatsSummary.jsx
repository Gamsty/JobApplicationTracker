import { useEffect, useState } from "react";
import { applicationService } from "../services/frontApplicationService";
import { STATUS_COLORS, STATUS_LABELS } from "../utils/constants";
import './StatsSummary.css';

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

    if (loading || !stats) {
        return null;
    }

    const statusEntries = Object.entries(stats.statusCounts);
    const total = stats.totalApplications;

    return (
        <div className="stats-summary">
            <div className="stat-card total">
                <div className="stat-value">
                    {total}
                </div>
                <div className="stat-label">
                    Total Applications
                </div>
            </div>

            {statusEntries.map(([status, count]) => {
                const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
                return (
                    <div
                        key={status}
                        className="stat-card"
                        style={{ borderLeftColor: STATUS_COLORS[status] }}
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