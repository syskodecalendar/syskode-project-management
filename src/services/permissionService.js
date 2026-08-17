export const ALL_PERMISSIONS = [
    'view_dashboard',
    'view_leads', 'manage_leads', 'delete_leads',
    'view_meetings', 'manage_meetings', 'delete_meetings',
    'view_proposals', 'manage_proposals', 'delete_proposals',
    'view_projects', 'manage_projects', 'delete_projects',
    'view_tasks', 'manage_tasks', 'delete_tasks',
    'view_qa', 'manage_qa', 'delete_qa',
    'view_infrastructure', 'manage_infrastructure', 'delete_infrastructure',
    'view_team', 'manage_team', 'delete_team',
    'view_credentials', 'manage_credentials', 'delete_credentials',
    'view_reports', 'view_activity', 'delete_activity',
    'view_settings', 'manage_settings', 'manage_users'
];
export const PERMISSION_GROUPS = [
    { title: 'Leads', permissions: [
            { key: 'view_leads', label: 'View leads' }, { key: 'manage_leads', label: 'Create / edit leads' }, { key: 'delete_leads', label: 'Delete leads' }
        ] },
    { title: 'Meetings', permissions: [
            { key: 'view_meetings', label: 'View meetings' }, { key: 'manage_meetings', label: 'Create / edit meetings' }, { key: 'delete_meetings', label: 'Delete meetings' }
        ] },
    { title: 'Proposals', permissions: [
            { key: 'view_proposals', label: 'View proposals' }, { key: 'manage_proposals', label: 'Upload / edit proposals & pricing' }, { key: 'delete_proposals', label: 'Delete proposals / pricing / vendors' }
        ] },
    { title: 'Projects', permissions: [
            { key: 'view_projects', label: 'View projects' }, { key: 'manage_projects', label: 'Create / edit projects' }, { key: 'delete_projects', label: 'Delete projects' }
        ] },
    { title: 'Tasks', permissions: [
            { key: 'view_tasks', label: 'View tasks' }, { key: 'manage_tasks', label: 'Create / edit tasks' }, { key: 'delete_tasks', label: 'Delete tasks' }
        ] },
    { title: 'QA', permissions: [
            { key: 'view_qa', label: 'View QA' }, { key: 'manage_qa', label: 'Create / edit test cases' }, { key: 'delete_qa', label: 'Delete test cases' }
        ] },
    { title: 'Infrastructure', permissions: [
            { key: 'view_infrastructure', label: 'View infrastructure' }, { key: 'manage_infrastructure', label: 'Add / edit infrastructure' }, { key: 'delete_infrastructure', label: 'Delete infrastructure' }
        ] },
    { title: 'Team', permissions: [
            { key: 'view_team', label: 'View team' }, { key: 'manage_team', label: 'Assign / edit team members' }, { key: 'delete_team', label: 'Remove team members / RACI items' }
        ] },
    { title: 'Credentials', permissions: [
            { key: 'view_credentials', label: 'View credentials' }, { key: 'manage_credentials', label: 'Add / edit credentials' }, { key: 'delete_credentials', label: 'Delete credentials' }
        ] },
    { title: 'Administration', permissions: [
            { key: 'view_reports', label: 'View reports' }, { key: 'view_activity', label: 'View audit activity' },
            { key: 'delete_activity', label: 'Delete audit records' }, { key: 'view_settings', label: 'View settings' },
            { key: 'manage_settings', label: 'Manage settings' }, { key: 'manage_users', label: 'Manage employees, roles & permissions' }
        ] }
];
const DEFAULTS = {
    Admin: ALL_PERMISSIONS,
    Management: ALL_PERMISSIONS.filter(p => p !== 'delete_activity'),
    Sales: [
        'view_dashboard', 'view_leads', 'manage_leads', 'view_meetings', 'manage_meetings', 'view_proposals', 'manage_proposals',
        'view_projects', 'view_tasks', 'view_reports', 'view_activity'
    ],
    'Project Manager': [
        'view_dashboard', 'view_leads', 'view_meetings', 'view_proposals', 'view_projects', 'manage_projects',
        'view_tasks', 'manage_tasks', 'delete_tasks', 'view_qa', 'manage_qa', 'view_infrastructure', 'manage_infrastructure',
        'view_team', 'manage_team', 'delete_team', 'view_credentials', 'manage_credentials', 'view_reports', 'view_activity'
    ],
    Developer: [
        'view_dashboard', 'view_projects', 'view_tasks', 'manage_tasks', 'view_qa', 'manage_qa', 'view_infrastructure',
        'manage_infrastructure', 'view_team', 'view_credentials', 'manage_credentials', 'view_activity'
    ],
    QA: ['view_dashboard', 'view_projects', 'view_tasks', 'view_qa', 'manage_qa', 'delete_qa', 'view_team', 'view_activity']
};
export function getDefaultPermissions(role) {
    return [...DEFAULTS[role]];
}
export function hasPermission(user, permission) {
    if (!user)
        return false;
    if (user.role === 'Admin')
        return true;
    const permissions = user.permissionsCustomized ? (user.permissions || []) : getDefaultPermissions(user.role);
    return permissions.includes(permission);
}
export function permissionsForUser(user) {
    if (user.role === 'Admin')
        return [...ALL_PERMISSIONS];
    return user.permissionsCustomized ? [...(user.permissions || [])] : getDefaultPermissions(user.role);
}
