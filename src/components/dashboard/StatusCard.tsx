import React from 'react';
import { AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react';

interface StatusCardProps {
  title: string;
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: string;
  icon?: React.ReactNode;
  progress?: number;
  className?: string;
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  message,
  details,
  icon,
  progress,
  className = '',
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'warning':
        return 'bg-amber-100 border-amber-300 text-amber-800';
      case 'error':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'info':
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return icon || <CheckCircle className="text-green-500" />;
      case 'warning':
        return icon || <AlertCircle className="text-amber-500" />;
      case 'error':
        return icon || <AlertCircle className="text-red-500" />;
      case 'info':
      default:
        return icon || <Clock className="text-blue-500" />;
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-amber-500';
      case 'error':
        return 'bg-red-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className={`rounded-lg border overflow-hidden ${getStatusColor()} ${className}`}>
      <div className="p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-white">
            {getStatusIcon()}
          </div>
          <div className="ml-3">
            <h3 className="font-medium">{title}</h3>
            <div className="mt-1 text-sm opacity-80">{message}</div>
          </div>
        </div>
        
        {details && (
          <div className="mt-3 text-sm">
            <p>{details}</p>
          </div>
        )}
        
        {progress !== undefined && (
          <div className="mt-4">
            <div className="w-full bg-white rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${getProgressColor()}`} 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="mt-1 text-xs text-right">{progress}%</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusCard;