const SessionService = require('../services/SessionService');

exports.getSessionsByLiveClassId = async (req, res) => {
  try {
    const sessions = await SessionService.getSessionsByLiveClassId(req.params.liveClassId);
    res.status(200).json({ success: true, data: sessions });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    const session = await SessionService.createSession(req.body);
    res.status(201).json({ success: true, message: 'Session created', data: session });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getActiveSessions = async (req, res) => {
  try {
    const sessions = await SessionService.getActiveSessions();
    res.status(200).json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const session = await SessionService.updateSession(req.params.id, req.body);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    res.status(200).json({ success: true, message: 'Session updated', data: session });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const result = await SessionService.deleteSession(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    res.status(200).json({ success: true, message: 'Session deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
