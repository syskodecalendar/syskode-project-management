import { activityService } from './activityService';
import { databaseService, createDatabaseId } from './databaseService';
import { storageService } from './storageService';
const STORAGE_KEY = 'syskode_documents_store';
function makeProposalNumber() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    return `SYS/PROP/${yy}/${suffix}`;
}
function normalizeDocument(doc) {
    const sourceType = doc.sourceType || (doc.builderSections?.length ? 'builder' : 'upload');
    return {
        ...doc,
        versions: Array.isArray(doc.versions) ? doc.versions : [],
        builderSections: Array.isArray(doc.builderSections) ? doc.builderSections : [],
        sourceFiles: Array.isArray(doc.sourceFiles) ? doc.sourceFiles.map(source => ({ ...source, sourceKind: source.sourceKind || 'vendor' })) : [],
        sourceType,
        proposalStatus: doc.proposalStatus || (sourceType === 'builder' ? 'Draft' : 'Ready'),
    };
}
function loadDocuments() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed))
                return parsed.map(normalizeDocument);
        }
        catch (_) { }
    }
    const initial = [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
}
function saveDocuments(docs) {
    const normalized = docs.map(normalizeDocument);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    databaseService.queueSync(STORAGE_KEY, normalized);
}
function deepCloneSections(sections) {
    return sections.map(section => ({
        ...section,
        id: createDatabaseId(),
        blocks: (section.blocks || []).map(block => ({ ...block, id: createDatabaseId() })),
    }));
}
export const documentService = {
    getDocuments() {
        return loadDocuments();
    },
    getDocumentById(id) {
        return loadDocuments().find(d => d.id === id);
    },
    getDocumentsByLead(leadId) {
        return loadDocuments().filter(d => d.leadId === leadId);
    },
    getBuilderDocuments() {
        return loadDocuments().filter(d => d.sourceType === 'builder');
    },
    createBuilderProposal(data) {
        const docs = loadDocuments();
        const proposal = {
            id: createDatabaseId(),
            leadId: data.leadId,
            documentName: data.documentName.trim() || 'Untitled Proposal',
            category: data.category,
            versions: [],
            sourceType: 'builder',
            proposalStatus: 'Draft',
            clientName: data.clientName,
            companyName: data.companyName,
            createdBy: data.createdBy,
            proposalNumber: makeProposalNumber(),
            proposalDate: new Date().toISOString().split('T')[0],
            preparedForLocation: 'Kingdom of Bahrain',
            builderSections: data.sections || [],
            sourceFiles: [],
        };
        docs.unshift(proposal);
        saveDocuments(docs);
        activityService.logActivity(data.createdBy, 'Proposal Created', 'proposal', proposal.id, `Created editable proposal "${proposal.documentName}"`);
        return proposal;
    },
    updateBuilderProposal(id, updates, changedBy = 'User') {
        const docs = loadDocuments();
        const idx = docs.findIndex(d => d.id === id);
        if (idx < 0)
            throw new Error('Proposal not found');
        docs[idx] = normalizeDocument({ ...docs[idx], ...updates, sourceType: 'builder' });
        saveDocuments(docs);
        activityService.logActivity(changedBy, 'Proposal Updated', 'proposal', id, `Updated editable proposal "${docs[idx].documentName}"`);
        return docs[idx];
    },
    cloneProposal(id, clonedBy = 'User') {
        const docs = loadDocuments();
        const source = docs.find(d => d.id === id);
        if (!source)
            throw new Error('Proposal not found');
        const clone = {
            ...source,
            id: createDatabaseId(),
            documentName: `${source.documentName} - Copy`,
            proposalStatus: 'Draft',
            currentVersionId: undefined,
            versions: [],
            sourceType: 'builder',
            createdBy: clonedBy,
            clonedFromId: source.id,
            builderSections: deepCloneSections(source.builderSections || []),
            sourceFiles: [],
        };
        docs.unshift(clone);
        saveDocuments(docs);
        activityService.logActivity(clonedBy, 'Proposal Cloned', 'proposal', clone.id, `Cloned "${source.documentName}"`);
        return clone;
    },
    copySections(sourceProposalId, targetProposalId, sectionIds, changedBy = 'User') {
        const docs = loadDocuments();
        const source = docs.find(d => d.id === sourceProposalId);
        const target = docs.find(d => d.id === targetProposalId);
        if (!source || !target)
            throw new Error('Source or target proposal not found');
        const selected = (source.builderSections || []).filter(section => sectionIds.includes(section.id));
        target.builderSections = [...(target.builderSections || []), ...deepCloneSections(selected)];
        target.sourceType = 'builder';
        saveDocuments(docs);
        activityService.logActivity(changedBy, 'Proposal Sections Copied', 'proposal', target.id, `Copied ${selected.length} section(s) from "${source.documentName}"`);
        return target;
    },
    async uploadProposal(leadId, documentName, category, file, uploadedBy, notes) {
        const docs = loadDocuments();
        let doc = docs.find(d => d.leadId === leadId && d.category === category && d.documentName === documentName && d.sourceType !== 'builder');
        const versionNum = doc ? doc.versions.length + 1 : 1;
        const versionStr = `V${versionNum}.0`;
        const storagePath = await storageService.upload('proposals', leadId, file);
        const newVersion = {
            id: createDatabaseId(),
            version: versionStr,
            fileName: file.name,
            fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            fileType: file.type || 'application/octet-stream',
            storagePath,
            uploadedBy,
            uploadedDate: new Date().toISOString().split('T')[0],
            notes,
            isCurrentVersion: true,
        };
        if (doc) {
            doc.versions.forEach(v => (v.isCurrentVersion = false));
            doc.versions.push(newVersion);
            doc.currentVersionId = newVersion.id;
        }
        else {
            doc = {
                id: createDatabaseId(),
                leadId,
                documentName,
                category,
                currentVersionId: newVersion.id,
                versions: [newVersion],
                sourceType: 'upload',
                proposalStatus: 'Ready',
                builderSections: [],
                sourceFiles: [],
            };
            docs.unshift(doc);
        }
        saveDocuments(docs);
        activityService.logActivity(uploadedBy, 'Proposal Uploaded', 'proposal', doc.id, `Uploaded proposal document "${documentName}" (${versionStr})`);
        return doc;
    },
    async uploadBuilderAsset(proposalId, file) {
        return storageService.upload('proposal-assets', proposalId, file);
    },
    async addVendorSourceFile(proposalId, vendorName, file, uploadedBy) {
        const docs = loadDocuments();
        const proposal = docs.find(d => d.id === proposalId);
        if (!proposal)
            throw new Error('Proposal not found');
        const storagePath = await storageService.upload('vendor-proposals', `ai-import/${proposalId}`, file);
        const source = {
            id: createDatabaseId(),
            vendorName: vendorName.trim() || 'Competitor',
            fileName: file.name,
            storagePath,
            mimeType: file.type || 'application/pdf',
            uploadedBy,
            uploadedDate: new Date().toISOString().split('T')[0],
            sourceKind: 'vendor',
        };
        proposal.sourceFiles = [...(proposal.sourceFiles || []), source];
        saveDocuments(docs);
        return source;
    },
    async addRfqSourceFile(proposalId, file, uploadedBy) {
        const docs = loadDocuments();
        const proposal = docs.find(d => d.id === proposalId);
        if (!proposal)
            throw new Error('Proposal not found');
        const storagePath = await storageService.upload('rfq-files', `rfq/${proposalId}`, file);
        const source = {
            id: createDatabaseId(),
            sourceKind: 'rfq',
            fileName: file.name,
            storagePath,
            mimeType: file.type || 'application/pdf',
            uploadedBy,
            uploadedDate: new Date().toISOString().split('T')[0],
        };
        proposal.sourceFiles = [...(proposal.sourceFiles || []), source];
        saveDocuments(docs);
        activityService.logActivity(uploadedBy, 'RFQ Uploaded', 'proposal', proposal.id, `Uploaded RFQ source "${file.name}"`);
        return source;
    },
    removeSourceFile(proposalId, sourceId) {
        const docs = loadDocuments();
        const proposal = docs.find(d => d.id === proposalId);
        if (!proposal)
            return;
        proposal.sourceFiles = (proposal.sourceFiles || []).filter(s => s.id !== sourceId);
        saveDocuments(docs);
        databaseService.queueDelete('proposal_source_files', sourceId);
    },
    async getAssetUrl(path) {
        if (!path)
            return null;
        return storageService.createSignedUrl('proposal-assets', path, 60 * 60);
    },
    async getDownloadUrl(version) {
        return storageService.createSignedUrl('proposals', version.storagePath, 60 * 10);
    },
    deleteDocument(documentId) {
        const docs = loadDocuments();
        const doc = docs.find(d => d.id === documentId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(docs.filter(d => d.id !== documentId)));
        databaseService.queueDelete('proposal_documents', documentId);
        if (doc)
            activityService.logActivity('User', 'Proposal Deleted', 'proposal', documentId, `Deleted proposal document "${doc.documentName}"`);
    },
    setCurrentVersion(documentId, versionId) {
        const docs = loadDocuments();
        const doc = docs.find(d => d.id === documentId);
        if (!doc)
            throw new Error('Document not found');
        doc.versions.forEach(v => { v.isCurrentVersion = v.id === versionId; });
        doc.currentVersionId = versionId;
        saveDocuments(docs);
        return doc;
    },
};
