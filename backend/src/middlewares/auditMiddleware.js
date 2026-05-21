const prisma = require('../config/prisma');

const auditLog = (action, resource) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      const resourceId = req.params.id
        ? parseInt(req.params.id, 10)
        : body?.data?.id || null;

      prisma.audit_log.create({
        data: {
          user_id: req.user?.id || null,
          action,
          resource,
          resource_id: resourceId,
          details: {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            body: req.method !== 'GET' ? JSON.stringify(req.body).slice(0, 500) : null
          },
          ip_address: req.ip || req.connection?.remoteAddress || null
        }
      }).catch(() => {});

      return originalJson(body);
    };
    next();
  };
};

module.exports = { auditLog };
