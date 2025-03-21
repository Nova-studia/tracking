const mongoose = require('mongoose');

const connectDB = async (mongoUrl) => {
  try {
    const conn = await mongoose.connect(mongoUrl, {});
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;