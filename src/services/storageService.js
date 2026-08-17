import { isSupabaseConfigured, supabase } from './supabaseClient';
function sanitizeFileName(name) {
    return name.replace(/[^a-zA-Z0-9._-]+/g, '-');
}
export const storageService = {
    async upload(bucket, folder, file) {
        if (!isSupabaseConfigured || !supabase) {
            return `${bucket}/${folder}/${sanitizeFileName(file.name)}`;
        }
        const path = `${folder}/${Date.now()}-${sanitizeFileName(file.name)}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file, {
            upsert: false,
            contentType: file.type || undefined
        });
        if (error)
            throw error;
        return path;
    },
    async createSignedUrl(bucket, path, expiresIn = 3600) {
        if (!isSupabaseConfigured || !supabase)
            return null;
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
        if (error)
            throw error;
        return data.signedUrl;
    },
    async remove(bucket, paths) {
        if (!isSupabaseConfigured || !supabase || paths.length === 0)
            return;
        const { error } = await supabase.storage.from(bucket).remove(paths);
        if (error)
            throw error;
    }
};
