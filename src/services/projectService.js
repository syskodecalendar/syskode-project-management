import { leadService } from './leadService';
import { activityService } from './activityService';
import { projectStatusService } from './projectStatusService';
const STORAGE_KEY = 'syskode_projects_store';
import { databaseService, createDatabaseId } from './databaseService';
function loadProjects() {
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
function saveProjects(projects) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    databaseService.queueSync(STORAGE_KEY, projects);
}
export function calculateProjectHealth(project) {
    if (project.projectStatus === 'Completed') {
        return { health: 'On Track', explanation: 'Project successfully completed.' };
    }
    // Calculate days to expected completion
    const today = new Date();
    const completionDate = project.expectedCompletionDate ? new Date(project.expectedCompletionDate) : null;
    const isOverdue = completionDate && completionDate < today;
    const progress = Math.min(100, Math.max(0, project.progressPercentage ?? 0));
    if (isOverdue && progress < 100) {
        return {
            health: 'At Risk',
            explanation: 'Project timeline exceeded expected completion date with incomplete deliverables.'
        };
    }
    if (progress < 30 && project.priority === 'Critical') {
        return {
            health: 'Attention',
            explanation: 'Critical project currently under 30% progress.'
        };
    }
    return {
        health: project.healthStatus || 'Not Assessed',
        explanation: project.healthExplanation || 'No health assessment has been recorded yet.'
    };
}
export const projectService = {
    getProjects() {
        return loadProjects();
    },
    getProjectById(id) {
        return loadProjects().find(p => p.id === id || p.projectId === id);
    },
    createProject(data) {
        const projects = loadProjects();
        const id = createDatabaseId();
        const projectId = `SYS-PRJ-${new Date().getFullYear()}-${id.slice(0, 6).toUpperCase()}`;
        const healthObj = calculateProjectHealth(data);
        const newProject = {
            ...data,
            id,
            projectId,
            healthStatus: healthObj.health,
            healthExplanation: healthObj.explanation
        };
        projects.unshift(newProject);
        saveProjects(projects);
        projectStatusService.add(newProject, data.projectManager || 'System', undefined, 'Project created');
        activityService.logActivity(data.projectManager || 'System', 'Project Created', 'project', newProject.id, `Created project "${newProject.projectName}" (${newProject.projectId}) for ${newProject.client}`);
        return newProject;
    },
    convertLeadToProject(leadId, projectManager, startDate, expectedCompletionDate, contractValue, description) {
        const lead = leadService.getLeadById(leadId);
        if (!lead)
            throw new Error('Lead not found');
        const project = this.createProject({
            leadId: lead.id,
            projectName: lead.leadName,
            client: lead.companyName,
            projectType: lead.serviceInterested,
            projectManager,
            startDate,
            expectedCompletionDate,
            contractValue: contractValue || lead.estimatedProjectValue,
            currency: lead.currency || 'BHD',
            projectStatus: 'Planning',
            priority: lead.priority || '',
            progressPercentage: 0,
            description: description || lead.notes || '',
            supportPeriod: ''
        });
        // Update lead status to Won and set convertedProjectId
        leadService.updateLead(lead.id, {
            status: 'Won',
            customStatus: `Converted to active project ${project.projectId}`,
            convertedProjectId: project.id
        });
        activityService.logActivity(projectManager, 'Lead Converted to Project', 'project', project.id, `Successfully converted lead "${lead.leadName}" into project "${project.projectName}"`);
        return project;
    },
    updateProject(id, updates, changedBy) {
        const projects = loadProjects();
        const idx = projects.findIndex(p => p.id === id);
        if (idx === -1)
            throw new Error('Project not found');
        const previous = { ...projects[idx] };
        const updated = { ...projects[idx], ...updates };
        if (updates.projectStatus !== undefined || updates.manualStatus !== undefined) {
            updated.lastStatusUpdatedAt = new Date().toISOString();
        }
        const healthObj = calculateProjectHealth(updated);
        updated.healthStatus = healthObj.health;
        updated.healthExplanation = healthObj.explanation;
        projects[idx] = updated;
        saveProjects(projects);
        const statusChanged = previous.projectStatus !== updated.projectStatus || previous.manualStatus !== updated.manualStatus || previous.progressPercentage !== updated.progressPercentage;
        if (statusChanged) {
            projectStatusService.add(updated, changedBy || updated.projectManager || 'System', previous, updates.manualStatus ? 'Manual project status updated' : 'Project stage/progress updated');
        }
        activityService.logActivity(changedBy || updated.projectManager || 'System', statusChanged ? 'Project Status Updated' : 'Project Updated', 'project', id, statusChanged
            ? `Updated project "${updated.projectName}" to ${updated.projectStatus} (${updated.progressPercentage}%)${updated.manualStatus ? ` — ${updated.manualStatus}` : ''}`
            : `Updated project "${updated.projectName}"`);
        return updated;
    },
    deleteProject(id) {
        const projects = loadProjects().filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        // Keep browser cache aligned with PostgreSQL ON DELETE CASCADE relationships.
        const relatedStores = [
            ['syskode_members_store', 'projectId'], ['syskode_matrix_store', 'projectId'], ['syskode_tasks_store', 'projectId'],
            ['syskode_credentials_store', 'projectId'], ['syskode_domains_store', 'projectId'], ['syskode_hosting_store', 'projectId'],
            ['syskode_ssl_store', 'projectId'], ['syskode_repos_store', 'projectId'], ['syskode_deploys_store', 'projectId'],
            ['syskode_qa_testcases_store', 'projectId'], ['syskode_project_status_logs_store', 'projectId']
        ];
        for (const [key, field] of relatedStores) {
            try {
                const rows = JSON.parse(localStorage.getItem(key) || '[]');
                if (Array.isArray(rows))
                    localStorage.setItem(key, JSON.stringify(rows.filter((row) => row[field] !== id)));
            }
            catch (_) { }
        }
        databaseService.queueDelete('projects', id);
    },
    getProjectStats() {
        const projects = loadProjects();
        const total = projects.length;
        const active = projects.filter(p => p.projectStatus !== 'Completed').length;
        const completed = projects.filter(p => p.projectStatus === 'Completed').length;
        const onTrack = projects.filter(p => p.healthStatus === 'On Track').length;
        const atRisk = projects.filter(p => p.healthStatus === 'At Risk' || p.healthStatus === 'Attention').length;
        const inQA = projects.filter(p => p.projectStatus === 'Internal Testing' || p.projectStatus === 'Client UAT').length;
        const totalContractValue = projects.reduce((acc, p) => acc + (p.contractValue || 0), 0);
        const averageCompletion = total > 0
            ? Math.round(projects.reduce((acc, p) => acc + Math.min(100, Math.max(0, p.progressPercentage || 0)), 0) / total)
            : 0;
        return {
            total,
            active,
            completed,
            onTrack,
            atRisk,
            inQA,
            totalContractValue,
            averageCompletion,
        };
    }
};
