const STORAGE_KEY = 'syskode_notifications_store';
import { databaseService } from './databaseService';
function loadNotifications() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        }
        catch (e) { }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
}
function saveNotifications(notifs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
    databaseService.queueSync(STORAGE_KEY, notifs);
}
export const notificationService = {
    getNotifications() {
        return loadNotifications();
    },
    getUnreadCount() {
        return loadNotifications().filter(n => !n.isRead).length;
    },
    markAsRead(id) {
        const list = loadNotifications();
        const item = list.find(n => n.id === id);
        if (item) {
            item.isRead = true;
            saveNotifications(list);
        }
    },
    markAllAsRead() {
        const list = loadNotifications();
        list.forEach(n => (n.isRead = true));
        saveNotifications(list);
    }
};
