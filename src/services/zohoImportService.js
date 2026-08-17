import { databaseService, createDatabaseId } from './databaseService';
import { isSupabaseConfigured, supabase } from './supabaseClient';
const clean = (value) => value == null ? '' : String(value).trim();
const parseBoolean = (value) => ['true', 'yes', '1'].includes(clean(value).toLowerCase());
function asDateOnly(value) {
    const match = clean(value).match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : null;
}
function asTimestamp(value) {
    const raw = clean(value);
    if (!raw)
        return null;
    // Keep the Zoho exported timestamp shape; Postgres will cast it to timestamptz.
    return raw.replace(' ', 'T');
}
function mapStatus(zohoStatus, isConverted) {
    if (isConverted)
        return 'Won';
    const status = clean(zohoStatus).toLowerCase();
    if (!status || status === 'not contacted' || status === 'new')
        return 'New Lead';
    if (status === 'contacted')
        return 'Contacted';
    if (status === 'attempted to contact' || status === 'contact in future')
        return 'Follow-up Required';
    if (status === 'pre-qualified' || status === 'qualified')
        return 'Requirement Gathering';
    if (status.includes('meeting'))
        return 'Meeting Scheduled';
    if (status.includes('proposal'))
        return 'Proposal Sent';
    if (status.includes('negotiat'))
        return 'Negotiation';
    if (status === 'lost lead' || status === 'junk lead' || status === 'unqualified')
        return 'Lost';
    if (status === 'on hold')
        return 'On Hold';
    return 'New Lead';
}
function mapPriority(rating) {
    const value = clean(rating).toLowerCase();
    if (value === 'hot')
        return 'High';
    if (value === 'cold')
        return 'Low';
    if (value === 'critical')
        return 'Critical';
    return 'Medium';
}
function isSampleLead(row) {
    const text = `${clean(row['Lead Name'])} ${clean(row['First Name'])} ${clean(row['Last Name'])}`;
    return /\(sample\)/i.test(text);
}
export function parseCsv(text) {
    const input = text.replace(/^\uFEFF/, '');
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        const next = input[i + 1];
        if (char === '"') {
            if (inQuotes && next === '"') {
                field += '"';
                i++;
            }
            else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (char === ',' && !inQuotes) {
            row.push(field);
            field = '';
            continue;
        }
        if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && next === '\n')
                i++;
            row.push(field);
            field = '';
            if (row.some(cell => cell.trim() !== ''))
                rows.push(row);
            row = [];
            continue;
        }
        field += char;
    }
    if (field.length || row.length) {
        row.push(field);
        if (row.some(cell => cell.trim() !== ''))
            rows.push(row);
    }
    if (rows.length < 2)
        return [];
    const headers = rows[0].map(clean);
    return rows.slice(1).map(values => {
        const result = {};
        headers.forEach((header, index) => result[header] = clean(values[index] ?? ''));
        return result;
    });
}
export function previewZohoLeads(csvText, skipSamples = true) {
    const parsed = parseCsv(csvText);
    let sampleRows = 0;
    let invalidRows = 0;
    const rows = [];
    for (const row of parsed) {
        const sample = isSampleLead(row);
        if (sample)
            sampleRows++;
        const recordId = clean(row['Record Id']);
        const leadName = clean(row['Lead Name']) || `${clean(row['First Name'])} ${clean(row['Last Name'])}`.trim();
        if (!recordId || !leadName) {
            invalidRows++;
            continue;
        }
        if (skipSamples && sample)
            continue;
        rows.push({
            recordId,
            leadName,
            company: clean(row['Company']),
            owner: clean(row['Lead Owner']),
            zohoStatus: clean(row['Lead Status']),
            mappedStatus: mapStatus(row['Lead Status'], parseBoolean(row['Is Converted'])),
            email: clean(row['Email']),
            phone: clean(row['Phone']) || clean(row['Mobile']),
            isSample: sample,
        });
    }
    return {
        totalRows: parsed.length,
        importableRows: rows.length,
        sampleRows,
        invalidRows,
        rows: rows.slice(0, 12),
    };
}
function contactPerson(row) {
    return `${clean(row['First Name'])} ${clean(row['Last Name'])}`.trim()
        || clean(row['Lead Name'])
        || clean(row['Company'])
        || 'Unknown Contact';
}
function notes(row) {
    return [
        clean(row['Description']),
        clean(row['Title']) ? `Contact title: ${clean(row['Title'])}` : '',
        clean(row['Website']) ? `Website: ${clean(row['Website'])}` : '',
        'Imported from Zoho CRM',
    ].filter(Boolean).join('\n');
}
function internalLeadId(id) {
    return `SYS-LD-${new Date().getFullYear()}-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}
async function existingZohoLeads(recordIds) {
    const result = new Map();
    if (!supabase)
        return result;
    for (let i = 0; i < recordIds.length; i += 150) {
        const { data, error } = await supabase
            .from('leads')
            .select('id, lead_id, zoho_record_id')
            .in('zoho_record_id', recordIds.slice(i, i + 150));
        if (error)
            throw new Error(error.message);
        for (const row of data || []) {
            if (row.zoho_record_id)
                result.set(row.zoho_record_id, { id: row.id, lead_id: row.lead_id });
        }
    }
    return result;
}
export async function importZohoLeads(csvText, options = {}) {
    if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase is not configured. Zoho import works only in live database mode.');
    }
    const skipSamples = options.skipSamples ?? true;
    const parsed = parseCsv(csvText);
    const importRows = parsed.filter(row => {
        if (skipSamples && isSampleLead(row))
            return false;
        const recordId = clean(row['Record Id']);
        const leadName = clean(row['Lead Name']) || `${clean(row['First Name'])} ${clean(row['Last Name'])}`.trim();
        return Boolean(recordId && leadName);
    });
    const skipped = parsed.length - importRows.length;
    const existing = await existingZohoLeads([...new Set(importRows.map(row => clean(row['Record Id'])))]);
    const prepared = importRows.map(row => {
        const zohoRecordId = clean(row['Record Id']);
        const old = existing.get(zohoRecordId);
        const id = old?.id || createDatabaseId();
        const createdDate = asDateOnly(row['Created Time']) || new Date().toISOString().slice(0, 10);
        const lastContactedDate = asDateOnly(row['Last Activity Time']) || asDateOnly(row['Modified Time']) || createdDate;
        const leadName = clean(row['Lead Name']) || contactPerson(row);
        return {
            existed: Boolean(old),
            lead: {
                id,
                lead_id: old?.lead_id || internalLeadId(id),
                lead_name: leadName,
                company_name: clean(row['Company']) || leadName,
                contact_person: contactPerson(row),
                email: clean(row['Email']),
                phone: clean(row['Phone']) || clean(row['Mobile']),
                whatsapp: clean(row['Mobile']) || clean(row['Phone']) || null,
                country: clean(row['Country']) || 'Bahrain',
                lead_source: clean(row['Lead Source']) || 'Zoho CRM Import',
                industry: clean(row['Industry']),
                service_interested: 'Not Specified',
                estimated_project_value: 0,
                currency: 'BHD',
                assigned_salesperson: clean(row['Lead Owner']) || 'Unassigned',
                created_date: createdDate,
                last_contacted_date: lastContactedDate,
                next_follow_up_date: null,
                priority: mapPriority(row['Rating']),
                status: mapStatus(row['Lead Status'], parseBoolean(row['Is Converted'])),
                custom_status: clean(row['Lead Status']) || 'Imported from Zoho CRM',
                notes: notes(row),
                zoho_record_id: zohoRecordId,
                zoho_created_time: asTimestamp(row['Created Time']),
                zoho_modified_time: asTimestamp(row['Modified Time']),
                updated_at: new Date().toISOString(),
            },
            raw: {
                zoho_record_id: zohoRecordId,
                lead_id: id,
                raw: row,
                updated_at: new Date().toISOString(),
            },
        };
    });
    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors = [];
    for (let i = 0; i < prepared.length; i += 100) {
        const batch = prepared.slice(i, i + 100);
        const { error: leadError } = await supabase
            .from('leads')
            .upsert(batch.map(item => item.lead), { onConflict: 'zoho_record_id' });
        if (leadError) {
            failed += batch.length;
            errors.push(`Lead rows ${i + 1}-${i + batch.length}: ${leadError.message}`);
            continue;
        }
        const { error: rawError } = await supabase
            .from('zoho_lead_raw')
            .upsert(batch.map(item => item.raw), { onConflict: 'zoho_record_id' });
        if (rawError) {
            // Leads are still imported; only the full raw Zoho payload failed to archive.
            errors.push(`Raw Zoho archive ${i + 1}-${i + batch.length}: ${rawError.message}`);
        }
        created += batch.filter(item => !item.existed).length;
        updated += batch.filter(item => item.existed).length;
    }
    await databaseService.refresh();
    return { created, updated, skipped, failed, errors };
}
