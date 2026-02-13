import { useState } from "react";
import {APPLICATION_STATUS, STATUS_COLORS} from "../utils/constants";
import './ApplicationList.css';


// Component to display the list of applications with filtering and sorting options
function ApplicationList({ applications, onEdit, onDelete, onStatusFilter }) {
    const [statusFilter, setStatusFilter] = useState('ALL'); // Local state to track selected status filter
    const [sortOrder, setSortOrder] = useState('Newest'); // Local state to track selected sort order

    // Handle status filter change
    const handleStatusFilterChange = (e) => {
        const newFilter = e.target.value; // Get selected filter value
        setStatusFilter(newFilter); // Update local state for filter
        onStatusFilter(newFilter === 'ALL' ? null: newFilter); // Pass null for "All" to remove filter
    };

    const handleSortToggle = () => {
        setSortOrder(prev => prev === 'Newest' ? 'Oldest' : 'Newest'); // Toggle sort order between Newest and Oldest
    };

    // Sort applications based on selected sort order
    const sortedApplications = [...applications].sort((a, b) => {
        const dateA = new Date(a.applicationDate);
        const dateB = new Date(b.applicationDate);
        return sortOrder === 'Newest' ? dateB - dateA : dateA - dateB; // Sort by date applied
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        }); // Format date to a readable string
    };

    const getStatusBadgeColor = (status) => ({
        backgroundColor: STATUS_COLORS[status],
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
    });

    return (
        <div className="application-list">
            {/* Filter and Sort Controls */}
            <div className="list-controls">
                <div className="filter-group">
                    <label htmlFor="statusFilter">Filter by Status:</label>
                    <select 
                        id="statusFilter"
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        className="filter-select"
                    >
                        <option value="ALL">All Statuses</option>
                        {Object.keys(APPLICATION_STATUS).map(status => (
                            <option key={status} value={status}>
                                {APPLICATION_STATUS[status]}
                            </option>
                        ))}
                    </select>
                </div>

                <button onClick={handleSortToggle} className="sort-button">
                    Sort by date: {sortOrder === 'Newest' ? '↓ Newest First' : '↑ Oldest First'}
                </button>
            </div>

            {/* Application Count */}
            <div className="applications-count">
                Showing {sortedApplications.length} application{sortedApplications.length !== 1 ? 's' : ''}
            </div>

            {/* Application Table */}
            {sortedApplications.length === 0 ? (
                <div className="empty-state">
                    <p>
                        No applications found. Try adjusting your filters or add a new application.
                    </p>
                    <p>
                        Click the "Add Application" button to get started!
                    </p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="applications-table">
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>Position</th>
                                <th>Date Applied</th>
                                <th>Status</th>
                                <th>Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedApplications.map(app => (
                                <tr key={app.id}>
                                    <td className="company-cell">
                                        <strong>{app.companyName}</strong>
                                        {app.jobUrl && (
                                            <a 
                                                href={app.jobUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="job-link"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                🔗 View Job
                                            </a>
                                            )}
                                        </td>
                                        <td>{app.positionTitle}</td>
                                        <td>{formatDate(app.applicationDate)}</td>
                                        <td>
                                            <span style={getStatusBadgeColor(app.status)}>
                                                {APPLICATION_STATUS[app.status]}
                                            </span>
                                        </td>
                                        <td className="notes-cell">
                                            {app.notes ? (
                                                <span title={app.notes}>
                                                    {app.notes.length > 50 
                                                    ? `${app.notes.substring(0, 50)}...` 
                                                    : app.notes}
                                                </span>
                                            ) : (
                                                <span className="no-notes">No notes</span>
                                            )}
                                        </td>
                                        <td className="actions-cell">
                                            <button
                                                onClick={() => onEdit(app)}
                                                className="edit-button"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => onDelete(app.id, app.companyName)}
                                                className="delete-button"
                                            >
                                                Delete
                                            </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// Export the ApplicationList component as the default export of this module
export default ApplicationList;