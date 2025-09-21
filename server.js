const fastify = require('fastify')({ logger: true });
const config = require('./config');

// Register JWT plugin
fastify.register(require('@fastify/jwt'), {
    secret: config.jwt.secret,
    sign: {
        expiresIn: config.jwt.expiresIn
    }
});

// Register cookie support for OAuth state
fastify.register(require('@fastify/cookie'), {
    secret: config.jwt.secret,
    parseOptions: {}
});

// Register Swagger plugin
fastify.register(require('@fastify/swagger'), {
    swagger: {
        info: {
            title: 'Fastify API with Authentication',
            description: 'Testing the Fastify API with JWT and Google OAuth',
            version: '1.0.0'
        },
        host: `localhost:${config.port}`,
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        securityDefinitions: {
            bearerAuth: {
                type: 'apiKey',
                name: 'Authorization',
                in: 'header',
                description: 'Enter JWT token in format: Bearer <token>'
            }
        }
    }
});

// Register Swagger UI plugin
fastify.register(require('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    swagger: {
        info: {
            title: 'Fastify API with Authentication',
            description: 'Testing the Fastify API with JWT and Google OAuth',
            version: '1.0.0'
        },
        host: `localhost:${config.port}`,
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        securityDefinitions: {
            bearerAuth: {
                type: 'apiKey',
                name: 'Authorization',
                in: 'header',
                description: 'Enter JWT token in format: Bearer <token>'
            }
        }
    },
    exposeRoute: true
});

// Register routes
fastify.register(require('./routes/auth'));
fastify.register(require('./routes/items'));

fastify.get('/', async (request, reply) => {
    reply.send({ message: "Fastify API" });
});

const start = async () => {
    try {
        await fastify.listen({ port: config.port });
        fastify.log.info(`Server listening on port ${config.port}`);
        fastify.log.info(`Swagger docs available at http://localhost:${config.port}/docs`);
        fastify.log.info(`Google OAuth login at http://localhost:${config.port}/auth/google`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

if (require.main === module) {
    start();
}

module.exports = { fastify };