const mongoose = require('mongoose');

let memoryServerInstance = null;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dish_booking_db';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2500, // Quick check
    });

    console.log(`[Database] MongoDB connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[Database Notice] Standard MongoDB connection at '${mongoURI}' was not reachable (${error.message}).`);
    console.log('[Database] Initializing portable local in-memory database for zero-config execution...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const inMemoryUri = memoryServerInstance.getUri();
      const conn = await mongoose.connect(inMemoryUri);
      console.log(`[Database] Portable in-memory MongoDB initialized successfully at: ${inMemoryUri}`);
      return conn;
    } catch (memErr) {
      console.error(`[Database Error] Could not initialize fallback database: ${memErr.message}`);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
