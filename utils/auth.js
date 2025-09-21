const { OAuth2Client } = require('google-auth-library');
const config = require('../config');

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri
);

/**
 * Generate JWT token payload from user data
 * @param {Object} user - User data from Google
 * @returns {Object} JWT payload
 */
const generateTokenPayload = (user) => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    iat: Math.floor(Date.now() / 1000),
  };
};

/**
 * Verify Google ID token
 * @param {string} idToken - Google ID token
 * @returns {Promise<Object>} Verified user data
 */
const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });
    
    const payload = ticket.getPayload();
    
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified,
    };
  } catch (error) {
    throw new Error('Invalid Google token');
  }
};

/**
 * Get Google OAuth URL for login
 * @param {string} state - Optional state parameter for CSRF protection
 * @returns {string} Google OAuth URL
 */
const getGoogleOAuthURL = (state = '') => {
  const scopes = [
    'openid',
    'email',
    'profile',
  ];

  return googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state,
    include_granted_scopes: true,
  });
};

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from Google
 * @returns {Promise<Object>} Token response
 */
const exchangeCodeForTokens = async (code) => {
  try {
    const { tokens } = await googleClient.getToken(code);
    return tokens;
  } catch (error) {
    throw new Error('Failed to exchange code for tokens');
  }
};

module.exports = {
  generateTokenPayload,
  verifyGoogleToken,
  getGoogleOAuthURL,
  exchangeCodeForTokens,
};