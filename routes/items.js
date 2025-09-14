const { getAllItems, getItemById, addItem, updateItem, deleteItem  } = require('../controllers/items')

const itemSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        description: { type: 'string' }
    }
}

const badRequestSchema = {
    type: 'object',
    properties: {
        result: { type: 'boolean'}, 
        message: { type: 'string' }
    }
}

const successResponseWithArraySchema = {
    type: 'object',
    properties: {
        result: { type: 'boolean' },
        message: { type: 'string' },
        data: { type: 'array', items: itemSchema}
    }
}

const getItemsOptions = {
    schema: {
        description: 'Get all items',
        response: {
            200: successResponseWithArraySchema
        }
    }
}

const getItemByIdOptions = {
    schema: {
        description: 'Get item by id',
        response: {
            200: successResponseWithArraySchema,
            400: badRequestSchema
        }
    }
}

const postItemOptions = {
    schema: {
        description: 'Create a new item',
        body: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                description: { type: 'string' }
            },
            required: ['name', 'description']
        },
        response: {
            201: successResponseWithArraySchema,
            400: badRequestSchema
        }
    }
}

const updateItemOptions = {
    schema: {
        description: 'Update an existing item',
        body: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                description: { type: 'string' },
            },
            required: ['name', 'description']
        },
        response: {
            200: successResponseWithArraySchema,
            400: badRequestSchema
        }
    }
}

const deleteItemOptions = {
    schema: {
        description: 'Delete an item by id',
        response: {
            200: successResponseWithArraySchema,
            400: badRequestSchema
        }
    }
}

function itemRoutes(fastify, options, done){

    fastify.get('/items', getItemsOptions,async (request, reply) => {
        reply.send({ result: true, message: "Items retrieved successfully.", data: getAllItems() });
    })

    fastify.get('/items/:id', getItemByIdOptions, async (request, reply) => {
        const { id } = request.params;

        const item = getItemById(id);
        if(!item){
            reply.code(404).send({ result: false, message: "Item not found."});
        }
        reply.send({ result: true, message: "Item retrieved successfully.", data: [item] });
    })

    fastify.post('/items', postItemOptions, async (request, reply) => {
        const newItem = addItem(request.body);

        reply.code(201).send({result: true, message: "Item created successfully.", data: [newItem]});
    })

    fastify.put('/items/:id', updateItemOptions,async (request, reply) => {
        const { id } = request.params;
        const { name, description } = request.body;

        const item = updateItem(id, name, description);

        if(!item){
            reply.code(404).send({ result: false, message: "Item not found." });
        }
        else{
            reply.send({ result: true, message: "Item updated successfully.", data: [item] });
        }
    })

    fastify.delete('/items/:id', deleteItemOptions, async (request, reply) => {
        const { id } = request.params;

        const deleteSuccess = deleteItem(id);

        if(!deleteSuccess){
            reply.code(404).send({ result: false, message: "Item not found."})
        }
        else{
            reply.send({ result: true, message: "Item deleted successfully.", data: [{ id: parseInt(id) }] });
        }
    })

    done();
}

module.exports = itemRoutes;