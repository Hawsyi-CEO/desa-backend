const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login to http://localhost:5000/api/auth/login');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'superadmin@desa.com',
      password: 'admin123'
    });
    
    console.log('\nLogin Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\nUser:', response.data.data.user);
    console.log('Token:', response.data.data.token);
    console.log('Role:', response.data.data.user.role);
    
  } catch (error) {
    console.log('\nLogin Failed!');
    console.log('Error:', error.response?.data || error.message);
  }
}

testLogin();
