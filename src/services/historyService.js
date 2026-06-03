const History = require('../models/History');

const saveHistory = async (result) => {
    return await History.create({ result });
};

const getHistory = async () => {
    return await History.find().sort({ date: -1 });
};

module.exports = { saveHistory, getHistory };