import { activityService } from './activityService';
const MEMBERS_KEY = 'syskode_members_store';
const MATRIX_KEY = 'syskode_matrix_store';
import { databaseService, createDatabaseId } from './databaseService';
function loadMembers() {
    const stored = localStorage.getItem(MEMBERS_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
        catch (e) { }
    }
    localStorage.setItem(MEMBERS_KEY, JSON.stringify([]));
    return [];
}
function saveMembers(m) {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(m));
    databaseService.queueSync(MEMBERS_KEY, m);
}
function loadMatrix() {
    const stored = localStorage.getItem(MATRIX_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
        catch (e) { }
    }
    localStorage.setItem(MATRIX_KEY, JSON.stringify([]));
    return [];
}
function saveMatrix(m) {
    localStorage.setItem(MATRIX_KEY, JSON.stringify(m));
    databaseService.queueSync(MATRIX_KEY, m);
}
export const teamService = {
    getAllMembers() {
        return loadMembers();
    },
    getAllMatrix() {
        return loadMatrix();
    },
    getMembersByProject(projectId) {
        return loadMembers().filter(m => m.projectId === projectId);
    },
    addMember(projectId, employeeName, role, responsibility, notes) {
        const members = loadMembers();
        const newMember = {
            id: createDatabaseId(),
            projectId,
            employeeName,
            role,
            responsibility,
            startDate: new Date().toISOString().split('T')[0],
            status: 'Assigned',
            notes
        };
        members.push(newMember);
        saveMembers(members);
        activityService.logActivity('Project Manager', 'Team Member Assigned', 'project', projectId, `Assigned ${employeeName} as ${role} for project`);
        return newMember;
    },
    deleteMember(id) {
        const members = loadMembers().filter(m => m.id !== id);
        localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
        databaseService.queueDelete('project_members', id);
    },
    deleteMatrixItem(id) {
        const matrix = loadMatrix().filter(m => m.id !== id);
        localStorage.setItem(MATRIX_KEY, JSON.stringify(matrix));
        databaseService.queueDelete('project_responsibilities', id);
    },
    getMatrixByProject(projectId) {
        const items = loadMatrix().filter(m => m.projectId === projectId);
        if (items.length > 0)
            return items;
        return [];
    },
    updateMatrixItem(id, updates) {
        const matrix = loadMatrix();
        const idx = matrix.findIndex(m => m.id === id);
        if (idx === -1) {
            // create new item if doesn't exist
            const newItem = {
                id,
                projectId: updates.projectId || (() => { throw new Error('A project is required for a responsibility item.'); })(),
                responsibility: updates.responsibility || 'Custom Responsibility',
                primaryOwner: updates.primaryOwner || '',
                backupOwner: updates.backupOwner,
                status: updates.status || 'Assigned'
            };
            matrix.push(newItem);
            saveMatrix(matrix);
            return newItem;
        }
        matrix[idx] = { ...matrix[idx], ...updates };
        saveMatrix(matrix);
        return matrix[idx];
    }
};
