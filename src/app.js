const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../docs/swagger.json');

const authRoutes = require('./routes/authRoutes');
const dishRoutes = require('./routes/dishRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const app = express();

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse incoming JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Ignore browser favicon requests
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Swagger Interactive API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check and root welcome endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Dish Booking System API with Multi-Role Access & Password Reset',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      dishes: '/api/dishes',
      orders: '/api/orders',
    },
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Dish Booking System',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);

// Catch 404 routes
app.use(notFound);

// Global Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
