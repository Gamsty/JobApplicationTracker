import { useState, useEffect } from 'react';
import { reminderService } from '../services/reminderService';
import { applicationService } from '../services/frontApplicationService';
import ReminderList from '../components/ReminderList';
import ReminderForm from '../components/ReminderForm';
import './Reminders.css';

// Page component for the Reminders tab.
// Owns form visibility and the currently-edited reminder, then passes handlers
// down to ReminderList (list + actions) and ReminderForm (create / edit modal).
// showToast — injected by App.jsx to show success / error notifications
function Reminders({ showToast }) {
    const [showForm, setShowForm] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null); // null = create mode, object = edit mode
    const [applications, setApplications] = useState([]);

    // Incrementing this key forces ReminderList to remount and re-fetch after any mutation
    const [refreshKey, setRefreshKey] = useState(0);

    // Fetch the user's applications once so the form can offer an "Link to Application" dropdown
    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        try {
            const data = await applicationService.getApplications();
            setApplications(data);
        } catch (err) {
            console.error('Error loading applications:', err);
        }
    };

    // Opens the form in create mode (no pre-filled reminder)
    const handleCreate = () => {
        setEditingReminder(null);
        setShowForm(true);
    };

    // Opens the form in edit mode, pre-filled with the selected reminder's data
    const handleEdit = (reminder) => {
        setEditingReminder(reminder);
        setShowForm(true);
    };

    // Closes the modal and clears the editing state
    const handleCloseForm = () => {
        setShowForm(false);
        setEditingReminder(null);
    };

    // Called by ReminderForm when creating a new reminder
    const handleCreateReminder = async (formData) => {
        try {
            await reminderService.createReminder(formData);
            setRefreshKey(prev => prev + 1); // triggers ReminderList remount → fresh fetch
            handleCloseForm();
            showToast('Reminder created successfully!', 'success');
        } catch (err) {
            console.error('Error creating reminder', err);
            showToast('Failed to create reminder', 'error');
            throw err; // re-throw so ReminderForm's catch block can show its own alert
        }
    };

    // Called by ReminderForm when saving edits to an existing reminder
    const handleUpdateReminder = async (formData) => {
        try {
            await reminderService.updateReminder(editingReminder.id, formData);
            setRefreshKey(prev => prev + 1);
            handleCloseForm();
            showToast('Reminder updated successfully!', 'success');
        } catch (err) {
            console.error('Error updating reminder', err);
            showToast('Failed to update reminder', 'error');
            throw err;
        }
    };

    return (
        <div className='reminders-page'>
            {/* List with filter tabs — remounts on refreshKey change to reload data after mutations */}
            <ReminderList
                key={refreshKey}
                onEdit={handleEdit}
                onCreate={handleCreate}
            />

            {/* Modal form — shown for both create and edit; onSubmit wired to the correct handler */}
            {showForm && (
                <ReminderForm
                    reminder={editingReminder}
                    applications={applications}
                    onSubmit={editingReminder ? handleUpdateReminder : handleCreateReminder}
                    onCancel={handleCloseForm}
                />
            )}
        </div>
    );
}

export default Reminders;
