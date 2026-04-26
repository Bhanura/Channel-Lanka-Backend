require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

(async () => {
  const { data: users, error } = await supabaseAdmin.from('users').select('*').limit(5);
  console.log('users:', users, error);
})();
