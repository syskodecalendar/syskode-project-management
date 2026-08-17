import React, { useState } from 'react';
import { hasPermission } from '../../services/permissionService';
import { Badge } from '../common/Badge';
import { Search, Plus, Sparkles, CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';
import { qaService } from '../../services/qaService';
import { excelExportService } from '../../services/excelExportService';
import { ExcelExportButton } from '../common/ExcelExportButton';
export const TestCasesList = ({ testCases, currentUser, onOpenAIGenerator, onCreateTestCase, onRefresh }) => {
    const canManage = hasPermission(currentUser, 'manage_qa');
    const canDelete = hasPermission(currentUser, 'delete_qa');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const filtered = testCases.filter(tc => {
        const matchesSearch = tc.testCaseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tc.scenario.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tc.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tc.assignedQA || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || tc.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const handleUpdateStatus = (id, newStatus) => {
        if (!canManage)
            return;
        qaService.updateTestResult(id, newStatus, undefined, undefined, currentUser?.name || 'QA User');
        onRefresh();
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Passed':
                return <Badge variant="green">Passed</Badge>;
            case 'Failed':
                return <Badge variant="red">Failed</Badge>;
            case 'Blocked':
                return <Badge variant="amber">Blocked</Badge>;
            case 'Retest':
                return <Badge variant="purple">Retest</Badge>;
            default:
                return <Badge variant="gray">Not Tested</Badge>;
        }
    };
    const stats = qaService.getQAStats();
    return (<div className="space-y-4">
      {/* QA Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-500">Total Cases</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900 dark:bg-emerald-950/30">
          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Passed ({stats.passPercentage}%)</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.passed}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 dark:border-rose-900 dark:bg-rose-950/30">
          <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">Failed</span>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.failed}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-900 dark:bg-amber-950/30">
          <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Blocked / Retest</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.blocked + stats.retest}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-3.5 dark:border-slate-800 dark:bg-slate-800">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Not Tested</span>
          <p className="text-xl font-black text-slate-700 dark:text-slate-300 mt-1">{stats.notTested}</p>
        </div>
        <div className="rounded-xl border border-rose-300 bg-rose-100/80 p-3.5 dark:border-rose-800 dark:bg-rose-950/50">
          <span className="text-[11px] font-bold text-rose-900 dark:text-rose-200">Critical Defects</span>
          <p className="text-xl font-black text-rose-700 dark:text-rose-300 mt-1">{stats.criticalDefects}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex w-full flex-1 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full min-w-0 flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/>
            <input type="text" placeholder="Search Test ID, Scenario, or Module..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full sm:w-auto rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <option value="All">All Test Statuses</option>
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
            <option value="Blocked">Blocked</option>
            <option value="Retest">Retest</option>
            <option value="Not Tested">Not Tested</option>
          </select>
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center sm:space-x-2 sm:shrink-0">
          <ExcelExportButton label="Export Test Cases" onClick={() => excelExportService.exportRows(
            `syskode-test-cases-${new Date().toISOString().slice(0, 10)}`,
            'QA Test Cases',
            filtered.map(tc => ({ Test_Case_ID: tc.testCaseId, Project_ID: tc.projectId, Module: tc.module || '', Feature: tc.feature || '', Scenario: tc.scenario || '', Steps: Array.isArray(tc.steps) ? tc.steps.join(' | ') : (tc.steps || ''), Expected_Result: tc.expectedResult || '', Actual_Result: tc.actualResult || '', Status: tc.status, Priority: tc.priority, Severity: tc.severity, Assigned_QA: tc.assignedQA || '', Tested_Date: tc.testedDate || '', Comments: tc.comments || '' }))
          )}/>
          {canManage && <button onClick={onOpenAIGenerator} className="flex w-full items-center justify-center space-x-1.5 rounded-lg bg-[#0788C9] px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#066fa5] sm:w-auto">
            <Sparkles className="h-4 w-4"/>
            <span>Generate Test Suite with Gemini</span>
          </button>}

          {canManage && <button onClick={onCreateTestCase} className="flex w-full items-center justify-center space-x-1 rounded-lg border border-[#9ed8f3] bg-[#eef9ff] px-3 py-2 text-xs font-semibold text-[#075f91] hover:bg-[#e1f5ff] sm:w-auto">
            <Plus className="h-4 w-4"/>
            <span>Manual Test Case</span>
          </button>}
        </div>
      </div>

      {/* Mobile test case cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map(tc => (<div key={tc.id} className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[10px] font-bold text-blue-600">{tc.testCaseId}</p><p className="mt-1 break-words font-bold text-slate-900">{tc.scenario}</p><p className="mt-1 text-slate-500">{tc.module} • {tc.feature}</p></div>{getStatusBadge(tc.status)}</div>
            <p className="mt-3 rounded-lg bg-slate-50 p-2 text-slate-600"><strong>Expected:</strong> {tc.expectedResult}</p>
            <div className="mt-3 flex flex-wrap gap-2"><Badge variant={tc.severity === 'Critical' || tc.severity === 'Blocker' ? 'red' : 'blue'} size="sm">{tc.severity}</Badge><Badge variant="blue" size="sm">{tc.priority}</Badge></div>
            <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">{canManage && <button onClick={() => handleUpdateStatus(tc.id, 'Passed')} className="rounded-lg border border-emerald-200 p-2 text-emerald-700" title="Mark Passed"><CheckCircle2 className="h-4 w-4"/></button>}{canManage && <button onClick={() => handleUpdateStatus(tc.id, 'Failed')} className="rounded-lg border border-rose-200 p-2 text-rose-700" title="Mark Failed"><XCircle className="h-4 w-4"/></button>}{canManage && <button onClick={() => handleUpdateStatus(tc.id, 'Retest')} className="rounded-lg border border-purple-200 p-2 text-purple-700" title="Mark Retest"><Clock className="h-4 w-4"/></button>}{canDelete && <button onClick={() => { if (window.confirm(`Delete test case ${tc.testCaseId}?`)) {
            qaService.deleteTestCase(tc.id);
            onRefresh();
        } }} className="ml-auto rounded-lg border border-rose-200 p-2 text-rose-700" title="Delete Test Case"><Trash2 className="h-4 w-4"/></button>}</div>
          </div>))}
      </div>

      {/* Desktop Test Cases Table */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs md:block dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider dark:bg-slate-800 dark:border-slate-800 font-semibold">
            <tr>
              <th className="py-3 px-4">Test Case ID & Module</th>
              <th className="py-3 px-4">Scenario / Verification Goal</th>
              <th className="py-3 px-4">Expected Result</th>
              <th className="py-3 px-4">Severity & Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Execute Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map(tc => (<tr key={tc.id} className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/40">
                <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                  {tc.testCaseId}
                  <span className="block text-[10px] font-normal text-slate-500 font-sans">{tc.module}</span>
                </td>
                <td className="py-3.5 px-4">
                  <p className="font-bold text-slate-900 dark:text-white">{tc.scenario}</p>
                  <p className="text-[11px] text-slate-500">Feature: {tc.feature}</p>
                </td>
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                  {tc.expectedResult}
                </td>
                <td className="py-3.5 px-4 space-y-1">
                  <Badge variant={tc.severity === 'Critical' || tc.severity === 'Blocker' ? 'red' : 'blue'} size="sm">
                    {tc.severity}
                  </Badge>
                </td>
                <td className="py-3.5 px-4">
                  {getStatusBadge(tc.status)}
                </td>
                <td className="py-3.5 px-4 text-right space-x-1">
                  {canManage && <button onClick={() => handleUpdateStatus(tc.id, 'Passed')} className="rounded bg-emerald-50 p-1 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300" title="Mark Passed">
                    <CheckCircle2 className="h-4 w-4"/>
                  </button>}
                  {canManage && <button onClick={() => handleUpdateStatus(tc.id, 'Failed')} className="rounded bg-rose-50 p-1 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300" title="Mark Failed">
                    <XCircle className="h-4 w-4"/>
                  </button>}
                  {canManage && <button onClick={() => handleUpdateStatus(tc.id, 'Retest')} className="rounded bg-purple-50 p-1 text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300" title="Mark Retest">
                    <Clock className="h-4 w-4"/>
                  </button>}
                  {canDelete && <button onClick={() => { if (window.confirm(`Delete test case ${tc.testCaseId}?`)) {
            qaService.deleteTestCase(tc.id);
            onRefresh();
        } }} className="rounded bg-rose-50 p-1 text-rose-700 hover:bg-rose-100" title="Delete Test Case"><Trash2 className="h-4 w-4"/></button>}
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>);
};
