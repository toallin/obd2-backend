const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    totpSecret: {
        type: String,
        default: null
    },
    totpEnabled: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('User', userSchema);