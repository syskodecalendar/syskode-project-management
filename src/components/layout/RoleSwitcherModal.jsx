import React from 'react';
import { Modal } from '../common/Modal';
import { Shield, Check } from 'lucide-react';
export const RoleSwitcherModal = ({ isOpen, onClose, currentUser, currentRole, onSwitchRole, onSelectRole }) => {
    const activeRole = currentRole || currentUser?.role || 'Admin';
    const handleSwitch = onSwitchRole || onSelectRole || (() => { });
    const roles = [
        {
            role: 'Admin',
            title: 'System Administrator',
            description: 'Full system access, manage roles, view all credentials & database rules.',
            permissions: ['All Leads', 'All Financials', 'Sensitive Credentials', 'System Settings', 'QA Management']
        },
        {
            role: 'Management',
            title: 'Management / Executive',
            description: 'Access leads, proposals, pricing, vendor comparisons, & project reports.',
            permissions: ['All Leads & Proposals', 'Full Pricing & Vendor Matrix', 'Project Analytics', 'Reports Access']
        },
        {
            role: 'Sales',
            title: 'Sales Team Member',
            description: 'Manage leads, schedule meetings, upload proposals & track follow-ups.',
            permissions: ['Manage Leads', 'Schedule Meetings', 'Upload Proposals', 'Track Follow-ups']
        },
        {
            role: 'Project Manager',
            title: 'Project Manager',
            description: 'Manage active projects, assign team responsibilities, tasks, and hosting.',
            permissions: ['Manage Projects', 'Task Assignments', 'Responsibility Matrix', 'Infrastructure Setup']
        },
        {
            role: 'Developer',
            title: 'Software Developer',
            description: 'Access assigned projects, developer credentials, and task progress.',
            permissions: ['Assigned Projects Only', 'Assigned Tasks', 'Authorized Server Credentials', 'Repo Details']
        },
        {
            role: 'QA',
            title: 'QA / Test Engineer',
            description: 'Manage test suites, website/app test templates, and defect reports.',
            permissions: ['Manage Test Cases', 'AI Test Case Generator', 'Mark Pass/Fail', 'QA Reports']
        }
    ];
    return (<Modal isOpen={isOpen} onClose={onClose} title="Role & Permission Switcher" subtitle="Switch active user role to experience Syskode Hub role-based access control (RBAC)." maxWidth="3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map(r => {
            const isSelected = activeRole === r.role;
            return (<div key={r.role} onClick={() => {
                    handleSwitch(r.role);
                    onClose();
                }} className={`group relative flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition-all ${isSelected
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 dark:border-blue-500 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80'}`}>
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}/>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {r.title}
                    </h4>
                  </div>
                  {isSelected && (<span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Check className="h-3.5 w-3.5"/>
                    </span>)}
                </div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {r.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Allowed Capabilities:
                </p>
                <div className="flex flex-wrap gap-1">
                  {r.permissions.map((p, idx) => (<span key={idx} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {p}
                    </span>))}
                </div>
              </div>
            </div>);
        })}
      </div>
    </Modal>);
};
