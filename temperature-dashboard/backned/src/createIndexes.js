const mongoose = require('mongoose');
const Temperature = require('./mongo_schema');

async function setupIndexes() {
    try {
        await mongoose.connect('mongodb://localhost:27017/temperature_db');
        console.log('Connected to MongoDB');

        await Temperature.createIndexes();
        console.log('Indexes created successfully');

        await mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error setting up indexes:', error);
    } finally {
        process.exit();
    }
}

setupIndexes();
