
import React from 'react';
// Fix: Corrected import path for types
import { EntryStatus } from '../../types';

interface BadgeProps {
  status: EntryStatus;
}

const statusColorMap: Record<EntryStatus, string> = {
  [EntryStatus.APPROVED]: 'bg-status-green/10 text-status-green border border-status-green/20',
  [EntryStatus.NEEDS_REVIEW]: 'bg-status-yellow/10 text-status-yellow border border-status-yellow/20',
  [EntryStatus.SUBMITTED]: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
  [EntryStatus.REJECTED]: 'bg-status-red/10 text-status-red border border-status-red/20',
  [EntryStatus.DRAFT]: 'bg-gray-400/10 text-gray-500 border border-gray-400/20',
};


const Badge: React.FC<BadgeProps> = ({ status }) => {
  const colorClasses = statusColorMap[status] || 'bg-gray-200 text-gray-800';
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClasses}`}
    >
      {status}
    </span>
  );
};

export default Badge;
