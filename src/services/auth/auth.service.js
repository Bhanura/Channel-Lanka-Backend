/**
 * services/auth/auth.service.js
 * Business logic for authentication operations.
 * Interacts with Supabase Auth and our users/patients/doctors/centers tables.
 */
const { supabaseAdmin } = require('../../config/supabase');
const { v4: uuidv4 } = require('uuid');

/**
 * Registers a new patient user.
 * Creates a Supabase Auth user, then populates users + patients tables.
 */
const registerPatient = async ({ email, password, name, dob, gender, nic, location, phone }) => {
  // 1. Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'patient' },
  });
  if (authError) throw { statusCode: 400, message: authError.message };

  const userId = authData.user.id;

  // 2. Insert into users table
  const { error: userError } = await supabaseAdmin.from('users').insert({ user_id: userId, email, role: 'patient' });
  if (userError) throw { statusCode: 500, message: `Failed to create user record: ${userError.message}` };

  // 3. Insert into patients table
  const { data: patient, error: patientError } = await supabaseAdmin
    .from('patients')
    .insert({ 
      user_id: userId, 
      name, 
      dob: dob || null, 
      gender: gender || null, 
      nic: nic || null, 
      location: location || null, 
      phone: phone || null 
    })
    .select()
    .single();

  if (patientError) throw { statusCode: 500, message: patientError.message };

  return { userId, patient };
};

/**
 * Registers a new doctor user (self-registration — requires admin approval).
 */
const registerDoctor = async ({ email, password, name, specialization, licenseNumber, nic, phone, bio, qualifications }) => {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'doctor' },
  });
  if (authError) throw { statusCode: 400, message: authError.message };

  const userId = authData.user.id;

  const { error: userError } = await supabaseAdmin.from('users').insert({ user_id: userId, email, role: 'doctor' });
  if (userError) throw { statusCode: 500, message: `Failed to create user record: ${userError.message}` };

  const { data: doctor, error: doctorError } = await supabaseAdmin
    .from('doctors')
    .insert({
      user_id: userId,
      name,
      specialization: specialization || null,
      license_number: licenseNumber || null,
      nic: nic || null,
      phone: phone || null,
      bio: bio || null,
      verification_status: 'pending', // Needs admin approval
    })
    .select()
    .single();

  if (doctorError) throw { statusCode: 500, message: doctorError.message };

  // Insert qualifications if provided
  if (qualifications && qualifications.length > 0) {
    const qualRows = qualifications.map((q) => ({
      doctor_id: doctor.doctor_id,
      qualification: q.qualification,
      institute: q.institute,
      year: q.year,
    }));
    await supabaseAdmin.from('doctor_qualifications').insert(qualRows);
  }

  return { userId, doctor };
};

/**
 * Registers a new channeling center and its creator admin.
 * The registering user becomes the 'owner' of the center.
 */
const registerCenterAdmin = async ({ email, password, name, centerName, location, phone: centerPhone, description, adminPhone }) => {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'center_admin' },
  });
  if (authError) throw { statusCode: 400, message: authError.message };

  const userId = authData.user.id;

  const { error: userError } = await supabaseAdmin.from('users').insert({ user_id: userId, email, role: 'center_admin' });
  if (userError) throw { statusCode: 500, message: `Failed to create user record: ${userError.message}` };

  // Create the channeling center
  const { data: center, error: centerError } = await supabaseAdmin
    .from('channeling_centers')
    .insert({
      name: centerName,
      location: location || null,
      phone: centerPhone || null,
      email,
      description: description || null,
      verification_status: 'pending',
      created_by: userId,
    })
    .select()
    .single();

  if (centerError) throw { statusCode: 500, message: centerError.message };

  // Make this user the 'owner' admin of the center
  await supabaseAdmin.from('center_admins').insert({
    center_id: center.center_id,
    user_id: userId,
    center_role: 'owner',
    added_by: userId,
  });

  return { userId, center };
};

/**
 * Login — exchanges email/password for a Supabase session token.
 */
const login = async ({ email, password }) => {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (error) throw { statusCode: 401, message: 'Invalid email or password' };

  // Fetch role from our users table
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('user_id, email, role')
    .eq('user_id', data.user.id)
    .single();

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user,
  };
};

module.exports = { registerPatient, registerDoctor, registerCenterAdmin, login };
