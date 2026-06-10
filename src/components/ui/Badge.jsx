import React from 'react';

const roleStyles = {
  manager: 'bg-orange-100 text-orange-700 border-orange-200',
  asst_manager: 'bg-blue-100 text-blue-700 border-blue-200',
  employee: 'bg-gray-100 text-gray-600 border-gray-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  denied: 'bg-red-100 text-red-700 border-red-200',
};

const roleLabels = {
  manager: 'Manager',
  asst_manager: 'Asst. Manager',
  employee: 'Employee',
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
};

export const Badge = ({ type, label, className = '' }) => {
  const style = roleStyles[type] || 'bg-gray-100 text-gray-600 border-gray-200';
  const text = label || roleLabels[type] || type;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}>
      {text}
    </span>
  );
};

export default Badge;
