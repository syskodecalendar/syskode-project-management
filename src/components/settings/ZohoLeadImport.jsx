import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, RefreshCw, UploadCloud } from 'lucide-react';
import { importZohoLeads, previewZohoLeads, } from '../../services/zohoImportService';
export const ZohoLeadImport = ({ onImported }) => {
    const [fileName, setFileName] = useState('');
    const [csvText, setCsvText] = useState('');
    const [skipSamples, setSkipSamples] = useState(true);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const canImport = useMemo(() => Boolean(csvText && preview && preview.importableRows > 0), [csvText, preview]);
    const updatePreview = (text, skip) => {
        try {
            setPreview(previewZohoLeads(text, skip));
            setError('');
        }
        catch (e) {
            setPreview(null);
            setError(e?.message || 'Unable to parse CSV.');
        }
    };
    const chooseFile = async (file) => {
        if (!file)
            return;
        const text = await file.text();
        setFileName(file.name);
        setCsvText(text);
        setResult(null);
        updatePreview(text, skipSamples);
    };
    const changeSkipSamples = (checked) => {
        setSkipSamples(checked);
        if (csvText)
            updatePreview(csvText, checked);
    };
    const runImport = async () => {
        if (!canImport)
            return;
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const response = await importZohoLeads(csvText, { skipSamples });
            setResult(response);
            onImported?.();
        }
        catch (e) {
            setError(e?.message || 'Zoho import failed.');
        }
        finally {
            setLoading(false);
        }
    };
    return <div className="space-y-5">
    <section className="rounded-xl border border-slate-200 bg-white p-5 text-slate-900">
      <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
        <FileSpreadsheet className="h-5 w-5 text-emerald-600"/> Zoho CRM Leads Import
      </h3>
      <p className="mt-1 text-xs text-slate-600">
        Upload the Leads CSV exported from Zoho CRM. Zoho Record Id is used for duplicate detection, so importing the file again updates existing Zoho leads.
      </p>

      <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center hover:border-blue-400">
        <UploadCloud className="h-8 w-8 text-blue-600"/>
        <span className="mt-2 text-sm font-bold text-slate-900">Choose Zoho Leads CSV</span>
        <span className="mt-1 text-xs text-slate-600">{fileName || 'Select .csv file'}</span>
        <input type="file" accept=".csv,text/csv" className="hidden" onChange={e => chooseFile(e.target.files?.[0])}/>
      </label>

      <label className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-800">
        <input type="checkbox" checked={skipSamples} onChange={e => changeSkipSamples(e.target.checked)} className="h-4 w-4 rounded border-slate-300"/>
        Skip Zoho sample leads containing “(Sample)”
      </label>
    </section>

    {preview && <section className="rounded-xl border border-slate-200 bg-white p-5 text-slate-900">
      <h3 className="text-sm font-bold text-slate-900">Preview</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="CSV rows" value={preview.totalRows}/>
        <Stat label="Ready" value={preview.importableRows}/>
        <Stat label="Samples" value={preview.sampleRows}/>
        <Stat label="Invalid" value={preview.invalidRows}/>
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[820px] text-left text-xs text-slate-800">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-3 py-2">Lead</th>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2">Zoho Status</th>
              <th className="px-3 py-2">Hub Status</th>
              <th className="px-3 py-2">Contact</th>
            </tr>
          </thead>
          <tbody>
            {preview.rows.map(row => <tr key={row.recordId} className="border-t border-slate-200 bg-white">
              <td className="px-3 py-2 font-semibold text-slate-900">{row.leadName}</td>
              <td className="px-3 py-2">{row.company || '—'}</td>
              <td className="px-3 py-2">{row.owner || 'Unassigned'}</td>
              <td className="px-3 py-2">{row.zohoStatus || '—'}</td>
              <td className="px-3 py-2 font-semibold text-blue-700">{row.mappedStatus}</td>
              <td className="px-3 py-2">{row.email || row.phone || '—'}</td>
            </tr>)}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-600">
        Zoho Annual Revenue is <strong>not</strong> used as project value. Imported leads start with Service Interested = <strong>Not Specified</strong> and Estimated Project Value = <strong>0 BHD</strong>. The complete Zoho row is archived separately in Supabase.
      </p>

      <div className="mt-4 flex justify-end">
        <button type="button" disabled={!canImport || loading} onClick={runImport} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin"/> : <UploadCloud className="h-4 w-4"/>}
          {loading ? 'Importing…' : `Import ${preview.importableRows} Leads`}
        </button>
      </div>
    </section>}

    {result && <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
      <h3 className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="h-5 w-5"/> Import completed</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Created" value={result.created}/>
        <Stat label="Updated" value={result.updated}/>
        <Stat label="Skipped" value={result.skipped}/>
        <Stat label="Failed" value={result.failed}/>
      </div>
      {result.errors.length > 0 && <div className="mt-3 text-xs">{result.errors.map(x => <p key={x}>{x}</p>)}</div>}
    </section>}

    {error && <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
      <AlertTriangle className="h-4 w-4 shrink-0"/> {error}
    </div>}
  </div>;
};
const Stat = ({ label, value }) => <div className="rounded-lg border border-slate-200 bg-white p-3">
  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
  <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
</div>;
