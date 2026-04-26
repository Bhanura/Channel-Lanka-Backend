require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

(async () => {
  try {
    // 1. Get an admin
    const { data: admins, error: err1 } = await supabaseAdmin.from('users').select('user_id').eq('role', 'platform_admin').limit(1);
    if (!admins || admins.length === 0) return console.log('No admin found', err1);
    const admin = admins[0];
    
    // 2. Get a pending center
    const { data: centers, error: err2 } = await supabaseAdmin.from('channeling_centers').select('center_id').eq('verification_status', 'pending').limit(1);
    if (!centers || centers.length === 0) return console.log('No pending center found', err2);
    const center = centers[0];
    
    console.log(`Approving center ${center.center_id} by admin ${admin.user_id}...`);
    
    const { verifyCenter } = require('./src/services/admin/admin.service');
    const result = await verifyCenter(admin.user_id, center.center_id, { status: 'approved', reason: '' });
    console.log('Success:', result);
  } catch (err) {
    console.error('Error:', err);
  }
})();
