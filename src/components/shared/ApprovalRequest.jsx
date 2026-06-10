import React, { useState, useEffect } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useOrg } from '../../hooks/useOrg';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * ApprovalRequest – shows pending entries with approve/deny for managers
 * Props:
 *  entries: array of entry objects with { id, submittedBy, status, date, ...dynamicFields }
 *  columns: array of column definitions
 *  onApprove(entryId): async fn
 *  onDeny(entryId): async fn
 *  featureName: string label
 */
export const ApprovalRequest = ({ entries = [], columns = [], onApprove, onDeny, featureName = 'Entry' }) => {
  const { canApprove } = usePermissions();
  const pending = entries.filter((e) => e.status === 'pending');

  if (!canApprove || pending.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={16} className="text-yellow-500" />
        <h3 className="text-sm font-semibold text-gray-700">Pending Approvals ({pending.length})</h3>
      </div>
      <div className="space-y-2">
        {pending.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-sm text-gray-700">
                <span className="font-medium">{featureName}</span> – {entry.date}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Submitted by: {entry.submittedBy?.slice(0, 8)}…
                {entry.notes && ` · ${entry.notes}`}
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {columns.filter((c) => c.dataType !== 'date').slice(0, 3).map((col) => (
                  <span key={col.id} className="text-xs bg-white border border-yellow-200 px-2 py-0.5 rounded-full text-gray-600">
                    {col.name}: {entry[col.id] ?? '—'}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button size="sm" variant="success" onClick={() => onApprove(entry.id)}>
                <Check size={14} />
              </Button>
              <Button size="sm" variant="danger" onClick={() => onDeny(entry.id)}>
                <X size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovalRequest;
