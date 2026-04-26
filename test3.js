require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

(async () => {
  try {
    const userId = '40d870e4-11a0-4530-9a06-770e1c25e878'; // using the test user id
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .insert({ user_id: userId, name: 'Test Empty DOB', dob: '', gender: 'male', nic: '', location: '', phone: '' })
      .select()
      .single();

    console.log(patientError || patient);
  } catch(e) { console.error(e); }
})();
