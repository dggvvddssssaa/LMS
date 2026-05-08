async function testLogin() {
  try {
    const res = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@admin.com', password: 'admin123' })
    });
    const data = await res.json();
    console.log('Login result:', data);
  } catch (err) {
    console.error('Login failed:', err);
  }
}
testLogin();
