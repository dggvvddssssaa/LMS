const SessionRepository = require('../repositories/SessionRepository');

class SessionService {
  async createSession(sessionData) {
    if (!sessionData.liveClassId || !sessionData.title || !sessionData.start_time) {
      throw new Error('Missing required session data');
    }
    return await SessionRepository.create(sessionData);
  }

  async getSessionsByLiveClassId(liveClassId) {
    if (!liveClassId) {
      throw new Error('LiveClass ID is required');
    }
    return await SessionRepository.findByLiveClassId(liveClassId);
  }

  async getActiveSessions() {
    return await SessionRepository.findActiveSessions();
  }

  async updateSession(id, sessionData) {
    return await SessionRepository.update(id, sessionData);
  }

  async deleteSession(id) {
    return await SessionRepository.delete(id);
  }
}

module.exports = new SessionService();
