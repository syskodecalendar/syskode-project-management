import { isSupabaseConfigured, supabase } from './supabaseClient';
const CURRENT_USER_KEY = 'syskode_current_user';
function defaultUser() {
    return { id: 'local-admin', name: 'Local Admin', email: 'local@syskode.local', role: 'Admin', department: 'Management' };
}
function mapProfile(row) {
    return {
        id: row.id,
        userId: row.user_id || undefined,
        name: row.name,
        email: row.email,
        role: row.role,
        avatar: row.avatar_url || undefined,
        department: row.department || undefined,
        phone: row.phone || undefined,
        jobTitle: row.job_title || undefined,
        employeeCode: row.employee_code || undefined,
        status: row.status || 'Active',
        permissions: Array.isArray(row.permissions) ? row.permissions : [],
        permissionsCustomized: Boolean(row.permissions_customized)
    };
}
export const authService = {
    getCurrentUser() {
        const stored = localStorage.getItem(CURRENT_USER_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === 'object' && parsed.role && parsed.name) {
                    return parsed;
                }
            }
            catch (_) { }
        }
        return defaultUser();
    },
    setCurrentUser(user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    },
    async loadAuthenticatedProfile() {
        if (!isSupabaseConfigured || !supabase)
            return this.getCurrentUser();
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (!user)
            return null;
        let { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
        if (error)
            throw error;
        if (!profile) {
            const fallbackName = user.user_metadata?.name || user.email?.split('@')[0] || 'Syskode User';
            const inserted = await supabase
                .from('profiles')
                .insert({
                user_id: user.id,
                name: fallbackName,
                email: user.email || `${user.id}@local.invalid`,
                role: 'Sales'
            })
                .select('*')
                .single();
            if (inserted.error)
                throw inserted.error;
            profile = inserted.data;
        }
        const mapped = mapProfile(profile);
        if (mapped.status === 'Inactive') {
            await supabase.auth.signOut();
            throw new Error('This employee account is inactive. Contact an administrator.');
        }
        this.setCurrentUser(mapped);
        return mapped;
    },
    switchRole(role) {
        const existing = this.getCurrentUser();
        // In live Supabase mode, roles come from the database/profile and cannot be
        // escalated from the browser UI. Role switching remains available only in local development mode.
        if (isSupabaseConfigured)
            return existing;
        const updated = { ...existing, role };
        this.setCurrentUser(updated);
        return updated;
    },
    async login(email, password) {
        if (isSupabaseConfigured && supabase) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error)
                throw error;
            const profile = await this.loadAuthenticatedProfile();
            if (!profile)
                throw new Error('Unable to load user profile after login.');
            return profile;
        }
        const user = { id: `local-${Date.now()}`, name: email.split('@')[0] || 'Local User', email, role: 'Admin', department: 'Development' };
        this.setCurrentUser(user);
        return user;
    },
    async logout() {
        if (isSupabaseConfigured && supabase) {
            await supabase.auth.signOut();
        }
        localStorage.removeItem(CURRENT_USER_KEY);
    },
    getAllProfiles() {
        const cached = localStorage.getItem('syskode_profiles_cache');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed))
                    return parsed;
            }
            catch (_) { }
        }
        return [];
    },
    cacheProfiles(profiles) {
        localStorage.setItem('syskode_profiles_cache', JSON.stringify(profiles));
    },
    async getAccessToken() {
        if (!isSupabaseConfigured || !supabase)
            return null;
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || null;
    }
};
