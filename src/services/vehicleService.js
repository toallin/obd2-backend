const Vehicle = require('../models/Vehicle');

const createVehicle = async (data) => {
    return await Vehicle.create(data);
};

const getVehiclesByUser = async (userId) => {
    return await Vehicle.find({ userId });
};

module.exports = {
    createVehicle,
    getVehiclesByUser
};