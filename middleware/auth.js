/**
 * Authentication middleware for protecting routes
 * This middleware verifies JWT tokens and attaches user info to the request
 */

/**
 * Middleware to require authentication for a route
 * Usage: Add this to the preHandler array of any route that needs authentication
 */
const requireAuth = async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.code(401).send({
      result: false,
      message: 'Unauthorized: Invalid or missing token',
      error: 'Please provide a valid JWT token in the Authorization header'
    });
  }
};

/**
 * Optional authentication middleware
 * Attempts to verify JWT token but doesn't fail if no token is provided
 * Useful for routes that may have different behavior for authenticated vs anonymous users
 */
const optionalAuth = async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    // Token is invalid or missing, but we continue without user info
    request.user = null;
  }
};

/**
 * Admin role check middleware
 * Use this after requireAuth to ensure user has admin privileges
 * Note: This is a basic implementation - you may want to store roles in a database
 */
const requireAdmin = async (request, reply) => {
  if (!request.user) {
    return reply.code(401).send({
      result: false,
      message: 'Unauthorized: Authentication required'
    });
  }

  // For now, we'll use email domain checking for admin access
  // In production, you should store roles in a database
  const adminEmails = ['admin@yourdomain.com']; // Configure your admin emails
  const isAdmin = adminEmails.includes(request.user.email);

  if (!isAdmin) {
    return reply.code(403).send({
      result: false,
      message: 'Forbidden: Admin access required'
    });
  }
};

/**
 * Rate limiting middleware for authentication endpoints
 * Helps prevent brute force attacks on login endpoints
 */
const authRateLimit = {
  max: 10, // Maximum 10 requests
  timeWindow: '15 minutes', // Per 15-minute window
  message: {
    result: false,
    message: 'Too many authentication attempts, please try again later'
  }
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin,
  authRateLimit
};