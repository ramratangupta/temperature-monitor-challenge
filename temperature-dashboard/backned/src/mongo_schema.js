const mongoose = require('mongoose');

const temperatureSchema = new mongoose.Schema({
    id: String,
    temperature: Number,
    timestamp: {
        type: String,
        index: true  // Add index on timestamp for faster sorting
    },
    status: {
        type: String,
        enum: ['NORMAL', 'HIGH', ''],
        default: ''
    },
    processedAt: {
        type: String,
        default: ''
    }
});

// Index for status queries
temperatureSchema.index({ status: 1 });
// Index for timestamp sorting (descending for latest first)
temperatureSchema.index({ timestamp: -1 });

const Temperature = mongoose.model('Temperature', temperatureSchema);

module.exports = Temperature;
