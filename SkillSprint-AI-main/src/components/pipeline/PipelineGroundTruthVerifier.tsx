import React, { useState } from 'react';
import type { DualPipelineResult } from '../../types';
import { ProgressRing } from '../common/ProgressBar';
import { Badge } from '../common/Badge';
import { ShieldCheck, ArrowUpRight, AlertCircle, AlertTriangle, FileCheck } from 'lucide-react';

interface PipelineGroundTruthVerifierProps {
  result: DualPipelineResult;
  onSendToHitl: () => void;
}

export const PipelineGroundTruthVerifier: React.FC<PipelineGroundTruthVerifierProps> = ({
  result,
  onSendToHitl
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const report = result.validationReport;

  const filteredItems = result.items.filter((item) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'FLAGGED') return item.status !== 'Verified';
    return item.status === statusFilter;
  });

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl flex flex-col h-full">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">Pipeline 2: Python Ground-Truth Verification</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                Rule Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">Automated Deterministic Verification & Hallucination Audit</p>
          </div>
        </div>

        <button
          onClick={onSendToHitl}
          className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          Send Flagged to HITL Queue <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Real-Time Scorecards Circular Rings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ProgressRing
          value={result.mandatoryCoverageScore}
          label="Mandatory Coverage"
          sublabel="SOP Ground Truth"
          target="100%"
          color={result.mandatoryCoverageScore >= 98 ? 'emerald' : 'amber'}
        />
        <ProgressRing
          value={result.traceabilityScore}
          label="Source Traceability"
          sublabel="Direct Citations"
          target=">95%"
          color="indigo"
        />
        <ProgressRing
          value={result.consistencyScore}
          label="Consistency Score"
          sublabel="Zero Contradiction"
          target="100%"
          color={result.consistencyScore >= 95 ? 'emerald' : 'rose'}
        />
      </div>

      {/* Comprehensive Diagnostic Counters Grid (SRS Validation Breakdown) */}
      <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center text-[11px]">
        <div>
          <span className="text-slate-400 text-[10px] block truncate">Missing Reqs</span>
          <span className="font-bold text-rose-400 text-xs">{report?.missing_requirements ?? result.missingRequirementsCount}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block truncate">Unsupported</span>
          <span className="font-bold text-purple-400 text-xs">{report?.unsupported_items ?? result.unsupportedClaimsCount}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block truncate">Invalid Refs</span>
          <span className="font-bold text-amber-400 text-xs">{report?.invalid_references ?? 0}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block truncate">Duplicates</span>
          <span className="font-bold text-slate-300 text-xs">{report?.duplicate_items ?? 0}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block truncate">Role Mismatches</span>
          <span className="font-bold text-indigo-400 text-xs">{report?.role_mismatches ?? 0}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block truncate">Outdated Sources</span>
          <span className="font-bold text-orange-400 text-xs">{report?.outdated_sources ?? 0}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block truncate">Contradictions</span>
          <span className="font-bold text-red-400 text-xs">{report?.contradictions ?? result.contradictionCount}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block truncate">Superseded</span>
          <span className="font-bold text-cyan-400 text-xs">{report?.superseded_requirements ?? 0}</span>
        </div>
      </div>

      {/* Precedence Results & Manual Review Highlights */}
      {(report?.precedence_results || (report?.manual_review_items && report.manual_review_items.length > 0)) && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300">
          <div className="flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Precedence: <strong>{report.precedence_results?.rule_evaluation || 'Hierarchical Order Applied'}</strong></span>
          </div>
          {report?.manual_review_items && (
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30 text-[10px]">
              {report.manual_review_items.length} Manual Review Items
            </span>
          )}
        </div>
      )}

      {/* Errors / Warnings Callouts */}
      {report?.errors && report.errors.length > 0 && (
        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" /> Validation Errors ({report.errors.length})
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[10px] text-red-300/90 pl-1">
            {report.errors.map((err: string, idx: number) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {report?.warnings && report.warnings.length > 0 && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Validation Warnings ({report.warnings.length})
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[10px] text-amber-300/90 pl-1">
            {report.warnings.map((warn: string, idx: number) => (
              <li key={idx}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Dual-Pipeline Comparison Data Table (SRS Table 1 format) */}
      <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Verification Comparison Table (SRS Table 1)
          </h4>

          {/* Filter dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Items ({result.items.length})</option>
            <option value="FLAGGED">Flagged Warnings/Errors Only</option>
            <option value="Verified">Verified Only</option>
            <option value="Contradiction Detected">Contradictions Only</option>
            <option value="Requirement Missing">Missing Only</option>
          </select>
        </div>

        <div className="overflow-y-auto flex-1 border border-slate-800 rounded-xl bg-slate-950/60 max-h-[340px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase bg-slate-950 sticky top-0 z-10">
                <th className="p-2.5">Validation Field</th>
                <th className="p-2.5">GenAI Output</th>
                <th className="p-2.5">Ground-Truth Expected</th>
                <th className="p-2.5 text-right">Status Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-2.5 font-bold text-slate-200 max-w-[140px]">
                    <div>{item.fieldName}</div>
                    <div className="text-[10px] text-indigo-400 font-mono">{item.reqId}</div>
                  </td>
                  <td className="p-2.5 text-slate-300 max-w-[180px] font-sans">
                    <p className="line-clamp-2">{item.genAiOutput}</p>
                  </td>
                  <td className="p-2.5 text-slate-400 max-w-[180px]">
                    <p className="line-clamp-2">{item.groundTruthExpected}</p>
                    <div className="text-[9px] text-amber-400 font-mono mt-0.5">
                      {item.sourceDocId} {item.sourceSection}
                    </div>
                  </td>
                  <td className="p-2.5 text-right">
                    <Badge status={item.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

