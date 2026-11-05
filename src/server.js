require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = parseInt(process.env.PORT, 10) || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log('=======================================================');
      console.log(` Dish Booking System running on port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Swagger Docs: http://localhost:${PORT}/api-docs`);
      console.log(` Health Check: http://localhost:${PORT}/health`);
      console.log('=======================================================');
    });

    return server;
  } catch (error) {
    console.error(`[Fatal Server Error] ${error.message}`);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = {
  app,
  startServer,
};
