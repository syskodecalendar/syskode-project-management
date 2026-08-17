const STORAGE_KEY = 'syskode_company_settings_store';
import { databaseService } from './databaseService';
export const settingsService = {
    getSettings() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            }
            catch (e) { }
        }
        const empty = {};
        localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
        return empty;
    },
    updateSettings(updates) {
        const current = this.getSettings();
        const updated = { ...current, ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        databaseService.queueSync(STORAGE_KEY, updated);
        return updated;
    }
};
