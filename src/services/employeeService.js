import { authService } from './authService';
import { isSupabaseConfigured } from './supabaseClient';
import { getDefaultPermissions } from './permissionService';
async function apiRequest(path, init = {}) {
    const token = await authService.getAccessToken();
    const headers = new Headers(init.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token)
        headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(path, { ...init, headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok)
        throw new Error(payload?.error || `Request failed (${response.status})`);
    return payload;
}
export const employeeService = {
    async list() {
        if (!isSupabaseConfigured)
            return authService.getAllProfiles();
        const payload = await apiRequest('/api/admin/users');
        const users = (payload.users || []);
        authService.cacheProfiles(users);
        return users;
    },
    async create(input) {
        if (!isSupabaseConfigured) {
            const user = {
                id: `local-${Date.now()}`,
                name: input.name,
                email: input.email,
                role: input.role,
                department: input.department,
                phone: input.phone,
                jobTitle: input.jobTitle,
                employeeCode: input.employeeCode,
                status: input.status || 'Active',
                permissions: input.permissionsCustomized ? input.permissions : getDefaultPermissions(input.role),
                permissionsCustomized: Boolean(input.permissionsCustomized)
            };
            const all = [user, ...authService.getAllProfiles()];
            authService.cacheProfiles(all);
            return user;
        }
        const payload = await apiRequest('/api/admin/users', { method: 'POST', body: JSON.stringify(input) });
        await this.list();
        return payload.user;
    },
    async update(profileId, input) {
        if (!isSupabaseConfigured) {
            const all = authService.getAllProfiles();
            const idx = all.findIndex(u => u.id === profileId);
            if (idx < 0)
                throw new Error('Employee not found');
            all[idx] = { ...all[idx], ...input };
            authService.cacheProfiles(all);
            return all[idx];
        }
        const payload = await apiRequest(`/api/admin/users/${profileId}`, { method: 'PATCH', body: JSON.stringify(input) });
        await this.list();
        return payload.user;
    },
    async remove(profileId) {
        if (!isSupabaseConfigured) {
            authService.cacheProfiles(authService.getAllProfiles().filter(u => u.id !== profileId));
            return;
        }
        await apiRequest(`/api/admin/users/${profileId}`, { method: 'DELETE' });
        await this.list();
    },
    async resetPassword(profileId, password) {
        await this.update(profileId, { password });
    }
};
