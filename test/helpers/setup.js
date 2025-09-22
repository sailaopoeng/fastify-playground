/**
 * Jest setup file for authentication tests
 * This file runs before all tests and sets up common configurations
 */

// Extend Jest matchers for better testing
expect.extend({
  toBeAuthenticatedResponse(response) {
    const pass = response.statusCode === 200 || response.statusCode === 201;
    if (pass) {
      const body = JSON.parse(response.payload);
      const hasResult = body.result === true;
      const hasMessage = typeof body.message === 'string';
      
      if (hasResult && hasMessage) {
        return {
          message: () => `Expected response not to be authenticated`,
          pass: true,
        };
      }
    }
    
    return {
      message: () => `Expected response to be authenticated (status 200/201 with result: true)`,
      pass: false,
    };
  },

  toBeUnauthorizedResponse(response) {
    const pass = response.statusCode === 401;
    if (pass) {
      const body = JSON.parse(response.payload);
      const hasResult = body.result === false;
      const hasUnauthorizedMessage = body.message && body.message.toLowerCase().includes('unauthorized');
      
      if (hasResult && hasUnauthorizedMessage) {
        return {
          message: () => `Expected response not to be unauthorized`,
          pass: true,
        };
      }
    }
    
    return {
      message: () => `Expected response to be unauthorized (status 401 with result: false and 'Unauthorized' message)`,
      pass: false,
    };
  },

  toHaveValidJWTStructure(token) {
    if (typeof token !== 'string') {
      return {
        message: () => `Expected token to be a string, received ${typeof token}`,
        pass: false,
      };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        message: () => `Expected JWT to have 3 parts separated by dots, received ${parts.length} parts`,
        pass: false,
      };
    }

    try {
      // Try to decode the header and payload (not verifying signature here)
      JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      
      return {
        message: () => `Expected token not to have valid JWT structure`,
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `Expected token to have valid JWT structure, but failed to parse: ${error.message}`,
        pass: false,
      };
    }
  }
});

// Set longer timeout for authentication tests that might involve network calls
jest.setTimeout(10000);

// Mock console.warn to suppress configuration warnings in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
});

// Global test data
global.testConstants = {
  TEST_USER: {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
  },
  ADMIN_USER: {
    id: 'admin-user-456',
    email: 'admin@yourdomain.com',
    name: 'Admin User',
    picture: 'https://example.com/admin-avatar.jpg',
  }
};