const UserService = require('../services/UserService');

exports.getProfile = async (req, res) => {
  try {
    const user = await UserService.getUserProfile(req.params.id || req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserService.verifyInstructor(id);
    res.status(200).json({ success: true, message: 'Instructor verified successfully', data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const newUser = await UserService.createUser(req.body);
    res.status(201).json({ success: true, message: 'User created successfully', data: newUser });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const details = await UserService.getUserDetails(id);
    res.status(200).json({ success: true, data: details });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await UserService.deleteUser(id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
