const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function connect() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Link: localhost:${process.env.SERVER_PORT}`);
  } catch (err) {
    console.error('Database connection failed: ', err.message);
    process.exit(1);
  }
};

async function disconnect() {
  try {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected.');
  } catch (err) {
    console.error('Error disconnecting from MongoDB:', err.message);
  }
}

module.exports = {
  connect,
  disconnect,
};