require('dotenv').config();

const config = {
  port: process.env.PORT || 5000,
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: '24h'
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${process.env.PORT || 5000}/auth/google/callback`
  },
  app: {
    url: process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`
  }
};

// Validate required environment variables
if (!config.google.clientId || !config.google.clientSecret) {
  console.warn('Warning: Google OAuth credentials are not set. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file');
}

module.exports = config;