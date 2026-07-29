import { useState } from 'react';
import { Bell, DollarSign, Utensils, Users, AlertCircle, Info, Circle } from 'lucide-react';

function NotificationBell({ notifications, onMarkAsRead, onMarkAllAsRead }) {
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'donation': return <DollarSign size={16} className="text-emerald-600" />;
      case 'chit': return <Utensils size={16} className="text-amber-600" />;
      case 'registry': return <Users size={16} className="text-indigo-600" />;
      case 'alert': return <AlertCircle size={16} className="text-red-600" />;
      case 'system': return <Info size={16} className="text-blue-600" />;
      default: return <Circle size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="p-2 text-indigo-200 hover:bg-indigo-800 rounded-lg relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {showNotifications && (
        <>
          <div
            onClick={() => setShowNotifications(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[999]"
          ></div>
          <div className="fixed w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-[1000]" style={{ top: '60px', left: '280px' }}>
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  onMarkAllAsRead();
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    onMarkAsRead(notification.id);
                  }}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                    {!notification.read && (
                      <div className="mt-1">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-gray-200 text-center">
            <button
              onClick={() => setShowNotifications(false)}
              className="text-xs text-gray-600 hover:text-gray-800 font-medium"
            >
              Close
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
