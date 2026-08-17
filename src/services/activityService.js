const STORAGE_KEY = 'syskode_activities_store';
import { databaseService, createDatabaseId } from './databaseService';
function loadActivities() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        }
        catch (e) {
            // fallback
        }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
}
function saveActivities(activities) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    databaseService.queueSync(STORAGE_KEY, activities);
}
export const activityService = {
    getActivities() {
        return loadActivities();
    },
    deleteActivity(id) {
        const activities = loadActivities().filter(a => a.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
        databaseService.queueDelete('activities', id);
    },
    logActivity(user, action, relatedRecordType, relatedRecordId, description) {
        const activities = loadActivities();
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newActivity = {
            id: createDatabaseId(),
            user,
            action,
            date,
            time,
            relatedRecordType,
            relatedRecordId,
            description
        };
        activities.unshift(newActivity);
        saveActivities(activities);
        return newActivity;
    }
};
