import React, { useEffect, useMemo, useState } from 'react';
import { KeyRound, Plus, RefreshCw, Save, Trash2, UserCog, X } from 'lucide-react';
import { employeeService } from '../../services/employeeService';
import { getDefaultPermissions, PERMISSION_GROUPS } from '../../services/permissionService';
import { excelExportService } from '../../services/excelExportService';
import { ExcelExportButton } from '../common/ExcelExportButton';
const roles = ['Admin', 'Management', 'Sales', 'Project Manager', 'Developer', 'QA'];
const field = 'mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none';
const label = 'block text-[11px] font-bold text-slate-900';
export const EmployeeManagement = ({ currentUser }) => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        name: '', email: '', password: '', role: 'Developer', department: 'Technology', status: 'Active',
        permissions: getDefaultPermissions('Developer'), permissionsCustomized: true
    });
    const load = async () => {
        setLoading(true);
        setError('');
        try {
            setEmployees(await employeeService.list());
        }
        catch (e) {
            setError(e?.message || 'Unable to load employees.');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);
    const permissionSet = useMemo(() => new Set(form.permissions || []), [form.permissions]);
    const setValue = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
    const togglePermission = (permission) => {
        const next = new Set(form.permissions || []);
        if (next.has(permission))
            next.delete(permission);
        else
            next.add(permission);
        setForm(prev => ({ ...prev, permissions: Array.from(next), permissionsCustomized: true }));
    };
    const reset = () => {
        setEditing(null);
        setForm({ name: '', email: '', password: '', role: 'Developer', department: 'Technology', status: 'Active', permissions: getDefaultPermissions('Developer'), permissionsCustomized: true });
    };
    const changeRole = (role) => {
        setForm(prev => ({ ...prev, role, permissions: getDefaultPermissions(role), permissionsCustomized: true }));
    };
    const edit = (u) => {
        setEditing(u);
        setForm({
            name: u.name, email: u.email, password: '', role: u.role, department: u.department || '', phone: u.phone || '',
            jobTitle: u.jobTitle || '', employeeCode: u.employeeCode || '', status: u.status || 'Active',
            permissions: u.permissionsCustomized ? (u.permissions || []) : getDefaultPermissions(u.role), permissionsCustomized: true
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            if (editing) {
                const payload = { ...form };
                if (!payload.password)
                    delete payload.password;
                await employeeService.update(editing.id, payload);
                setSuccess(`${form.name} updated.`);
            }
            else {
                if (!form.password || form.password.length < 8)
                    throw new Error('Enter a temporary password with at least 8 characters.');
                await employeeService.create(form);
                setSuccess(`${form.name} created. The account is already email-confirmed and can sign in immediately.`);
            }
            reset();
            await load();
        }
        catch (e) {
            setError(e?.message || 'Unable to save employee.');
        }
        finally {
            setLoading(false);
        }
    };
    const remove = async (u) => {
        if (u.id === currentUser.id) {
            setError('You cannot delete the account you are currently using.');
            return;
        }
        if (!window.confirm(`Delete employee ${u.name} (${u.email})? Their login will also be removed from Supabase Auth.`))
            return;
        setLoading(true);
        setError('');
        try {
            await employeeService.remove(u.id);
            setSuccess(`${u.name} deleted.`);
            await load();
        }
        catch (e) {
            setError(e?.message || 'Unable to delete employee.');
        }
        finally {
            setLoading(false);
        }
    };
    return <div className="space-y-5">
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="flex items-center gap-2 text-base font-bold text-slate-900"><UserCog className="h-5 w-5 text-[#00AEEF]"/>Employees, Roles & Permissions</h3><p className="mt-1 text-xs text-slate-600">Create real Supabase login accounts. New users are confirmed immediately; no verification email is required.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row"><ExcelExportButton label="Export Employees" onClick={() => excelExportService.exportRows(`syskode-employees-${new Date().toISOString().slice(0, 10)}`, 'Employees', employees.map(u => ({ Employee_Code: u.employeeCode || '', Name: u.name || '', Email: u.email || '', Phone: u.phone || '', Role: u.role || '', Department: u.department || '', Job_Title: u.jobTitle || '', Status: u.status || 'Active', Permission_Count: u.role === 'Admin' ? 'Full access' : (u.permissionsCustomized ? u.permissions : getDefaultPermissions(u.role))?.length || 0 })))}/><button type="button" onClick={load} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#b9d8e8] bg-white px-3 py-2 text-xs font-bold text-[#071A35] hover:bg-[#f4f9fc] sm:w-auto"><RefreshCw className="h-4 w-4"/>Refresh Users</button></div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className={label}>Full Name *<input required className={field} value={form.name} onChange={e => setValue('name', e.target.value)}/></label>
          <label className={label}>Email *<input required type="email" className={field} value={form.email} onChange={e => setValue('email', e.target.value)}/></label>
          <label className={label}>{editing ? 'New Password (optional)' : 'Temporary Password *'}<input type="password" required={!editing} minLength={editing ? 0 : 8} className={field} value={form.password || ''} onChange={e => setValue('password', e.target.value)} placeholder={editing ? 'Leave blank to keep current password' : 'Minimum 8 characters'}/></label>
          <label className={label}>Role<select className={field} value={form.role} onChange={e => changeRole(e.target.value)}>{roles.map(r => <option key={r}>{r}</option>)}</select></label>
          <label className={label}>Department<input className={field} value={form.department || ''} onChange={e => setValue('department', e.target.value)}/></label>
          <label className={label}>Job Title<input className={field} value={form.jobTitle || ''} onChange={e => setValue('jobTitle', e.target.value)}/></label>
          <label className={label}>Employee Code<input className={field} value={form.employeeCode || ''} onChange={e => setValue('employeeCode', e.target.value)} placeholder="SYS-EMP-001"/></label>
          <label className={label}>Phone<input className={field} value={form.phone || ''} onChange={e => setValue('phone', e.target.value)}/></label>
          <label className={label}>Status<select className={field} value={form.status || 'Active'} onChange={e => setValue('status', e.target.value)}><option>Active</option><option>Inactive</option></select></label>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold text-slate-900">Individual Permissions</p><p className="text-[11px] text-slate-600">Role defaults are loaded first. Tick or untick permissions before saving.</p></div><button type="button" onClick={() => setValue('permissions', getDefaultPermissions(form.role))} className="rounded-lg border bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700">Reset to {form.role}</button></div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {PERMISSION_GROUPS.map(group => <div key={group.title} className="rounded-lg border border-slate-200 bg-white p-3"><p className="mb-2 text-xs font-bold text-slate-900">{group.title}</p><div className="space-y-1.5">{group.permissions.map(p => <label key={p.key} className="flex items-center gap-2 text-[11px] text-slate-800"><input type="checkbox" checked={permissionSet.has(p.key)} onChange={() => togglePermission(p.key)}/>{p.label}</label>)}</div></div>)}
          </div>
        </div>

        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</div>}
        {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{success}</div>}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"><button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0788C9] px-4 py-2 text-xs font-bold text-white hover:bg-[#066FA5] disabled:opacity-60 sm:w-auto">{editing ? <Save className="h-4 w-4"/> : <Plus className="h-4 w-4"/>}{editing ? 'Update Employee' : 'Create Employee'}</button>{editing && <button type="button" onClick={reset} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 sm:w-auto"><X className="h-4 w-4"/>Cancel Edit</button>}</div>
      </form>
    </div>

    <div className="space-y-3 md:hidden">
      {employees.map(u => <div key={u.id} className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-800 shadow-sm">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words font-bold text-slate-900">{u.name}</p><p className="break-all text-slate-600">{u.email}</p>{u.employeeCode && <p className="mt-0.5 text-[10px] text-slate-500">{u.employeeCode}</p>}</div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${u.status === 'Inactive' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>{u.status || 'Active'}</span></div>
        <div className="mt-3 grid grid-cols-2 gap-3"><div><p className="text-[10px] font-bold uppercase text-slate-400">Role</p><p className="font-semibold">{u.role}</p><p className="text-slate-500">{u.jobTitle || u.department || '—'}</p></div><div><p className="text-[10px] font-bold uppercase text-slate-400">Permissions</p><p className="text-slate-600">{u.role === 'Admin' ? 'Full access' : `${(u.permissionsCustomized ? u.permissions : getDefaultPermissions(u.role))?.length || 0} permissions`}</p></div></div>
        <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3"><button onClick={() => edit(u)} className="rounded-lg border border-slate-300 p-2 text-slate-700" title="Edit role and permissions"><UserCog className="h-4 w-4"/></button><button onClick={() => { setEditing(u); setForm({ ...form, name: u.name, email: u.email, role: u.role, password: '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-lg border border-slate-300 p-2 text-slate-700" title="Reset password"><KeyRound className="h-4 w-4"/></button><button onClick={() => remove(u)} className="ml-auto rounded-lg border border-rose-200 p-2 text-rose-600" title="Delete employee"><Trash2 className="h-4 w-4"/></button></div>
      </div>)}
      {!loading && employees.length === 0 && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">No employees returned.</div>}
    </div>

    <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
      <table className="w-full text-left text-xs text-slate-800"><thead className="border-b bg-slate-50 text-[11px] uppercase text-slate-600"><tr><th className="p-3">Employee</th><th className="p-3">Role / Department</th><th className="p-3">Status</th><th className="p-3">Permissions</th><th className="p-3 text-right">Actions</th></tr></thead>
      <tbody className="divide-y divide-slate-100">{employees.map(u => <tr key={u.id}><td className="p-3"><p className="font-bold text-slate-900">{u.name}</p><p className="text-slate-600">{u.email}</p>{u.employeeCode && <p className="text-[10px] text-slate-500">{u.employeeCode}</p>}</td><td className="p-3"><p className="font-semibold">{u.role}</p><p className="text-slate-500">{u.jobTitle || u.department || '—'}</p></td><td className="p-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${u.status === 'Inactive' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>{u.status || 'Active'}</span></td><td className="p-3"><span className="text-[11px] text-slate-600">{u.role === 'Admin' ? 'Full access' : `${(u.permissionsCustomized ? u.permissions : getDefaultPermissions(u.role))?.length || 0} permissions`}</span></td><td className="p-3"><div className="flex justify-end gap-1"><button onClick={() => edit(u)} className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50" title="Edit role and permissions"><UserCog className="h-4 w-4"/></button><button onClick={() => { setEditing(u); setForm({ ...form, name: u.name, email: u.email, role: u.role, password: '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50" title="Reset password"><KeyRound className="h-4 w-4"/></button><button onClick={() => remove(u)} className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50" title="Delete employee"><Trash2 className="h-4 w-4"/></button></div></td></tr>)}</tbody></table>
      {!loading && employees.length === 0 && <div className="p-8 text-center text-xs text-slate-500">No employees returned.</div>}
    </div>
  </div>;
};
