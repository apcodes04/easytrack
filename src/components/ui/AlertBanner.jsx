import React from 'react';
import { AlertTriangle, X, Info, CheckCircle } from 'lucide-react';

const styles = {
  error: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: AlertTriangle, iconColor: 'text-red-500' },
  warning: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', icon: AlertTriangle, iconColor: 'text-yellow-500' },
  info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: Info, iconColor: 'text-blue-500' },
  success: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: CheckCircle, iconColor: 'text-green-500' },
};

export const AlertBanner = ({ type = 'info', title, message, onDismiss, className = '' }) => {
  const s = styles[type] || styles.info;
  const Icon = s.icon;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${s.bg} ${className}`}>
      <Icon size={18} className={`mt-0.5 flex-shrink-0 ${s.iconColor}`} />
      <div className="flex-1 min-w-0">
        {title && <p className={`text-sm font-semibold ${s.text}`}>{title}</p>}
        {message && <p className={`text-sm ${s.text} ${title ? 'mt-0.5' : ''}`}>{message}</p>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className={`flex-shrink-0 ${s.text} hover:opacity-70`}>
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
