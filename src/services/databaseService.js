import { isSupabaseConfigured, supabase } from './supabaseClient';
const SIMPLE_STORES = {
    syskode_leads_store: {
        table: 'leads',
        toDb: (row) => ({ ...camelToSnakeRecord(row), whatsapp: row.whatsApp ?? row.whatsapp ?? null, whats_app: undefined }),
        fromDb: (row) => ({ ...snakeToCamelRecord(row), whatsApp: row.whatsapp ?? row.whats_app ?? undefined })
    },
    syskode_meetings_store: { table: 'meetings' },
    syskode_projects_store: { table: 'projects' },
    syskode_project_status_logs_store: { table: 'project_status_logs' },
    syskode_members_store: { table: 'project_members' },
    syskode_matrix_store: { table: 'project_responsibilities' },
    syskode_tasks_store: { table: 'tasks' },
    syskode_credentials_store: { table: 'credentials' },
    syskode_domains_store: { table: 'domain_records' },
    syskode_hosting_store: { table: 'hosting_accounts' },
    syskode_ssl_store: { table: 'ssl_certificates' },
    syskode_repos_store: { table: 'repository_records' },
    syskode_deploys_store: { table: 'deployment_records' },
    syskode_qa_testcases_store: {
        table: 'test_cases',
        toDb: (row) => {
            const db = camelToSnakeRecord(row);
            db.assigned_qa = row.assignedQA ?? row.assignedQa ?? null;
            delete db.assigned_q_a;
            return db;
        },
        fromDb: (row) => {
            const item = snakeToCamelRecord(row);
            item.assignedQA = row.assigned_qa;
            delete item.assignedQa;
            return item;
        }
    },
    syskode_activities_store: {
        table: 'activities',
        toDb: (row) => {
            const db = camelToSnakeRecord(row);
            db.user_name = row.user;
            delete db.user;
            return db;
        },
        fromDb: (row) => {
            const item = snakeToCamelRecord(row);
            item.user = row.user_name;
            delete item.userName;
            return item;
        }
    },
    syskode_comments_store: { table: 'comments' },
    syskode_notifications_store: { table: 'notifications' },
    syskode_pricings_store: { table: 'syskode_pricings' },
    syskode_project_billing_store: { table: 'project_billing_milestones' }
};
const STORE_KEYS = [
    ...Object.keys(SIMPLE_STORES),
    'syskode_documents_store',
    'syskode_vendors_store',
    'syskode_company_settings_store'
];
const syncChains = new Map();
let lastError = null;
let initialized = false;
function camelToSnake(key) {
    return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
function snakeToCamel(key) {
    return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
function stripUndefined(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
}
function camelToSnakeRecord(row) {
    if (!row || typeof row !== 'object' || Array.isArray(row))
        return row;
    const out = {};
    for (const [key, value] of Object.entries(row)) {
        out[camelToSnake(key)] = value;
    }
    return stripUndefined(out);
}
function snakeToCamelRecord(row) {
    if (!row || typeof row !== 'object' || Array.isArray(row))
        return row;
    const out = {};
    for (const [key, value] of Object.entries(row)) {
        if (key === 'created_at' || key === 'updated_at')
            continue;
        out[snakeToCamel(key)] = value;
    }
    return out;
}
async function fetchTable(table) {
    if (!supabase)
        return [];
    const { data, error } = await supabase.from(table).select('*');
    if (error)
        throw new Error(`${table}: ${error.message}`);
    return data || [];
}
async function exactSync(table, rows) {
    if (!supabase)
        return;
    const cleanRows = rows.map(stripUndefined);
    if (cleanRows.length === 0)
        return;
    const { error } = await supabase.from(table).upsert(cleanRows, { onConflict: 'id' });
    if (error)
        throw new Error(`${table} upsert: ${error.message}`);
}
async function hydrateSimpleStore(storeKey) {
    const config = SIMPLE_STORES[storeKey];
    const rows = await fetchTable(config.table);
    const mapped = rows.map(config.fromDb || snakeToCamelRecord);
    localStorage.setItem(storeKey, JSON.stringify(mapped));
}
async function hydrateDocuments() {
    const [documents, versions, sourceFiles] = await Promise.all([
        fetchTable('proposal_documents'),
        fetchTable('document_versions'),
        fetchTable('proposal_source_files').catch(() => [])
    ]);
    const mappedVersions = versions.map(snakeToCamelRecord);
    const mappedSources = sourceFiles.map(snakeToCamelRecord);
    const result = documents.map((doc) => {
        const mapped = snakeToCamelRecord(doc);
        mapped.versions = mappedVersions
            .filter((v) => v.proposalDocumentId === doc.id)
            .map(({ proposalDocumentId, ...v }) => v);
        mapped.sourceFiles = mappedSources
            .filter((v) => v.proposalDocumentId === doc.id)
            .map(({ proposalDocumentId, ...v }) => v);
        mapped.builderSections = Array.isArray(mapped.builderSections) ? mapped.builderSections : [];
        return mapped;
    });
    localStorage.setItem('syskode_documents_store', JSON.stringify(result));
}
async function hydrateVendors() {
    const [vendors, pricings, proposals] = await Promise.all([
        fetchTable('vendors'),
        fetchTable('vendor_pricings'),
        fetchTable('vendor_proposals')
    ]);
    const mappedPricings = pricings.map(snakeToCamelRecord);
    const mappedProposals = proposals.map(snakeToCamelRecord);
    const result = vendors.map((vendor) => {
        const mapped = snakeToCamelRecord(vendor);
        mapped.pricings = mappedPricings
            .filter((p) => p.vendorId === vendor.id)
            .map(({ vendorId, ...p }) => p);
        mapped.proposals = mappedProposals
            .filter((p) => p.vendorId === vendor.id)
            .map(({ vendorId, ...p }) => p);
        return mapped;
    });
    localStorage.setItem('syskode_vendors_store', JSON.stringify(result));
}
async function hydrateProfilesCache() {
    const rows = await fetchTable('profiles');
    const mapped = rows.map(snakeToCamelRecord).map((row) => ({
        ...row,
        avatar: row.avatarUrl || undefined,
        status: row.status || 'Active',
        permissions: Array.isArray(row.permissions) ? row.permissions : []
    }));
    localStorage.setItem('syskode_profiles_cache', JSON.stringify(mapped));
}
async function hydrateSettings() {
    if (!supabase)
        return;
    const { data, error } = await supabase
        .from('company_settings')
        .select('settings_json')
        .eq('id', 'default')
        .maybeSingle();
    if (error)
        throw new Error(`company_settings: ${error.message}`);
    if (data?.settings_json) {
        localStorage.setItem('syskode_company_settings_store', JSON.stringify(data.settings_json));
    }
    else {
        localStorage.removeItem('syskode_company_settings_store');
    }
}
async function syncDocuments(data) {
    const docs = (data || []).map((doc) => {
        const { versions: _versions, sourceFiles: _sourceFiles, ...base } = doc;
        return camelToSnakeRecord(base);
    });
    const versions = (data || []).flatMap((doc) => (doc.versions || []).map((version) => ({
        ...camelToSnakeRecord(version),
        proposal_document_id: doc.id
    })));
    const sources = (data || []).flatMap((doc) => (doc.sourceFiles || []).map((source) => ({
        ...camelToSnakeRecord(source),
        proposal_document_id: doc.id
    })));
    await exactSync('proposal_documents', docs);
    await exactSync('document_versions', versions);
    if (sources.length)
        await exactSync('proposal_source_files', sources);
}
async function syncVendors(data) {
    const vendors = (data || []).map((vendor) => {
        const { proposals: _proposals, pricings: _pricings, ...base } = vendor;
        return camelToSnakeRecord(base);
    });
    const pricings = (data || []).flatMap((vendor) => (vendor.pricings || []).map((pricing) => ({
        ...camelToSnakeRecord(pricing),
        vendor_id: vendor.id
    })));
    const proposals = (data || []).flatMap((vendor) => (vendor.proposals || []).map((proposal) => ({
        ...camelToSnakeRecord(proposal),
        vendor_id: vendor.id
    })));
    await exactSync('vendors', vendors);
    await exactSync('vendor_pricings', pricings);
    await exactSync('vendor_proposals', proposals);
}
async function syncSettings(data) {
    if (!supabase)
        return;
    const { error } = await supabase.from('company_settings').upsert({
        id: 'default',
        settings_json: data,
        updated_at: new Date().toISOString()
    });
    if (error)
        throw new Error(`company_settings upsert: ${error.message}`);
}
async function syncStore(storeKey, data) {
    if (!isSupabaseConfigured || !supabase)
        return;
    const config = SIMPLE_STORES[storeKey];
    if (config) {
        const rows = Array.isArray(data) ? data : [];
        const mapped = rows.map(config.toDb || camelToSnakeRecord);
        await exactSync(config.table, mapped);
        return;
    }
    if (storeKey === 'syskode_documents_store')
        return syncDocuments(data || []);
    if (storeKey === 'syskode_vendors_store')
        return syncVendors(data || []);
    if (storeKey === 'syskode_company_settings_store')
        return syncSettings(data);
}
export const databaseService = {
    get mode() {
        return isSupabaseConfigured ? 'supabase' : 'local';
    },
    isConfigured() {
        return isSupabaseConfigured;
    },
    isInitialized() {
        return initialized;
    },
    getLastError() {
        return lastError;
    },
    async initialize() {
        if (!isSupabaseConfigured || !supabase) {
            initialized = true;
            return;
        }
        lastError = null;
        try {
            await Promise.all(Object.keys(SIMPLE_STORES).map(hydrateSimpleStore));
            await Promise.all([hydrateDocuments(), hydrateVendors(), hydrateSettings(), hydrateProfilesCache()]);
            initialized = true;
        }
        catch (error) {
            lastError = error?.message || String(error);
            initialized = false;
            throw error;
        }
    },
    queueSync(storeKey, data) {
        if (!isSupabaseConfigured || !supabase || !STORE_KEYS.includes(storeKey))
            return;
        const chainKey = '__global__';
        const previous = syncChains.get(chainKey) || Promise.resolve();
        const next = previous
            .catch(() => undefined)
            .then(() => syncStore(storeKey, data))
            .catch((error) => {
            lastError = error?.message || String(error);
            console.error(`[Database sync failed] ${storeKey}`, error);
        });
        syncChains.set(chainKey, next);
    },
    queueDelete(table, id) {
        if (!isSupabaseConfigured || !supabase || !id)
            return;
        const key = '__global__';
        const previous = syncChains.get(key) || Promise.resolve();
        const next = previous.catch(() => undefined).then(async () => {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error)
                throw error;
        }).catch((error) => {
            lastError = error?.message || String(error);
            console.error(`[Database delete failed] ${table}/${id}`, error);
        });
        syncChains.set(key, next);
    },
    async flush() {
        await Promise.all([...syncChains.values()]);
    },
    async refresh() {
        await this.initialize();
    }
};
export function createDatabaseId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
