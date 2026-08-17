import { databaseService, createDatabaseId } from './databaseService';
const STORAGE_KEY = 'syskode_project_status_logs_store';
function loadLogs() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed))
                return parsed;
        }
    }
    catch (_) { }
    localStorage.setItem(STORAGE_KEY, '[]');
    return [];
}
function saveLogs(logs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    databaseService.queueSync(STORAGE_KEY, logs);
}
export const projectStatusService = {
    getByProject(projectId) {
        return loadLogs()
            .filter(item => item.projectId === projectId)
            .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
    },
    add(project, changedBy, previous, note) {
        const logs = loadLogs();
        const item = {
            id: createDatabaseId(),
            projectId: project.id,
            projectStatus: project.projectStatus,
            manualStatus: project.manualStatus,
            progressPercentage: project.progressPercentage ?? 0,
            changedBy: changedBy || 'System',
            changedAt: new Date().toISOString(),
            previousProjectStatus: previous?.projectStatus,
            previousManualStatus: previous?.manualStatus,
            note
        };
        logs.unshift(item);
        saveLogs(logs);
        return item;
    },
    delete(id) {
        const logs = loadLogs().filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
        databaseService.queueDelete('project_status_logs', id);
    }
};
