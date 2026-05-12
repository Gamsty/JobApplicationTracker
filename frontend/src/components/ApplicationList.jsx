import { useEffect, useState } from "react";
import { applicationService } from "../services/applicationService";
import { APPLICATION_STATUS, STATUS_COLORS, STATUS_LABELS } from "../utils/constants";
import './ApplicationList.css';


function ApplicationList({ applications, onEdit, onDelete, onStatusFilter, onViewDetails }) {
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sortOrder, setSortOrder] = useState('Newest');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const handleStatusFilterChange = (e) => {
        const newFilter = e.target.value;
        setStatusFilter(newFilter);
        onStatusFilter(newFilter === 'ALL' ? null : newFilter);
    };

    const handleSortToggle = () => {
        setSortOrder(prev => prev === 'Newest' ? 'Oldest' : 'Newest');
    };

    const sortedApplications = [...applications].sort((a, b) => {
        const dateA = new Date(a.applicationDate);
        const dateB = new Date(b.applicationDate);
        return sortOrder === 'Newest' ? dateB - dateA : dateA - dateB;
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusStyle = (status) => ({
        color: STATUS_COLORS[status],
    });

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    }

    // Debounced full-text search against the backend (Azure AI Search in prod).
    // All setState calls live inside the setTimeout callback so the
    // react-hooks/set-state-in-effect rule doesn't fire (no synchronous render
    // cascade from the effect body). 0ms timer on empty query gives an effectively
    // instant clear; 400ms on a real query batches rapid keystrokes.
    useEffect(() => {
        const q = searchQuery.trim();
        const timer = setTimeout(async () => {
            if (!q) {
                setSearchResults(null);
                setIsSearching(false);
                return;
            }
            setIsSearching(true);
            const results = await applicationService.fullTextSearch(q);
            setSearchResults(results);
            setIsSearching(false);
        }, q ? 400 : 0);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Search returns just IDs + highlight snippets. Intersect with the already-loaded
    // applications array so we keep the current sort order on top of the match set.
    const searchResultIds = searchResults
        ? new Set(searchResults.map(r => r.applicationId))
        : null;
    const highlightsByAppId = searchResults
        ? Object.fromEntries(searchResults.map(r => [r.applicationId, r.highlights]))
        : {};

    const filteredApplications = searchResultIds
        ? sortedApplications.filter(app => searchResultIds.has(app.id))
        : sortedApplications;

    return (
        <div className="application-list">
            <div className="search-box">
                <input
                    type="text"
                    placeholder="Search applications, notes, interview feedback…"
                    value={searchQuery}
                    onChange={handleSearch}
                    className="search-input"
                />
                {isSearching && <span className="search-status">Searching…</span>}
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="clear-search">×</button>
                )}
            </div>

            <div className="list-controls">
                <div className="filter-group">
                    <label htmlFor="statusFilter">Status</label>
                    <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        className="filter-select"
                    >
                        <option value="ALL">All statuses</option>
                        {Object.keys(APPLICATION_STATUS).map(status => (
                            <option key={status} value={status}>
                                {STATUS_LABELS[status]}
                            </option>
                        ))}
                    </select>
                </div>

                <button onClick={handleSortToggle} className="sort-button">
                    {sortOrder === 'Newest' ? 'Newest first ↓' : 'Oldest first ↑'}
                </button>
            </div>

            <div className="applications-count">
                Showing {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
            </div>

            {filteredApplications.length === 0 ? (
                <div className="empty-state">
                    <p>No applications match the current filter.</p>
                    <p>Add a new one above, or clear the filter to see everything.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="applications-table">
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>Position</th>
                                <th>Applied</th>
                                <th>Status</th>
                                <th>Notes</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredApplications.map(app => (
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
                                                View posting
                                            </a>
                                            )}
                                        {/* Server-controlled <em> tags around the matched term;
                                            dangerouslySetInnerHTML is fine because the index isn't user-writeable. */}
                                        {highlightsByAppId[app.id] && Object.entries(highlightsByAppId[app.id])
                                            .filter(([, snippets]) => snippets && snippets.length > 0)
                                            .slice(0, 1)
                                            .map(([field, snippets]) => (
                                                <div key={field} className="search-snippet">
                                                    <span className="search-snippet-field">{field}:</span>
                                                    <span
                                                        className="search-snippet-text"
                                                        dangerouslySetInnerHTML={{ __html: snippets[0] }}
                                                    />
                                                </div>
                                            ))}
                                        </td>
                                        <td>{app.positionTitle}</td>
                                        <td>{formatDate(app.applicationDate)}</td>
                                        <td>
                                            <span className="status-tag" style={getStatusStyle(app.status)}>
                                                <span
                                                    className="status-tag-dot"
                                                    style={{ backgroundColor: STATUS_COLORS[app.status] }}
                                                />
                                                {STATUS_LABELS[app.status]}
                                            </span>
                                        </td>
                                        <td className="notes-cell">
                                            {app.notes ? (
                                                <span title={app.notes}>
                                                    {app.notes.length > 50
                                                    ? `${app.notes.substring(0, 50)}…`
                                                    : app.notes}
                                                </span>
                                            ) : (
                                                <span className="no-notes">No notes</span>
                                            )}
                                        </td>
                                        <td className="actions-cell">
                                            <button
                                                onClick={() => onViewDetails(app)}
                                                className="view-button"
                                            >
                                                View
                                            </button>
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