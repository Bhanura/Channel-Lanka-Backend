require('dotenv').config();
const { registerPatient } = require('./src/services/auth/auth.service');

(async () => {
  try {
    const res = await registerPatient({
      email: `test${Date.now()}@test.com`,
      password: 'Password123!',
      name: 'Test User',
      dob: '2000-01-01',
      gender: 'Male',
      nic: '123456789V',
      location: 'Colombo',
      phone: '0712345678'
    });
    console.log('Success:', res);
  } catch (err) {
    console.error('Error:', err);
  }
})();
