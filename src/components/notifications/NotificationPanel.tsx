import React from 'react';
import { Bell, BellOff, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Notification } from '../../types';

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  className?: string;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onMarkAsRead,
  className = '',
}) => {
  const sortedNotifications = [...notifications].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
  };

  const getNotificationIcon = (notification: Notification) => {
    if (notification.type === 'hospital') {
      return <Bell className="text-blue-500\" size={18} />;
    } else {
      // Traffic signal notification
      return <AlertTriangle className="text-amber-500" size={18} />;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <Bell className="mr-2" size={18} />
          Notifications
        </h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {notifications.filter(n => !n.read).length} New
        </span>
      </div>

      {notifications.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <BellOff className="mx-auto mb-3 text-gray-400" size={24} />
          <p>No notifications yet</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
          {sortedNotifications.map((notification) => (
            <li
              key={notification.id}
              className={`p-4 transition-colors ${
                notification.read ? 'bg-white' : 'bg-blue-50'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  {getNotificationIcon(notification)}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.message}
                  </p>
                  <div className="mt-1 flex items-center">
                    <Clock className="text-gray-400 mr-1" size={14} />
                    <span className="text-xs text-gray-500">
                      {getTimeAgo(notification.timestamp)}
                    </span>
                  </div>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => onMarkAsRead(notification.id)}
                    className="ml-2 flex-shrink-0 bg-white rounded-full p-1 text-gray-400 hover:text-gray-500"
                  >
                    <CheckCircle size={18} />
                    <span className="sr-only">Mark as read</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationPanel;