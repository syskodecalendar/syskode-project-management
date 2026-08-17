import { activityService } from './activityService';
import { databaseService, createDatabaseId } from './databaseService';
import { hasPermission } from './permissionService';
const STORAGE_KEY = 'syskode_credentials_store';
function loadCredentials() {
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
function saveCredentials(credentials) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
    databaseService.queueSync(STORAGE_KEY, credentials);
}
export const credentialService = {
    getCredentialsByProject(projectId, currentUser) {
        // Admin always has access. Everyone else must explicitly inherit or receive
        // the view_credentials permission. Supabase RLS enforces the same rule.
        if (!hasPermission(currentUser, 'view_credentials'))
            return [];
        return loadCredentials().filter(c => c.projectId === projectId);
    },
    addCredential(data, currentUser) {
        const creds = loadCredentials();
        const newCred = {
            ...data,
            id: createDatabaseId(),
            lastUpdated: new Date().toISOString().split('T')[0],
            updatedBy: currentUser
        };
        creds.unshift(newCred);
        saveCredentials(creds);
        activityService.logActivity(currentUser, 'Credential Created', 'credential', newCred.id, `Added ${data.category} credential for service "${data.service}"`);
        return newCred;
    },
    updateCredential(id, updates, currentUser) {
        const creds = loadCredentials();
        const idx = creds.findIndex(c => c.id === id);
        if (idx === -1)
            throw new Error('Credential not found');
        creds[idx] = {
            ...creds[idx],
            ...updates,
            lastUpdated: new Date().toISOString().split('T')[0],
            updatedBy: currentUser
        };
        saveCredentials(creds);
        activityService.logActivity(currentUser, 'Credential Updated', 'credential', id, `Updated credential "${creds[idx].service}"`);
        return creds[idx];
    },
    deleteCredential(id, currentUser = 'System') {
        const existing = loadCredentials().find(c => c.id === id);
        const creds = loadCredentials().filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
        databaseService.queueDelete('credentials', id);
        if (existing)
            activityService.logActivity(currentUser, 'Credential Deleted', 'credential', id, `Deleted credential "${existing.service}"`);
    }
};
