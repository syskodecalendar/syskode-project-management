import React, { useState } from 'react';
import { BookOpenCheck, Building2, Database, FileSpreadsheet, LogOut, ShieldCheck, Users } from 'lucide-react';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { databaseService } from '../../services/databaseService';
import { authService } from '../../services/authService';
import { hasPermission } from '../../services/permissionService';
import { EmployeeManagement } from './EmployeeManagement';
import { ZohoLeadImport } from './ZohoLeadImport';
import { ZohoBooksIntegration } from './ZohoBooksIntegration';
export const SettingsView = ({ currentUser, onDataChanged }) => {
    const live = isSupabaseConfigured;
    const initialTab = new URLSearchParams(window.location.search).has('zoho_books') ? 'books' : 'organization';
    const [tab, setTab] = useState(initialTab);
    const canManageUsers = hasPermission(currentUser, 'manage_users');
    const canImportLeads = hasPermission(currentUser, 'manage_leads');
    const canManageBooks = currentUser.role === 'Admin' || hasPermission(currentUser, 'manage_settings') || hasPermission(currentUser, 'manage_users');
    return <div className="space-y-5">
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-bold text-slate-900">Syskode Hub Settings</h2>
      <p className="mt-1 text-xs text-slate-600">Organization defaults, database status, employee accounts, roles and granular permissions.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button onClick={() => setTab('organization')} className={`w-full sm:w-auto rounded-lg px-3 py-2 text-xs font-bold ${tab === 'organization' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}><Building2 className="mr-1 inline h-4 w-4"/>Organization</button>
        {canManageUsers && <button onClick={() => setTab('employees')} className={`w-full sm:w-auto rounded-lg px-3 py-2 text-xs font-bold ${tab === 'employees' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}><Users className="mr-1 inline h-4 w-4"/>Employees & Permissions</button>}
        {canImportLeads && <button onClick={() => setTab('zoho')} className={`w-full sm:w-auto rounded-lg px-3 py-2 text-xs font-bold ${tab === 'zoho' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}><FileSpreadsheet className="mr-1 inline h-4 w-4"/>Zoho CRM Import</button>}
        {canManageBooks && <button onClick={() => setTab('books')} className={`w-full sm:w-auto rounded-lg px-3 py-2 text-xs font-bold ${tab === 'books' ? 'bg-[#0a2038] text-white' : 'bg-slate-100 text-slate-700'}`}><BookOpenCheck className="mr-1 inline h-4 w-4"/>Zoho Books</button>}
      </div>
    </div>

    {tab === 'organization' && <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 text-xs text-slate-800">
          <h3 className="flex items-center text-sm font-bold text-slate-900"><Building2 className="mr-1.5 h-4 w-4 text-blue-600"/> Organization Profile</h3>
          <p>Company Name: <strong>Syskode Technologies W.L.L.</strong></p><p>Country / Currency: <strong>Kingdom of Bahrain (BHD)</strong></p><p>Standard VAT Rate: <strong>10%</strong></p>
        </div>
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 text-xs text-slate-800">
          <h3 className="flex items-center text-sm font-bold text-slate-900"><Database className="mr-1.5 h-4 w-4 text-emerald-600"/> Database & Storage Status</h3>
          <p>Database Engine: <strong>{live ? 'Supabase PostgreSQL (Live)' : 'Local Browser Storage (no seeded data)'}</strong></p>
          <p>Database Initialization: <strong className={databaseService.isInitialized() ? 'text-emerald-600' : 'text-amber-600'}>{databaseService.isInitialized() ? 'Connected' : 'Not initialized'}</strong></p>
          <p>File Storage: <strong>{live ? 'Supabase Storage (Private Buckets)' : 'Local files are not persisted to cloud storage'}</strong></p>
          <p>Authentication: <strong>{live ? 'Supabase Auth + granular RLS' : 'Local development authentication'}</strong></p>
          {databaseService.getLastError() && <p className="text-rose-600">Last sync error: {databaseService.getLastError()}</p>}
        </div>
      </div>
      {live && <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 text-slate-800 sm:flex-row sm:items-center"><div><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><ShieldCheck className="h-4 w-4 text-emerald-500"/> Secure Session</h3><p className="mt-1 text-xs text-slate-600">Signed in as {currentUser.name} ({currentUser.role}). Database policies enforce assigned permissions.</p></div><button onClick={() => authService.logout()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold sm:w-auto"><LogOut className="h-4 w-4"/>Sign out</button></div>}
    </>}

    {tab === 'employees' && canManageUsers && <EmployeeManagement currentUser={currentUser}/>}
    {tab === 'zoho' && canImportLeads && <ZohoLeadImport onImported={onDataChanged}/>}
    {tab === 'books' && canManageBooks && <ZohoBooksIntegration />}
  </div>;
};
