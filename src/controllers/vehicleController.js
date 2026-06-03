const Vehicle = require('../models/Vehicle');

// Registrar vehículo
const registerVehicle = async (req, res) => {

    try {

        const {
            brand,
            year,
            model
        } = req.body;

        const userId =
            req.user.id || req.user._id;

        const vehicle = await Vehicle.create({

            user: userId,

            brand,
            year,
            model,

            image: req.file
                ? req.file.filename
                : ''
        });

        res.status(201).json({

            message:
                'Vehículo registrado correctamente',

            vehicle
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            message: error.message
        });
    }
};

// LISTAR VEHÍCULOS
const getUserVehicles = async (req, res) => {

    try {

        const userId =
            req.user.id || req.user._id;

        const vehicles =
            await Vehicle.find({
                user: userId
            });

        res.json({ vehicles });

    } catch (error) {

        res.status(500).json({

            message: error.message
        });
    }
};

module.exports = {

    registerVehicle,
    getUserVehicles
};