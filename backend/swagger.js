const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Stock Tracker API',
            version: '1.0.0',
            description: 'Professional stock tracking dashboard API with portfolio management, watchlist, and intelligent alerts',
            contact: {
                name: 'Stock Tracker',
                url: 'http://localhost:5000'
            }
        },
        servers: [
            { url: 'http://localhost:5000/api/v1', description: 'Local Development' },
            { url: 'https://stock-tracker-1-sj4n.onrender.com/api/v1', description: 'Production' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'object',
                            properties: {
                                code: { type: 'string' },
                                message: { type: 'string' },
                                timestamp: { type: 'string', format: 'date-time' },
                                path: { type: 'string' }
                            }
                        }
                    }
                },
                Portfolio: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        symbol: { type: 'string' },
                        quantity: { type: 'number' },
                        buy_price: { type: 'number' },
                        buy_date: { type: 'string', format: 'date' },
                        currentPrice: { type: 'number' },
                        currentValue: { type: 'number' },
                        profitLoss: { type: 'number' },
                        profitLossPercent: { type: 'number' }
                    }
                },
                Alert: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        symbol: { type: 'string' },
                        message: { type: 'string' },
                        alertType: { type: 'string', enum: ['PRICE_UP', 'PRICE_DOWN', 'VOLUME_SPIKE', 'MANUAL', 'PERCENTAGE_CHANGE', 'TARGET_PRICE'] },
                        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                },
                AlertRule: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        symbol: { type: 'string' },
                        template_type: { type: 'string', enum: ['PERCENTAGE_CHANGE', 'TARGET_PRICE', 'VOLUME_SPIKE'] },
                        condition_operator: { type: 'string', enum: ['ABOVE', 'BELOW'] },
                        condition_value: { type: 'number' },
                        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                        is_active: { type: 'boolean' }
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ['./routes/*.js', './controllers/*.js']
};

const specs = swaggerJsdoc(options);

const swaggerSetup = (app) => {
    app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(specs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Stock Tracker API Docs'
    }));
    app.get('/api/v1/docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
    });
};

module.exports = swaggerSetup;
