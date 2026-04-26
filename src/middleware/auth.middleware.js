/**
 * src/middleware/auth.middleware.js
 * Verifies Supabase JWT tokens from the Authorization header.
 * Attaches `req.user` = { id, email, role } to the request object.
 */
const { supabaseAdmin } = require('../config/supabase');

/**
 * Middleware: requireAuth
 * Validates the Bearer token in the Authorization header.
 * Rejects unauthenticated requests with 401.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT using Supabase auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !authData.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch user role from our users table (not just JWT metadata)
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('user_id, email, role')
      .eq('user_id', authData.user.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;  // { user_id, email, role }
    next();
  } catch (err) {
    console.error('[auth.middleware] Error:', err.message);
    res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Middleware: optionalAuth
 * Attaches req.user if a valid token is present, but does not block the request.
 * Used for routes that serve both guests and authenticated users (e.g., booking).
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT using Supabase auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !authData.user) {
      req.user = null;
      return next();
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('user_id, email, role')
      .eq('user_id', authData.user.id)
      .single();

    req.user = user || null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

module.exports = { requireAuth, optionalAuth };
