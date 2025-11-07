import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: 'follow' | 'meal_shared' | 'reaction' | 'meal_reminder' | 'hydration_reminder';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  meal_reminders_enabled: boolean;
  hydration_reminders_enabled: boolean;
  meal_reminders_time: string;
  follow_notifications_enabled: boolean;
  reaction_notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const notificationService = {
  async getNotifications(userId: string, unreadOnly = false) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Notification[];
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) throw error;
  },

  async deleteNotification(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    if (error) throw error;
  },

  async getPreferences(userId: string) {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data as NotificationPreferences | null;
  },

  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>) {
    const { data, error } = await supabase
      .from('notification_preferences')
      .update(preferences)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as NotificationPreferences;
  },

  async initializePreferences(userId: string) {
    const { data, error } = await supabase
      .from('notification_preferences')
      .insert({
        user_id: userId,
        meal_reminders_enabled: true,
        hydration_reminders_enabled: true,
        meal_reminders_time: '12:00',
        follow_notifications_enabled: true,
        reaction_notifications_enabled: true,
      })
      .select()
      .single();
    if (error && error.code !== '23505') throw error;
    return data as NotificationPreferences;
  },

  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) throw error;
    return count || 0;
  },

  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new) {
            callback(payload.new as Notification);
          }
        }
      )
      .subscribe();

    return channel;
  },
};
