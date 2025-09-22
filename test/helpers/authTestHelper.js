const config = require('../config');

/**
 * Test utilities for JWT authentication testing
 */
class AuthTestHelper {
    constructor(fastifyInstance) {
        this.app = fastifyInstance;
    }

    /**
     * Create a test user object
     * @param {Object} overrides - Properties to override in the default test user
     * @returns {Object} Test user object
     */
    createTestUser(overrides = {}) {
        return {
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            picture: 'https://example.com/avatar.jpg',
            iat: Math.floor(Date.now() / 1000),
            ...overrides
        };
    }

    /**
     * Generate a valid JWT token for testing
     * @param {Object} user - User object to encode in the token
     * @returns {string} JWT token
     */
    generateValidToken(user = null) {
        const testUser = user || this.createTestUser();
        return this.app.jwt.sign(testUser);
    }

    /**
     * Generate an expired JWT token for testing
     * @param {Object} user - User object to encode in the token
     * @returns {string} Expired JWT token
     */
    generateExpiredToken(user = null) {
        const testUser = user || this.createTestUser({
            iat: Math.floor(Date.now() / 1000) - (48 * 60 * 60), // 48 hours ago
            exp: Math.floor(Date.now() / 1000) - (24 * 60 * 60)  // 24 hours ago
        });
        return this.app.jwt.sign(testUser);
    }

    /**
     * Create authorization headers with Bearer token
     * @param {string} token - JWT token
     * @returns {Object} Headers object with Authorization header
     */
    getAuthHeaders(token) {
        return {
            authorization: `Bearer ${token}`
        };
    }

    /**
     * Create authorization headers with a valid token
     * @param {Object} user - Optional user object to encode
     * @returns {Object} Headers object with valid Authorization header
     */
    getValidAuthHeaders(user = null) {
        const token = this.generateValidToken(user);
        return this.getAuthHeaders(token);
    }

    /**
     * Test helper to verify unauthorized response
     * @param {Object} response - Fastify inject response
     */
    expectUnauthorizedResponse(response) {
        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.payload);
        expect(body.result).toBe(false);
        expect(body.message).toContain('Unauthorized');
    }

    /**
     * Test helper to verify successful response
     * @param {Object} response - Fastify inject response
     * @param {number} statusCode - Expected status code (default: 200)
     */
    expectSuccessResponse(response, statusCode = 200) {
        expect(response.statusCode).toBe(statusCode);
        const body = JSON.parse(response.payload);
        expect(body.result).toBe(true);
        return body;
    }

    /**
     * Test helper to verify error response
     * @param {Object} response - Fastify inject response
     * @param {number} statusCode - Expected status code
     * @param {string} expectedMessage - Expected error message (partial match)
     */
    expectErrorResponse(response, statusCode, expectedMessage = null) {
        expect(response.statusCode).toBe(statusCode);
        const body = JSON.parse(response.payload);
        expect(body.result).toBe(false);
        if (expectedMessage) {
            expect(body.message).toContain(expectedMessage);
        }
        return body;
    }

    /**
     * Create a test suite for authentication scenarios
     * @param {string} method - HTTP method
     * @param {string} url - Endpoint URL
     * @param {Object} payload - Request payload (optional)
     */
    createAuthTestSuite(method, url, payload = null) {
        const testName = `${method} ${url}`;
        
        return {
            testUnauthorized: () => {
                test(`${testName} - unauthorized without token`, async () => {
                    const options = { method, url };
                    if (payload) options.payload = payload;
                    
                    const response = await this.app.inject(options);
                    this.expectUnauthorizedResponse(response);
                });
            },
            
            testInvalidToken: () => {
                test(`${testName} - unauthorized with invalid token`, async () => {
                    const options = {
                        method,
                        url,
                        headers: this.getAuthHeaders('invalid-token')
                    };
                    if (payload) options.payload = payload;
                    
                    const response = await this.app.inject(options);
                    this.expectUnauthorizedResponse(response);
                });
            },
            
            testExpiredToken: () => {
                test(`${testName} - unauthorized with expired token`, async () => {
                    const options = {
                        method,
                        url,
                        headers: this.getAuthHeaders(this.generateExpiredToken())
                    };
                    if (payload) options.payload = payload;
                    
                    const response = await this.app.inject(options);
                    this.expectUnauthorizedResponse(response);
                });
            }
        };
    }
}

module.exports = AuthTestHelper;