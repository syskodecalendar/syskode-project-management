import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Sparkles } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { qaService } from '../../services/qaService';
import { projectService } from '../../services/projectService';
export const AIGenerateTestCasesModal = ({ isOpen, onClose, onSuccess, initialProjectId = '' }) => {
    const projects = projectService.getProjects();
    const [projectId, setProjectId] = useState('');
    const [projectType, setProjectType] = useState('');
    const [description, setDescription] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [selectedModules, setSelectedModules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generatedCases, setGeneratedCases] = useState(null);
    const [selectedIndices, setSelectedIndices] = useState([]);
    const [error, setError] = useState('');
    useEffect(() => {
        if (isOpen) {
            setProjectId(initialProjectId || '');
            setGeneratedCases(null);
            setSelectedIndices([]);
            setError('');
        }
    }, [isOpen, initialProjectId]);
    useEffect(() => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        setProjectType(project.projectType || '');
        setDescription(project.description || '');
        setWebsiteUrl(project.websiteUrl || project.url || '');
    }, [projectId]);
    const availableModules = [
        'Responsive Design',
        'Forms & Validation',
        'Payment Gateway Integration',
        'Role-Based Security',
        'Database & Persistence',
        'API Endpoints & Errors',
        'Cross-Browser Layout',
        'Localization & RTL Arabic'
    ];
    const toggleModule = (mod) => {
        if (selectedModules.includes(mod)) {
            setSelectedModules(selectedModules.filter(m => m !== mod));
        }
        else {
            setSelectedModules([...selectedModules, mod]);
        }
    };
    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const result = await aiService.generateTestCases(projectType, description, selectedModules, websiteUrl, projectId);
            setGeneratedCases(result.testCases);
            setSelectedIndices(result.testCases.map((_, i) => i));
        } catch (err) {
            setError(err?.message || 'Unable to generate test cases.');
        } finally { setLoading(false); }
    };
    const handleImport = () => {
        if (!generatedCases || !projectId)
            return;
        const casesToImport = generatedCases
            .filter((_, idx) => selectedIndices.includes(idx))
            .map(testCase => ({ ...testCase, projectId }));
        qaService.importBulkTestCases(casesToImport);
        onSuccess();
        onClose();
    };
    if (!isOpen)
        return null;
    return (<Modal isOpen={isOpen} onClose={onClose} title="✨ Gemini AI QA Test Suite Generator" subtitle="Instantly build comprehensive functional, security, and responsive test suites tailored to your Syskode project specs." maxWidth="4xl">
      {error && <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</div>}
      {!generatedCases ? (<form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Save Test Cases To Project *
            </label>
            <select required value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="">Select a live project</option>
              {projects.map(project => (<option key={project.id} value={project.id}>
                  {project.projectName} — {project.client}
                </option>))}
            </select>
            {projects.length === 0 && (<p className="mt-1 text-xs text-amber-600">Create a project first so generated test cases can be linked in the database.</p>)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project Type *
              </label>
              <select required value={projectType} onChange={e => setProjectType(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option value="">Select project type</option><option>Website Development</option>
                <option>E-commerce Platform</option>
                <option>Custom Web Application</option>
                <option>Mobile Application (iOS / Android)</option>
                <option>ERP & Zoho Custom Module</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Website / Staging URL (Optional)
              </label>
              <input type="text" placeholder="Enter the real website or staging URL" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Description & Requirements *
            </label>
            <textarea rows={3} required value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Test Suite Modules to Include
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {availableModules.map(mod => {
                const isSel = selectedModules.includes(mod);
                return (<button key={mod} type="button" onClick={() => toggleModule(mod)} className={`p-2 rounded-lg border text-xs font-medium text-left transition-all ${isSel
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:border-blue-500 dark:text-blue-300 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900'}`}>
                    {isSel ? '✓ ' : '+ '}{mod}
                  </button>);
            })}
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700">
              <Sparkles className="h-4 w-4"/>
              <span>{loading ? 'Generating Test Cases...' : 'Generate Test Suite'}</span>
            </button>
          </div>
        </form>) : (<div className="space-y-4">
          <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900 text-xs">
            <span className="font-bold text-blue-900 dark:text-blue-300">
              Generated {generatedCases.length} Test Cases with Gemini Pro
            </span>
            <span className="text-blue-700 dark:text-blue-400">
              {selectedIndices.length} Selected for Bulk Import
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 dark:border-slate-800">
            {generatedCases.map((tc, idx) => {
                const isSel = selectedIndices.includes(idx);
                return (<div key={idx} onClick={() => {
                        if (isSel)
                            setSelectedIndices(selectedIndices.filter(i => i !== idx));
                        else
                            setSelectedIndices([...selectedIndices, idx]);
                    }} className={`p-3 rounded-lg border cursor-pointer transition-all text-xs ${isSel
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500'
                        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 opacity-60'}`}>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                    <span>{tc.module}: {tc.scenario}</span>
                    <span className="text-blue-600">{tc.priority} ({tc.severity})</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">Expected: {tc.expectedResult}</p>
                </div>);
            })}
          </div>

          <div className="pt-3 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => setGeneratedCases(null)} className="text-xs text-blue-600 hover:underline font-semibold">
              ← Back to Generator Prompt
            </button>

            <div className="flex space-x-2">
              <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button onClick={handleImport} disabled={selectedIndices.length === 0} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-700">
                Import {selectedIndices.length} Test Cases
              </button>
            </div>
          </div>
        </div>)}
    </Modal>);
};
