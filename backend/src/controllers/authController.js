const AuthService = require('../services/AuthService');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const { user, token } = await AuthService.register({ name, email, password, role: 'student' });
    res.status(201).json({ success: true, message: 'Registered successfully', data: { user, token } });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const { user, token } = await AuthService.login(email, password);
    res.status(200).json({ success: true, message: 'Logged in successfully', data: { user, token } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(401).json({ success: false, message: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    // req.user is populated by verifyToken middleware
    res.status(200).json({ success: true, data: req.user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
