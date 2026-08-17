import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Sparkles, Copy, Check } from 'lucide-react';
import { aiService } from '../../services/aiService';
export const AISummaryModal = ({ isOpen, onClose, leadName, documentName, proposalText = '' }) => {
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (isOpen) {
            setSummary(null); setError('');
            if (!proposalText.trim()) {
                setError('No extracted proposal text is available for this document. The system will not create a sample summary.');
                setLoading(false);
                return;
            }
            setLoading(true);
            aiService.summarizeProposal(proposalText, documentName || 'Proposal', leadName || 'Client')
              .then(res => setSummary(res.summary))
              .catch(err => setError(err?.message || 'Unable to summarize proposal.'))
              .finally(() => setLoading(false));
        }
    }, [isOpen, leadName, documentName, proposalText]);
    if (!isOpen)
        return null;
    const handleCopy = () => {
        if (!summary)
            return;
        const text = `PROPOSAL EXECUTIVE SUMMARY (${leadName || 'Client'}):\n\n${summary.executiveSummary}\n\nKEY DELIVERABLES:\n${summary.deliverables.join('\n')}\n\nCOMMERCIAL TERMS:\n${summary.commercialTerms}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (<Modal isOpen={isOpen} onClose={onClose} title="✨ Gemini AI Proposal Analysis & Summary" subtitle={`Automated structured intelligence extracted from ${documentName || 'Proposal PDF'}`} maxWidth="4xl">
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">{error}</div>}
      {loading ? (<div className="py-16 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"/>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Analyzing document text with Gemini Pro... Extracting deliverables, commercial terms, risks, and next actions.
          </p>
        </div>) : summary ? (<div className="space-y-5 text-xs">
          {/* Executive Summary */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
            <h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm mb-1 flex items-center">
              <Sparkles className="h-4 w-4 mr-1.5 text-blue-600"/> Executive Overview
            </h4>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {summary.executiveSummary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Requirements */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Customer Requirements</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                {summary.customerRequirements.map((r, i) => (<li key={i}>{r}</li>))}
              </ul>
            </div>

            {/* Deliverables */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Key Deliverables</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                {summary.deliverables.map((d, i) => (<li key={i}>{d}</li>))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Timeline */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">Timeline</h4>
              <p className="text-slate-700 dark:text-slate-300">{summary.timeline}</p>
            </div>

            {/* Commercial Terms */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">Payment Schedule</h4>
              <p className="text-slate-700 dark:text-slate-300">{summary.commercialTerms}</p>
            </div>

            {/* Recommended Next Actions */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <h4 className="font-bold text-emerald-900 dark:text-emerald-300 mb-1">Recommended Action</h4>
              <ul className="list-disc list-inside space-y-1 text-emerald-900 dark:text-emerald-200">
                {summary.recommendedNextActions.map((a, i) => (<li key={i}>{a}</li>))}
              </ul>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="pt-3 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
            <button onClick={handleCopy} className="flex items-center space-x-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              {copied ? <Check className="h-4 w-4 text-emerald-500"/> : <Copy className="h-4 w-4"/>}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button onClick={onClose} className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-blue-700">
              Close
            </button>
          </div>
        </div>) : null}
    </Modal>);
};
