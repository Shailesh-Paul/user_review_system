const aiRateLimitMap = new Map();

export const aiRateLimiter = (req, res, next) => {
  const userId = req.user?.id || req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const userRecord = aiRateLimitMap.get(userId) || { count: 0, resetTime: now + windowMs };

  if (now > userRecord.resetTime) {
    userRecord.count = 1;
    userRecord.resetTime = now + windowMs;
  } else {
    userRecord.count += 1;
  }

  aiRateLimitMap.set(userId, userRecord);

  if (userRecord.count > maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many AI draft generation requests. Please wait a minute before trying again.'
    });
  }

  next();
};
