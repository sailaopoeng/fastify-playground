const { resetItems } = require('../controllers/items');
const config = require('../config');

describe('Item API Endpoints', () => {
    let app;
    let validToken;
    let testUser;

    beforeAll(async () => {
        // Create a new Fastify instance for testing
        const fastify = require('fastify')({ logger: false });
        
        // Register JWT plugin for testing
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

        // Register routes
        await fastify.register(require('../routes/items'));

        fastify.get('/', async (request, reply) => {
            reply.send({ message: "Fastify API" });
        });

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

    beforeEach(() => {
        // Reset items array before each test
        resetItems();
    });

    // Helper function to create authorization headers
    const getAuthHeaders = (token = validToken) => ({
        authorization: `Bearer ${token}`
    });

    test('GET / - success', async () => {
        const response = await app.inject ({
            method: 'GET',
            url: '/',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body).toEqual({ message: "Fastify API" })
    })

    test('GET /items - success', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/items'
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.result).toBe(true);
        expect(body.message).toBe("Items retrieved successfully.");
        expect(Array.isArray(body.data)).toBe(true);
    });

    test('GET /items/:id - success', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/items/1'
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.result).toBe(true);
        expect(body.message).toBe("Item retrieved successfully.");
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data[0].id).toBe(1);
    })

    test('GET /items/:id - not found', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/items/999'
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.payload);
        expect(body.result).toBe(false);
        expect(body.message).toBe("Item not found.");
    })

    test('POST /items - success with authentication', async () => {
        const newItem = { name: "NewTestItem", description: "New test item description" };
        const response = await app.inject({
            method: 'POST',
            url: '/items',
            headers: getAuthHeaders(),
            payload: newItem
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);
        expect(body.result).toBe(true);
        expect(body.message).toBe("Item created successfully.");
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data[0].name).toBe("NewTestItem");
    });

    test('POST /items - unauthorized without token', async () => {
        const newItem = { name: "UnauthorizedItem", description: "This should fail" };
        const response = await app.inject({
            method: 'POST',
            url: '/items',
            payload: newItem
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.payload);
        expect(body.result).toBe(false);
        expect(body.message).toContain("Unauthorized");
    });

    test('POST /items - unauthorized with invalid token', async () => {
        const newItem = { name: "InvalidTokenItem", description: "This should fail" };
        const response = await app.inject({
            method: 'POST',
            url: '/items',
            headers: getAuthHeaders('invalid-token'),
            payload: newItem
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.payload);
        expect(body.result).toBe(false);
        expect(body.message).toContain("Unauthorized");
    });

    test('POST /items - Invalid payload with authentication', async () => {
        const newItem = { name: "SecondTestItem" }; // missing description
        const response = await app.inject({
            method: 'POST',
            url: '/items',
            headers: getAuthHeaders(),
            payload: newItem
        });

        expect(response.statusCode).toBe(400);
    });

    test ('PUT /items/:id - success with authentication', async () => {
        const updateItem = { name: "UpdatedItem", description: "Updated item description" };
        const response = await app.inject({
            method: 'PUT',
            url: '/items/1',
            headers: getAuthHeaders(),
            payload: updateItem
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.result).toBe(true);
        expect(body.message).toBe("Item updated successfully.");
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data[0].name).toBe("UpdatedItem");
    });

    test ('PUT /items/:id - unauthorized without token', async () => {
        const updateItem = { name: "UnauthorizedUpdate", description: "This should fail" };
        const response = await app.inject({
            method: 'PUT',
            url: '/items/1',
            payload: updateItem
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.payload);
        expect(body.result).toBe(false);
        expect(body.message).toContain("Unauthorized");
    });

    test ('PUT /items/:id - not found with authentication', async () => {
        const updateItem = { name: "UpdatedItem", description: "Updated item description" };
        const response = await app.inject({
            method: 'PUT',
            url: '/items/999',
            headers: getAuthHeaders(),
            payload: updateItem
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.payload);
        expect(body.result).toBe(false);
        expect(body.message).toBe("Item not found.");
    });

    test ('PUT /items/:id - invalid payload with authentication', async () => {
        const invalidUpdate = { invalid: "data" };
        const response = await app.inject({
            method: 'PUT',
            url: '/items/1',
            headers: getAuthHeaders(),
            payload: invalidUpdate
        });

        expect(response.statusCode).toBe(400);
    });

    test('DELETE /items/:id - success with authentication', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: '/items/1',
            headers: getAuthHeaders()
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.result).toBe(true);
        expect(body.message).toBe("Item deleted successfully.");
    });

    test('DELETE /items/:id - unauthorized without token', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: '/items/1'
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.payload);
        expect(body.result).toBe(false);
        expect(body.message).toContain("Unauthorized");
    });

    test('DELETE /items/:id - not found with authentication', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: '/items/9999',
            headers: getAuthHeaders()
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.payload);
        expect(body.result).toBe(false);
        expect(body.message).toBe("Item not found.");
    });

    // Additional authentication-related tests
    test('JWT Token - should contain correct user information', () => {
        const decoded = app.jwt.decode(validToken);
        expect(decoded.id).toBe(testUser.id);
        expect(decoded.email).toBe(testUser.email);
        expect(decoded.name).toBe(testUser.name);
    });

    test('JWT Token - expired token should be rejected', async () => {
        // Create an expired token (backdated by 2 days)
        const expiredUser = {
            ...testUser,
            iat: Math.floor(Date.now() / 1000) - (48 * 60 * 60), // 48 hours ago
            exp: Math.floor(Date.now() / 1000) - (24 * 60 * 60)  // 24 hours ago
        };
        
        const expiredToken = app.jwt.sign(expiredUser);
        
        const response = await app.inject({
            method: 'POST',
            url: '/items',
            headers: getAuthHeaders(expiredToken),
            payload: { name: "Test", description: "Test" }
        });

        expect(response.statusCode).toBe(401);
    });

    test('Authentication - malformed Bearer token should be rejected', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/items',
            headers: { authorization: 'InvalidBearer token' },
            payload: { name: "Test", description: "Test" }
        });

        expect(response.statusCode).toBe(401);
    });

    test('Authentication - missing Bearer prefix should be rejected', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/items',
            headers: { authorization: validToken }, // Missing "Bearer "
            payload: { name: "Test", description: "Test" }
        });

        expect(response.statusCode).toBe(401);
    });

});