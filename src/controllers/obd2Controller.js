const OBD2Code = require('../models/OBD2Code');

const dictionary =
    require('../utils/obd2Dictionary');

const uploadCodes = async (req, res) => {

    try {

        const {
            vehicleId,
            codes
        } = req.body;

        const translated = [];

        for (const code of codes) {

            const description =
                dictionary[code] ||
                'Código desconocido';

            const saved =
                await OBD2Code.create({

                    vehicle: vehicleId,

                    code,

                    description
                });

            translated.push(saved);
        }

        res.json({

            message:
                'Códigos registrados',

            translated
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    uploadCodes
};