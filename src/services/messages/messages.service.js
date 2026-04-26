/**
 * services/messages/messages.service.js
 * Simple in-app message thread between doctors and channeling centers.
 */
const { supabaseAdmin } = require('../../config/supabase');
const notificationsService = require('../notifications/notifications.service');

/** Get message thread between a doctor and a center */
const getThread = async (userId, { doctorId, centerId }) => {
  // Get users involved
  const { data: doctor } = await supabaseAdmin
    .from('doctors').select('user_id').eq('doctor_id', doctorId).single();

  const { data: centerAdmins } = await supabaseAdmin
    .from('center_admins').select('user_id').eq('center_id', centerId);

  const centerUserIds = centerAdmins?.map(a => a.user_id) || [];

  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('center_id', centerId)
    .or(`sender_id.eq.${doctor?.user_id},receiver_id.eq.${doctor?.user_id}`)
    .order('created_at');

  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Send a message */
const sendMessage = async (senderId, { receiverId, centerId, content }) => {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, center_id: centerId, content, is_read: false })
    .select()
    .single();

  if (error) throw { statusCode: 500, message: error.message };

  // Notify the receiver
  await notificationsService.createNotification({
    userId: receiverId,
    title: 'New Message',
    body: content.substring(0, 80),
    type: 'message',
    relatedId: data.id,
  });

  return data;
};

/** Get all threads for a user (grouped by center) */
const getMyThreads = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*, channeling_centers(name), sender:users!sender_id(email)')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw { statusCode: 500, message: error.message };

  // Group by center_id and return latest message per center
  const threadsMap = {};
  for (const msg of data) {
    if (!threadsMap[msg.center_id]) threadsMap[msg.center_id] = msg;
  }
  return Object.values(threadsMap);
};

/** Mark messages in a thread as read */
const markThreadRead = async (userId, centerId) => {
  await supabaseAdmin
    .from('messages')
    .update({ is_read: true })
    .eq('receiver_id', userId)
    .eq('center_id', centerId)
    .eq('is_read', false);
  return { success: true };
};

module.exports = { getThread, sendMessage, getMyThreads, markThreadRead };
