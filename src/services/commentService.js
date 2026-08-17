const STORAGE_KEY = 'syskode_comments_store';
import { databaseService, createDatabaseId } from './databaseService';
function loadComments() {
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
function saveComments(comments) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    databaseService.queueSync(STORAGE_KEY, comments);
}
export const commentService = {
    getComments(relatedType, relatedId) {
        return loadComments().filter(c => c.relatedType === relatedType && c.relatedId === relatedId);
    },
    deleteComment(id) {
        const comments = loadComments().filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
        databaseService.queueDelete('comments', id);
    },
    addComment(relatedType, relatedId, userName, userRole, content) {
        const comments = loadComments();
        // Parse @mentions from content (e.g., @Jerin, @Fatima)
        const mentionsMatches = content.match(/@(\w+)/g);
        const mentions = mentionsMatches ? mentionsMatches.map(m => m.replace('@', '')) : [];
        const now = new Date();
        const createdAt = now.toISOString();
        const newComment = {
            id: createDatabaseId(),
            relatedType,
            relatedId,
            userName,
            userRole,
            content,
            createdAt,
            mentions
        };
        comments.unshift(newComment);
        saveComments(comments);
        return newComment;
    }
};
