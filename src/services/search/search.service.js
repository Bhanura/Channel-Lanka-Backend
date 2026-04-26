/**
 * services/search/search.service.js
 * Full-text and filtered search for doctors and channeling centers.
 */
const { supabaseAdmin } = require('../../config/supabase');

/**
 * Search doctors by name or specialization.
 * Returns only approved doctors.
 */
const searchDoctors = async ({ q, specialization, page = 1, limit = 12 }) => {
  const from = (page - 1) * limit;
  let query = supabaseAdmin
    .from('doctors')
    .select('doctor_id, name, specialization, avatar_url, bio, doctor_qualifications(qualification, institute), doctor_ratings(rate_value)', { count: 'exact' })
    .eq('verification_status', 'approved');

  if (q) {
    query = query.or(`name.ilike.%${q}%,specialization.ilike.%${q}%`);
  }
  if (specialization) {
    query = query.ilike('specialization', `%${specialization}%`);
  }

  const { data, count, error } = await query
    .order('name')
    .range(from, from + limit - 1);

  if (error) throw { statusCode: 500, message: error.message };

  const enriched = (data || []).map(d => ({
    ...d,
    avg_rating: d.doctor_ratings?.length
      ? (d.doctor_ratings.reduce((s, r) => s + r.rate_value, 0) / d.doctor_ratings.length).toFixed(1)
      : null,
  }));

  return { doctors: enriched, total: count, page, limit };
};

/**
 * Search channeling centers by name or location.
 * Returns only approved centers.
 */
const searchCenters = async ({ q, location, page = 1, limit = 12 }) => {
  const from = (page - 1) * limit;
  let query = supabaseAdmin
    .from('channeling_centers')
    .select('center_id, name, location, phone, email, description, logo_url, center_ratings(rate_value)', { count: 'exact' })
    .eq('verification_status', 'approved');

  if (q) {
    query = query.or(`name.ilike.%${q}%,location.ilike.%${q}%`);
  }
  if (location) {
    query = query.ilike('location', `%${location}%`);
  }

  const { data, count, error } = await query
    .order('name')
    .range(from, from + limit - 1);

  if (error) throw { statusCode: 500, message: error.message };

  const enriched = (data || []).map(c => ({
    ...c,
    avg_rating: c.center_ratings?.length
      ? (c.center_ratings.reduce((s, r) => s + r.rate_value, 0) / c.center_ratings.length).toFixed(1)
      : null,
  }));

  return { centers: enriched, total: count, page, limit };
};

/** Get all available specializations (for search filter dropdown) */
const getSpecializations = async () => {
  const { data, error } = await supabaseAdmin
    .from('doctors')
    .select('specialization')
    .eq('verification_status', 'approved');

  if (error) throw { statusCode: 500, message: error.message };
  return [...new Set(data.map(d => d.specialization).filter(Boolean))].sort();
};

module.exports = { searchDoctors, searchCenters, getSpecializations };
