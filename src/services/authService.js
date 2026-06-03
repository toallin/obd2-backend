const User = require('../models/User');

const login = async (email, password) => {
    const user = await User.findOne({ email, password });
    return user;
};

module.exports = { login };