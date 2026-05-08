const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: 1, email: 'admin@admin.com', role: 'admin' },
  'supersecretjwtkeylmswebrtc',
  { expiresIn: '24h' }
);

async function testApi() {
  try {
    const headers = { Authorization: `Bearer ${token}` };
    const baseUrl = 'http://127.0.0.1:4000/api';
    
    console.log('--- Testing /users ---');
    try {
      const res = await fetch(`${baseUrl}/users`, { headers });
      const data = await res.json();
      console.log('Users:', JSON.stringify(data, null, 2));
    } catch(e) { console.error('Users error:', e.message); }

    console.log('\n--- Testing /stats/dashboard ---');
    try {
      const res = await fetch(`${baseUrl}/stats/dashboard`, { headers });
      const data = await res.json();
      console.log('Stats:', JSON.stringify(data, null, 2));
    } catch(e) { console.error('Stats error:', e.message); }

  } catch(e) {
    console.error(e);
  }
}

testApi();
