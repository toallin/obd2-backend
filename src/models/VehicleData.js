const mongoose = require('mongoose');

const vehicleDataSchema =
    new mongoose.Schema({

        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: true
        },

        // TXT ORIGINAL
        obd2Codes: {
            type: String,
            required: true
        },

        // CODIGOS TRADUCIDOS
        translations: [

            {

                code: String,

                description: String,

                affects: String

            }

        ],

        extractedAt: {
            type: Date,
            default: Date.now
        }

    });

module.exports =
    mongoose.model(
        'VehicleData',
        vehicleDataSchema
    );