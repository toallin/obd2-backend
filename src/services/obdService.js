const VehicleData = require('../models/VehicleData');

const saveData = async (data) => {
    return await VehicleData.create(data);
};

module.exports = { saveData };