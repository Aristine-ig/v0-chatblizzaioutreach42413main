import { useState, useEffect } from 'react';
import { Bell, Trash2, Check, Settings } from 'lucide-react';
import { notificationService, Notification } from '../services/notificationService';

interface NotificationsViewProps {
  userId: string;
}

export default function NotificationsView({ userId }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);

  useEffect(() => {
    loadNotifications();
    loadPreferences();
  }, [userId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const prefs = await notificationService.getPreferences(userId);
      if (!prefs) {
        await notificationService.initializePreferences(userId);
        loadPreferences();
      } else {
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(userId);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      await notificationService.updatePreferences(userId, preferences);
      setShowPreferences(false);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return '👤';
      case 'meal_shared':
        return '🍽️';
      case 'reaction':
        return '❤️';
      case 'meal_reminder':
        return '⏰';
      case 'hydration_reminder':
        return '💧';
      default:
        return '🔔';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-3 rounded-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
              <p className="text-gray-600 text-sm">{unreadCount} unread</p>
            </div>
          </div>
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="p-2 hover:bg-white rounded-lg transition"
          >
            <Settings className="w-6 h-6 text-emerald-600" />
          </button>
        </div>

        {showPreferences && preferences && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-emerald-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Notification Preferences</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.meal_reminders_enabled}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    meal_reminders_enabled: e.target.checked
                  })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-gray-700">Meal Reminders</span>
              </label>

              {preferences.meal_reminders_enabled && (
                <div className="ml-7">
                  <label className="block text-sm text-gray-600 mb-2">Reminder Time</label>
                  <input
                    type="time"
                    value={preferences.meal_reminders_time}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      meal_reminders_time: e.target.value
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.hydration_reminders_enabled}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    hydration_reminders_enabled: e.target.checked
                  })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-gray-700">Hydration Reminders</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.follow_notifications_enabled}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    follow_notifications_enabled: e.target.checked
                  })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-gray-700">New Follower Notifications</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.reaction_notifications_enabled}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    reaction_notifications_enabled: e.target.checked
                  })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-gray-700">Meal Reaction Notifications</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdatePreferences}
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition font-medium"
                >
                  Save Preferences
                </button>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="mb-4 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
          >
            Mark all as read
          </button>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No notifications yet</p>
            <p className="text-gray-500 text-sm mt-1">Follow friends and share meals to get notifications</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`rounded-xl p-4 transition ${
                  notification.read
                    ? 'bg-white border border-gray-200'
                    : 'bg-emerald-50 border border-emerald-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                    <p className="text-gray-500 text-xs mt-2">
                      {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-2 hover:bg-emerald-100 rounded-lg transition"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4 text-emerald-600" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
