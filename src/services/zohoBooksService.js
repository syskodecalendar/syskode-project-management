import { authService } from './authService';
async function api(path, init) {
    const token = await authService.getAccessToken();
    if (!token)
        throw new Error('You must be signed in.');
    const response = await fetch(path, {
        ...init,
        headers: {
            ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
            ...(init?.headers || {}),
            Authorization: `Bearer ${token}`,
        },
    });
    const data = await response.json();
    if (!response.ok)
        throw new Error(data.error || 'Zoho Books request failed.');
    return data;
}
export const zohoBooksService = {
    async getStatus() {
        return api('/api/zoho-books/status');
    },
    async connect() {
        const data = await api('/api/zoho-books/connect');
        if (!data.authorizationUrl)
            throw new Error('Zoho authorization URL was not returned.');
        window.location.assign(data.authorizationUrl);
    },
    async disconnect() {
        return api('/api/zoho-books/disconnect', { method: 'POST' });
    },
    async listItems() {
        const data = await api('/api/zoho-books/items');
        return Array.isArray(data.items) ? data.items : [];
    },
    async setDefaultItem(itemId) {
        return api('/api/zoho-books/default-item', {
            method: 'POST',
            body: JSON.stringify({ itemId }),
        });
    },
};
