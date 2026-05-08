const LiveClassService = require('../services/LiveClassService');

exports.getLiveClassDetails = async (req, res) => {
  try {
    const liveClass = await LiveClassService.getLiveClassDetails(req.params.id);
    res.status(200).json({ success: true, data: liveClass });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

exports.getLiveClassByCourseId = async (req, res) => {
  try {
    const liveClass = await LiveClassService.getLiveClassByCourseId(req.params.courseId);
    res.status(200).json({ success: true, data: liveClass });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

exports.createLiveClass = async (req, res) => {
  try {
    const newClass = await LiveClassService.createLiveClass(req.body);
    res.status(201).json({ success: true, message: 'Live class created', data: newClass });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getMonitorRooms = async (req, res) => {
  try {
    const rooms = await LiveClassService.getActiveRooms();
    res.status(200).json({ success: true, data: rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateLiveClass = async (req, res) => {
  try {
    const updatedClass = await LiveClassService.updateLiveClass(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, message: 'Live class updated', data: updatedClass });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
