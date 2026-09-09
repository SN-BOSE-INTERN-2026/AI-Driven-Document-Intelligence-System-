const mongoose = require('mongoose');

const connectDB = async (retries = 5, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-doc-intel', {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      });
      console.log(`✅ MongoDB connected successfully`);
      return;
    } catch (error) {
      console.error(`⚠️  MongoDB connection attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt < retries) {
        console.log(`   Retrying in ${delay / 1000}s...`);
        await new Promise(res => setTimeout(res, delay));
        delay = Math.min(delay * 2, 30000); // exponential backoff, max 30s
      } else {
        console.error('❌ All MongoDB connection attempts failed. Server will run without DB — API calls requiring DB will return errors.');
        // Don't exit — let server keep running so healthcheck endpoints still respond
      }
    }
  }
};

module.exports = connectDB;
