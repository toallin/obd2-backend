const mongoose = require('mongoose');

const obd2CodeSchema = new mongoose.Schema({

    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    },

    code: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    }

}, {
    timestamps: true
});

module.exports =
    mongoose.model('OBD2Code', obd2CodeSchema);