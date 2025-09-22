const config = require('../config');

describe('Authentication API Endpoints', () => {
    let app;
    let validToken;
    let testUser;

    beforeAll(async () => {
        // Create a new Fastify instance for testing
        const fastify = require('fastify')({ logger: false });
        
        // Register JWT plugin
        await fastify.register(require('@fastify/jwt'), {
            secret: config.jwt.secret,
            sign: {
                expiresIn: config.jwt.expiresIn
            }
        });

        // Register cookie support
        await fastify.register(require('@fastify/cookie'), {
            secret: config.jwt.secret,
            parseOptions: {}
        });

        // Register authentication routes
        await fastify.register(require('../routes/auth'));

        await fastify.ready();
        app = fastify;

        // Create a test user and generate a valid JWT token
        testUser = {
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            picture: 'https://example.com/avatar.jpg',
            iat: Math.floor(Date.now() / 1000),
        };

        validToken = app.jwt.sign(testUser);
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    // Helper function to create authorization headers
    const getAuthHeaders = (token = validToken) => ({
        authorization: `Bearer ${token}`
    });

    describe('GET /auth/google', () => {
        test('should redirect to Google OAuth', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/auth/google'
            });

            expect(response.statusCode).toBe(302);
            expect(response.headers.location).toContain('accounts.google.com');
        });
    });

    describe('GET /auth/google/callback', () => {
        test('should return error when no code provided', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/auth/google/callback'
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.result).toBe(false);
            expect(body.message).toBe('Authorization code is required');
        });

        test('should return error when error parameter is provided', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/auth/google/callback?error=access_denied'
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.result).toBe(false);
            expect(body.message).toBe('Google OAuth error');
        });

        test('should return error for invalid state parameter', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/auth/google/callback?code=test_code&state=invalid_state'
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.result).toBe(false);
            expect(body.message).toBe('Invalid state parameter');
        });
    });

    describe('GET /auth/me', () => {
        test('should return user info with valid token', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/auth/me',
                headers: getAuthHeaders()
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.result).toBe(true);
            expect(body.message).toBe('User information retrieved successfully');
            expect(body.data.id).toBe(testUser.id);
            expect(body.data.email).toBe(testUser.email);
            expect(body.data.name).toBe(testUser.name);
        });

        test('should return 401 without token', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/auth/me'
            });

            expect(response.statusCode).toBe(401);
            const body = JSON.parse(response.payload);
            expect(body.result).toBe(false);
            expect(body.message).toContain('Unauthorized');
        });

        test('should return 401 with invalid token', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/auth/me',
                headers: getAuthHeaders('invalid-token')
            });

            expect(response.statusCode).toBe(401);
            const body = JSON.parse(response.payload);
            expect(body.result).toBe(false);
            expect(body.message).toContain('Unauthorized');
        });

        test('should return 401 with expired token', async () => {
            // Create an expired token
            const expiredUser = {
                ...testUser,
                iat: Math.floor(Date.now() / 1000) - (48 * 60 * 60), // 48 hours ago
                exp: Math.floor(Date.now() / 1000) - (24 * 60 * 60)  // 24 hours ago
            };
            
            const expiredToken = app.jwt.sign(expiredUser);
            
            const response = await app.inject({
                method: 'GET',
                url: '/auth/me',
                headers: getAuthHeaders(expiredToken)
            });

            expect(response.statusCode).toBe(401);
        });
    });

    describe('POST /auth/logout', () => {
        test('should return success message', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/auth/logout'
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.result).toBe(true);
            expect(body.message).toBe('Logout successful. Please discard your token.');
        });
    });

    describe('JWT Token Tests', () => {
        test('should create valid JWT token with correct payload', () => {
            const token = app.jwt.sign(testUser);
            const decoded = app.jwt.decode(token);
            
            expect(decoded.id).toBe(testUser.id);
            expect(decoded.email).toBe(testUser.email);
            expect(decoded.name).toBe(testUser.name);
            expect(decoded.picture).toBe(testUser.picture);
        });

        test('should verify valid JWT token', () => {
            const token = app.jwt.sign(testUser);
            const decoded = app.jwt.verify(token);
            
            expect(decoded.id).toBe(testUser.id);
            expect(decoded.email).toBe(testUser.email);
        });

        test('should throw error for invalid JWT token', () => {
            expect(() => {
                app.jwt.verify('invalid-token');
            }).toThrow();
        });

        test('should throw error for malformed JWT token', () => {
            expect(() => {
                app.jwt.verify('not.a.jwt');
            }).toThrow();
        });
    });
});