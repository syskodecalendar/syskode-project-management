import { activityService } from './activityService';
const STORAGE_KEY = 'syskode_tasks_store';
import { databaseService, createDatabaseId } from './databaseService';
function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
        catch (e) { }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
}
function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    databaseService.queueSync(STORAGE_KEY, tasks);
}
export const taskService = {
    getTasks() {
        return loadTasks();
    },
    getTasksByProject(projectId) {
        return loadTasks().filter(t => t.projectId === projectId);
    },
    createTask(data) {
        const tasks = loadTasks();
        const newTask = {
            ...data,
            id: createDatabaseId(),
            startDate: new Date().toISOString().split('T')[0],
            actualHours: 0,
            commentsCount: 0
        };
        tasks.unshift(newTask);
        saveTasks(tasks);
        activityService.logActivity(data.assignedMember || 'Team Member', 'Task Created', 'task', newTask.id, `Created task "${newTask.taskName}" for project ${newTask.projectName}`);
        return newTask;
    },
    updateTaskStatus(id, status) {
        const tasks = loadTasks();
        const idx = tasks.findIndex(t => t.id === id);
        if (idx === -1)
            throw new Error('Task not found');
        const previous = tasks[idx].status;
        tasks[idx].status = status;
        saveTasks(tasks);
        activityService.logActivity(tasks[idx].assignedMember || 'Team Member', 'Task Status Changed', 'task', id, `Task "${tasks[idx].taskName}" status changed from ${previous} to ${status}`);
        return tasks[idx];
    },
    updateTask(id, updates) {
        const tasks = loadTasks();
        const idx = tasks.findIndex(t => t.id === id);
        if (idx === -1)
            throw new Error('Task not found');
        tasks[idx] = { ...tasks[idx], ...updates };
        saveTasks(tasks);
        return tasks[idx];
    },
    deleteTask(id) {
        const tasks = loadTasks().filter(t => t.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        databaseService.queueDelete('tasks', id);
    }
};
