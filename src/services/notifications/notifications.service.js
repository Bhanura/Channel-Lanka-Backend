/**
 * services/notifications/notifications.service.js
 * Creates and retrieves platform notifications.
 * Notifications are pushed to clients via Supabase Realtime (frontend subscribes).
 */
const { supabaseAdmin } = require('../../config/supabase');

/**
 * Create a notification for a user.
 * This insert triggers Supabase Realtime on the frontend automatically.
 */
const createNotification = async ({ userId, title, body, type, relatedId }) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      body,
      type: type || 'general',
      related_id: relatedId || null,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    // Log but don't throw — notifications should not break main flows
    console.error('[notifications] Failed to create notification:', error.message);
    return null;
  }
  return data;
};

/** Get all notifications for a user */
const getNotifications = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Mark a notification as read */
const markAsRead = async (userId, notificationId) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Mark ALL notifications as read */
const markAllAsRead = async (userId) => {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw { statusCode: 500, message: error.message };
  return { success: true };
};

/** Get unread count */
const getUnreadCount = async (userId) => {
  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw { statusCode: 500, message: error.message };
  return { count };
};

module.exports = { createNotification, getNotifications, markAsRead, markAllAsRead, getUnreadCount };
