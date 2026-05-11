// Application list component that displays all applications in a table format
// Provides status filtering (server-side via API) and date sorting (client-side)
// Props:
//   applications - array of application objects to display
//   onEdit - callback to open the edit form with a selected application
//   onDelete - callback to delete an application (receives id and companyName)
//   onStatusFilter - callback to re-fetch applications filtered by status from the backend
import { useEffect, useState } from "react";
import { applicationService } from "../services/applicationService";
import { APPLICATION_STATUS, STATUS_COLORS, STATUS_LABELS } from "../utils/constants";
import './ApplicationList.css';


function ApplicationList({ applications, onEdit, onDelete, onStatusFilter, onViewDetails }) {
    const [statusFilter, setStatusFilter] = useState('ALL'); // Tracks the selected filter dropdown value
    const [sortOrder, setSortOrder] = useState('Newest'); // Tracks sort direction: 'Newest' (descending) or 'Oldest' (ascending)
    const [searchQuery, setSearchQuery] = useState(''); // Search input text
    const [searchResults, setSearchResults] = useState(null); // null when no active search, array of SearchResult otherwise
    const [isSearching, setIsSearching] = useState(false);    // Shows "Searching..." while the request is in flight

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

    // Update search query state as the user types in the search input
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    }

    // Debounced full-text search against the backend (Azure AI Search in prod).
    // The 400ms delay batches keystrokes so a search-as-you-type pattern doesn't
    // hammer the API. Clearing the input restores the unfiltered list immediately.
    useEffect(() => {
        const q = searchQuery.trim();
        if (!q) {
            setSearchResults(null);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        const timer = setTimeout(async () => {
            const results = await applicationService.fullTextSearch(q);
            setSearchResults(results);
            setIsSearching(false);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Build lookup structures from the search response so we can filter the already-loaded
    // applications array by matching ID and render highlights inline with each row.
    const searchResultIds = searchResults
        ? new Set(searchResults.map(r => r.applicationId))
        : null;
    const highlightsByAppId = searchResults
        ? Object.fromEntries(searchResults.map(r => [r.applicationId, r.highlights]))
        : {};

    // When there's no search, show the whole sorted list. When there is, intersect with
    // the IDs Azure Search returned — preserves the current sort order on top of the match set.
    const filteredApplications = searchResultIds
        ? sortedApplications.filter(app => searchResultIds.has(app.id))
        : sortedApplications;

    return (
        <div className="application-list">
            {/* Search box — debounced full-text search via Azure AI Search.
                Covers company name, position, notes, and interview content (not just company
                name like the old client-side filter). The clear button (×) only appears when
                there is text in the search input. */}
            <div className="search-box">
                <input
                    type="text"
                    placeholder="Search applications, notes, interview feedback..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="search-input"
                />
                {isSearching && <span className="search-status">Searching…</span>}
                {/* Clear button resets search query, showing all applications again */}
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="clear-search">×</button>
                )}
            </div>

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
                Showing {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
            </div>

            {/* Conditional rendering: empty state message or the applications table */}
            {filteredApplications.length === 0 ? (
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
                            {filteredApplications.map(app => (
                                <tr key={app.id}>
                                    {/* Company cell — shows name and optional job posting link.
                                        In search mode, also shows the matching snippet from whichever
                                        field hit (notes, interview feedback, etc.) so the user sees
                                        WHY a result matched, not just THAT it did. */}
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
                                        {/* Highlight snippets from Azure AI Search.
                                            Server controls the index and only emits <em> tags around
                                            matched terms, so dangerouslySetInnerHTML is safe here.
                                            Only render the first matching field — keeps the row compact. */}
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
                                        {/* Action buttons — view opens the details panel, edit opens the form modal, delete shows confirmation dialog */}
                                        <td className="actions-cell">
                                            <button
                                                onClick={() => onViewDetails(app)}
                                                className="view-button"
                                            >
                                                View Details
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