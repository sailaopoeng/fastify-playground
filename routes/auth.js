const { 
  getGoogleOAuthURL, 
  exchangeCodeForTokens, 
  verifyGoogleToken, 
  generateTokenPayload 
} = require('../utils/auth');

async function authRoutes(fastify, options) {
  // Login route - redirects to Google OAuth
  fastify.get('/auth/google', {
    schema: {
      description: 'Initiate Google OAuth login',
      tags: ['Authentication'],
      response: {
        302: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const state = Math.random().toString(36).substring(7);
      const googleOAuthURL = getGoogleOAuthURL(state);
      
      // Store state in session or cookie for CSRF protection
      reply.setCookie('oauth_state', state, {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        maxAge: 600000 // 10 minutes
      });
      
      return reply.redirect(googleOAuthURL);
    } catch (error) {
      return reply.code(500).send({
        result: false,
        message: 'Failed to initiate Google OAuth',
        error: error.message
      });
    }
  });

  // OAuth callback route
  fastify.get('/auth/google/callback', {
    schema: {
      description: 'Handle Google OAuth callback',
      tags: ['Authentication'],
      querystring: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          state: { type: 'string' },
          error: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            result: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    picture: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { code, state, error } = request.query;
      
      if (error) {
        return reply.code(400).send({
          result: false,
          message: 'Google OAuth error',
          error
        });
      }

      if (!code) {
        return reply.code(400).send({
          result: false,
          message: 'Authorization code is required'
        });
      }

      // Verify state parameter for CSRF protection
      const storedState = request.cookies.oauth_state;
      if (!storedState || storedState !== state) {
        return reply.code(400).send({
          result: false,
          message: 'Invalid state parameter'
        });
      }

      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code);
      
      if (!tokens.id_token) {
        return reply.code(400).send({
          result: false,
          message: 'Failed to get ID token from Google'
        });
      }

      // Verify the ID token and get user info
      const user = await verifyGoogleToken(tokens.id_token);
      
      // Generate JWT token
      const tokenPayload = generateTokenPayload(user);
      const jwtToken = fastify.jwt.sign(tokenPayload);

      // Clear the state cookie
      reply.clearCookie('oauth_state');

      return reply.send({
        result: true,
        message: 'Authentication successful',
        data: {
          token: jwtToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture
          }
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        result: false,
        message: 'Authentication failed',
        error: error.message
      });
    }
  });

  // Get current user info (protected route)
  fastify.get('/auth/me', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.code(401).send({
          result: false,
          message: 'Unauthorized: Invalid or missing token'
        });
      }
    },
    schema: {
      description: 'Get current authenticated user information',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            result: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                picture: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    return reply.send({
      result: true,
      message: 'User information retrieved successfully',
      data: {
        id: request.user.id,
        email: request.user.email,
        name: request.user.name,
        picture: request.user.picture
      }
    });
  });

  // Logout route
  fastify.post('/auth/logout', {
    schema: {
      description: 'Logout user (client should discard token)',
      tags: ['Authentication'],
      response: {
        200: {
          type: 'object',
          properties: {
            result: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return reply.send({
      result: true,
      message: 'Logout successful. Please discard your token.'
    });
  });
}

module.exports = authRoutes;