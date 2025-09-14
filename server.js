const fastify = require('fastify')({ logger: true });

PORT = 5000; //TODO: move to .env file

// Register Swagger plugin
fastify.register(require('@fastify/swagger'), {
    swagger: {
        info: {
            title: 'Fastify API',
            description: 'Testing the Fastify API',
            version: '1.0.0'
        },
        host: `localhost:${PORT}`,
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json']
    }
});

// Register Swagger UI plugin
fastify.register(require('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    swagger: {
        info: {
            title: 'Fastify API',
            description: 'Testing the Fastify API',
            version: '1.0.0'
        },
        host: `localhost:${PORT}`,
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json']
    },
    exposeRoute: true
});

fastify.register(require('./routes/items'));

fastify.get('/', async (request, reply) => {
    reply.send({ message: "Fastify API" });
});

const start = async () => {
    try {
        await fastify.listen({ port: PORT });
        fastify.log.info(`Server listening on port ${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();