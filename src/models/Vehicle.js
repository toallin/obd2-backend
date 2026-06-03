const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    brand: {
        type: String,
        required: true
    },

    model: {
        type: String,
        required: true
    },

    year: {
        type: String,
        required: true
    },

    image: {
        type: String,
        default: ''
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    'Vehicle',
    vehicleSchema
);