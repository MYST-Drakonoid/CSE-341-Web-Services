
import swaggerAutogen from 'swagger-autogen';
import { readFileSync, writeFileSync } from 'node:fs';

const doc = {
    info: {
        title: 'Household Inventory API',
        description: 'API for managing household inventory items and storage locations.',
        version: '1.0.0'
    },

    servers: [
        {
            url: '/'
        }
    ],

    tags: [
        {
            name: 'Items',
            description: 'Manage household inventory items'
        },
        {
            name: 'Locations',
            description: 'Manage storage locations'
        }
    ],

    components: {
        '@schemas': {
            ItemInput: {
                type: 'object',
                required: ['name', 'type', 'quantity', 'locationId'],
                properties: {
                    name: {
                        type: 'string',
                        example: 'Nintendo DSi'
                    },
                    serialNumber: {
                        type: 'string',
                        nullable: true,
                        example: 'TW71040796'
                    },
                    type: {
                        type: 'string',
                        example: 'Handheld Gaming'
                    },
                    quantity: {
                        type: 'integer',
                        minimum: 0,
                        example: 1
                    },
                    locationId: {
                        type: 'string',
                        example: '507f1f77bcf86cd799439011'
                    },
                    condition: {
                        type: 'string',
                        nullable: true
                    },
                    notes: {
                        type: 'string',
                        nullable: true
                    }
                }
            },

            LocationInput: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: {
                        type: 'string',
                        example: 'Desk'
                    },
                    room: {
                        type: 'string',
                        nullable: true,
                        example: 'Office'
                    },
                    notes: {
                        type: 'string',
                        nullable: true
                    }
                }
            }
        }
    }
};

const outputFile = './swagger.json';
const endpointsFiles = ['./server.js'];

await swaggerAutogen({ openapi: '3.0.0' })(
    outputFile,
    endpointsFiles,
    doc
);


const spec = JSON.parse(readFileSync(outputFile, 'utf8'));

for (const [path, operations] of Object.entries(spec.paths || {})) {
    let tag;

    if (path.startsWith('/api/inventory')) {
        tag = 'Items';
    } else if (path.startsWith('/api/locations')) {
        tag = 'Locations';
    } else {
        continue;
    }

    for (const method of ['get', 'post', 'put', 'delete', 'patch']) {
        if (operations[method]) {
            operations[method].tags = [tag];
        }
    }
}

// Document location deletion conflict
const deleteLocation = spec.paths?.['/api/locations/{id}']?.delete;

if (deleteLocation) {
    deleteLocation.responses ||= {};
    deleteLocation.responses['409'] = {
        description: 'Location contains inventory items.'
    };
}

writeFileSync(outputFile, JSON.stringify(spec, null, 2) + '\n');

