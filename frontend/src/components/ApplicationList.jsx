// Application list component that displays all applications in a table format
// Provides status filtering (server-side via API) and date sorting (client-side)
// Props:
//   applications - array of application objects to display
//   onEdit - callback to open the edit form with a selected application
//   onDelete - callback to delete an application (receives id and companyName)
//   onStatusFilter - callback to re-fetch applications filtered by status from the backend
import { useState } from "react";
import {APPLICATION_STATUS, STATUS_COLORS, STATUS_LABELS} from "../utils/constants";
import './ApplicationList.css';


function ApplicationList({ applications, onEdit, onDelete, onStatusFilter }) {
    const [statusFilter, setStatusFilter] = useState('ALL'); // Tracks the selected filter dropdown value
    const [sortOrder, setSortOrder] = useState('Newest'); // Tracks sort direction: 'Newest' (descending) or 'Oldest' (ascending)

    // Handle status filter dropdown change
    // Updates local state and calls parent callback to re-fetch filtered data from the backend
    const handleStatusFilterChange = (e) => {
        const newFilter = e.target.value;
        setStatusFilter(newFilter);
        onStatusFilter(newFilter === 'ALL' ? null: newFilter); // Pass null for "All" so backend returns all applications
    };

    // Toggle sort order between newest-first and oldest-first
    const handleSortToggle = () => {
        setSortOrder(prev => prev === 'Newest' ? 'Oldest' : 'Newest');
    };

    // Create a sorted copy of applications array (does not mutate the original)
    // Sorting is done client-side since all filtered results are already loaded
    const sortedApplications = [...applications].sort((a, b) => {
        const dateA = new Date(a.applicationDate);
        const dateB = new Date(b.applicationDate);
        return sortOrder === 'Newest' ? dateB - dateA : dateA - dateB;
    });

    // Format a date string (e.g., "2026-02-18") into a human-readable format (e.g., "Feb 18, 2026")
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Generate inline styles for status badge pill — colored background based on status
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
            {/* Controls bar — status filter dropdown and sort toggle button */}
            <div className="list-controls">
                <div className="filter-group">
                    <label htmlFor="statusFilter">Filter by Status:</label>
                    {/* Dropdown populated from APPLICATION_STATUS constants with an "All" option */}
                    <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        className="filter-select"
                    >
                        <option value="ALL">All Statuses</option>
                        {Object.keys(APPLICATION_STATUS).map(status => (
                            <option key={status} value={status}>
                                {STATUS_LABELS[status]}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Sort button toggles between newest and oldest first, with arrow indicator */}
                <button onClick={handleSortToggle} className="sort-button">
                    Sort by date: {sortOrder === 'Newest' ? '↓ Newest First' : '↑ Oldest First'}
                </button>
            </div>

            {/* Application count with pluralization (e.g., "1 application" vs "3 applications") */}
            <div className="applications-count">
                Showing {sortedApplications.length} application{sortedApplications.length !== 1 ? 's' : ''}
            </div>

            {/* Conditional rendering: empty state message or the applications table */}
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
                                    {/* Company cell — shows name and optional job posting link */}
                                    <td className="company-cell">
                                        <strong>{app.companyName}</strong>
                                        {/* Only render job link if a URL was provided */}
                                        {app.jobUrl && (
                                            <a
                                                href={app.jobUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="job-link"
                                                onClick={(e) => e.stopPropagation()} // Prevent row click events from firing
                                            >
                                                🔗 View Job
                                            </a>
                                            )}
                                        </td>
                                        <td>{app.positionTitle}</td>
                                        <td>{formatDate(app.applicationDate)}</td>
                                        {/* Status badge — colored pill with human-readable label */}
                                        <td>
                                            <span style={getStatusBadgeColor(app.status)}>
                                                {STATUS_LABELS[app.status]}
                                            </span>
                                        </td>
                                        {/* Notes cell — truncated to 50 chars with full text in tooltip */}
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
                                        {/* Action buttons — edit opens the form modal, delete shows confirmation dialog */}
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

export default ApplicationList;