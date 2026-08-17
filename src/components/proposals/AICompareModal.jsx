import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Sparkles } from 'lucide-react';
import { aiService } from '../../services/aiService';
export const AICompareModal = ({ isOpen, onClose, syskodePricing, competitors }) => {
    const [loading, setLoading] = useState(false);
    const [comparison, setComparison] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        if (isOpen) {
            setComparison(null); setError('');
            const firstVendor = competitors?.[0];
            const vendorPricing = firstVendor?.pricings?.[0];
            if (!syskodePricing || !firstVendor || !vendorPricing) {
                setError('Add real Syskode pricing and at least one vendor pricing record before running AI comparison.');
                setLoading(false);
                return;
            }
            setLoading(true);
            aiService.compareProposals({}, syskodePricing, firstVendor.vendorName, {}, vendorPricing)
              .then(res => setComparison(res.comparison))
              .catch(err => setError(err?.message || 'Unable to compare proposals.'))
              .finally(() => setLoading(false));
        }
    }, [isOpen, syskodePricing, competitors]);
    if (!isOpen)
        return null;
    return (<Modal isOpen={isOpen} onClose={onClose} title="✨ Gemini AI Proposal & Price Comparison Matrix" subtitle="Side-by-side technical, commercial, warranty & timeline evaluation against competitor proposal." maxWidth="5xl">
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">{error}</div>}
      {loading ? (<div className="py-16 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"/>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Running multi-aspect AI evaluation... Comparing architecture, warranty terms, TCO, and sales positioning.
          </p>
        </div>) : comparison ? (<div className="space-y-5 text-xs">
          {/* Comparison Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider dark:bg-slate-800 dark:border-slate-800 font-bold">
                <tr>
                  <th className="py-3 px-4">Evaluation Domain</th>
                  <th className="py-3 px-4 text-blue-600 dark:text-blue-400">Syskode Technologies</th>
                  <th className="py-3 px-4 text-slate-600 dark:text-slate-400">Competitor Proposal</th>
                  <th className="py-3 px-4 text-emerald-600 dark:text-emerald-400">Syskode Advantage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {comparison.matrix.map((row, i) => (<tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{row.area}</td>
                    <td className="py-3 px-4 text-blue-900 dark:text-blue-300 font-medium">{row.syskode}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{row.competitor}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-700 dark:text-emerald-400">{row.difference}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Syskode Differentiators */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                <Sparkles className="h-4 w-4 mr-1.5 text-blue-600"/> Syskode Key Advantages
              </h4>
              <ul className="list-disc list-inside space-y-1 text-blue-950 dark:text-blue-200">
                {comparison.syskodeAdvantages.map((adv, i) => (<li key={i}>{adv}</li>))}
              </ul>
            </div>

            {/* Sales Talking Points */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <h4 className="font-bold text-emerald-900 dark:text-emerald-300 mb-2">Recommended Sales Pitch</h4>
              <ul className="list-disc list-inside space-y-1 text-emerald-950 dark:text-emerald-200">
                {comparison.salesTalkingPoints.map((pt, i) => (<li key={i}>{pt}</li>))}
              </ul>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button onClick={onClose} className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-blue-700">
              Close Comparison
            </button>
          </div>
        </div>) : null}
    </Modal>);
};
