import React, { useEffect, useState } from 'react';
import { BookOpenCheck, ExternalLink, Link2, Loader2, RefreshCw, ShieldCheck, Unplug, Save } from 'lucide-react';
import { zohoBooksService } from '../../services/zohoBooksService';
const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';
export const ZohoBooksIntegration = () => {
    const [status, setStatus] = useState({ connected: false });
    const [items, setItems] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState('');
    const [loading, setLoading] = useState(true);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const loadItems = async (connectionStatus) => {
        const activeStatus = connectionStatus || status;
        if (!activeStatus.connected) {
            setItems([]);
            return;
        }
        setItemsLoading(true);
        try {
            const list = await zohoBooksService.listItems();
            setItems(list);
            setSelectedItemId(activeStatus.defaultItemId || list[0]?.itemId || '');
        }
        catch (error) {
            setMessage(error?.message || 'Unable to load Zoho Books items.');
        }
        finally {
            setItemsLoading(false);
        }
    };
    const load = async () => {
        setLoading(true);
        try {
            const next = await zohoBooksService.getStatus();
            setStatus(next);
            await loadItems(next);
        }
        catch (error) {
            setMessage(error?.message || 'Unable to load Zoho Books status.');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);
    const connect = async () => {
        setBusy(true);
        setMessage('');
        try {
            await zohoBooksService.connect();
        }
        catch (error) {
            setMessage(error?.message || 'Unable to connect Zoho Books.');
            setBusy(false);
        }
    };
    const disconnect = async () => {
        if (!window.confirm('Disconnect Zoho Books from Syskode Project Hub? Existing invoice references will remain in projects.'))
            return;
        setBusy(true);
        try {
            await zohoBooksService.disconnect();
            setStatus({ connected: false });
            setItems([]);
            setSelectedItemId('');
            setMessage('Zoho Books disconnected.');
        }
        catch (error) {
            setMessage(error?.message || 'Unable to disconnect Zoho Books.');
        }
        finally {
            setBusy(false);
        }
    };
    const saveDefaultItem = async () => {
        if (!selectedItemId) {
            setMessage('Choose the Zoho Books service item that should be used for project invoices.');
            return;
        }
        setBusy(true);
        setMessage('');
        try {
            const result = await zohoBooksService.setDefaultItem(selectedItemId);
            const item = result.item;
            setStatus(prev => ({ ...prev, defaultItemId: item?.itemId || selectedItemId, defaultItemName: item?.name }));
            setMessage(`Default invoice item saved: ${item?.name || 'Zoho Books service item'}.`);
        }
        catch (error) {
            setMessage(error?.message || 'Unable to save the default item.');
        }
        finally {
            setBusy(false);
        }
    };
    return <div className="space-y-5">
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-[#0a2038] px-5 py-5 text-white sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2"><BookOpenCheck className="h-5 w-5 text-blue-300"/><h3 className="text-lg font-black">Zoho Books Integration</h3></div>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300">Generate percentage-based project invoices directly in your Zoho Books organization and keep invoiced, paid and pending percentages visible inside each project.</p>
          </div>
          <div className={`rounded-full px-3 py-1.5 text-[11px] font-black ${status.connected ? 'bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/30' : 'bg-white/10 text-slate-200 ring-1 ring-white/15'}`}>
            {loading ? 'Checking…' : status.connected ? 'Connected' : 'Not Connected'}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {loading ? <div className="flex items-center gap-2 text-xs text-slate-600"><Loader2 className="h-4 w-4 animate-spin"/>Loading connection…</div> : status.connected ? <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Organization</p><p className="mt-1 text-sm font-bold text-slate-900">{status.organizationName || 'Zoho Books'}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Organization ID</p><p className="mt-1 break-all font-mono text-xs font-bold text-slate-900">{status.organizationId || '—'}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Invoice Item</p><p className={`mt-1 text-xs font-bold ${status.defaultItemId ? 'text-emerald-700' : 'text-amber-700'}`}>{status.defaultItemName || 'Not selected yet'}</p></div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-black text-black">Default Zoho Books Item for Project Invoices</label>
                <p className="mb-2 text-[11px] leading-5 text-slate-700">Choose your normal Software Development / IT Services item. Each milestone invoice uses this Zoho Books item while overriding the rate with the milestone amount.</p>
                <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} disabled={itemsLoading} className={field}>
                  <option value="">{itemsLoading ? 'Loading items…' : 'Select a Zoho Books item'}</option>
                  {items.map(item => <option key={item.itemId} value={item.itemId}>{item.name}{item.rate ? ` — ${item.rate}` : ''}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button onClick={() => loadItems()} disabled={itemsLoading || busy} className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-xs font-bold text-blue-700 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${itemsLoading ? 'animate-spin' : ''}`}/>Refresh Items</button>
                <button onClick={saveDefaultItem} disabled={!selectedItemId || busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"><Save className="h-4 w-4"/>Save Invoice Item</button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={connect} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0a2038] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><RefreshCw className="h-4 w-4"/>Reconnect / Change Account</button>
            <button onClick={disconnect} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 disabled:opacity-50"><Unplug className="h-4 w-4"/>Disconnect</button>
          </div>
        </div> : <div className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-950">
            <p className="font-bold">Before connecting</p>
            <p className="mt-1">Create a Server-based application in the Zoho API Console and add the callback URL shown in your Render environment as <code className="rounded bg-white px-1 py-0.5">ZOHO_BOOKS_REDIRECT_URI</code>.</p>
          </div>
          <button onClick={connect} disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0a2038] px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50 sm:w-auto">{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <Link2 className="h-4 w-4"/>}Connect Zoho Books</button>
        </div>}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600"/><div><p className="text-xs font-bold text-slate-900">Secure OAuth tokens</p><p className="mt-1 text-[11px] leading-5 text-slate-600">Zoho access and refresh tokens stay on the Node server and are encrypted before storage. They are never exposed through VITE environment variables.</p></div></div></div>
          <div className="rounded-xl border border-slate-200 p-4"><div className="flex items-start gap-3"><ExternalLink className="mt-0.5 h-5 w-5 text-blue-600"/><div><p className="text-xs font-bold text-slate-900">Project billing</p><p className="mt-1 text-[11px] leading-5 text-slate-600">After connection, open a Project → Billing & Invoices to define 50/20/20/10 or any custom percentages and create the matching Zoho Books invoice.</p></div></div></div>
        </div>

        {message && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">{message}</div>}
      </div>
    </div>
  </div>;
};
