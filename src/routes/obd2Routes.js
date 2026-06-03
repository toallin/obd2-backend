const router = require('express').Router();

const auth =
    require('../middlewares/auth');

const {
    uploadCodes
} = require('../controllers/obd2Controller');

router.post(
    '/upload',
    auth,
    uploadCodes
);

module.exports = router;