const mongoose = require('mongoose');
const VehicleData =
    require('../models/VehicleData');

const Vehicle =
    require('../models/Vehicle');

// Diccionario OBD2
const obd2Dictionary = {

    P0300: {
        description:
            'Cilindro 1 falla de encendido',

        affects:
            'Motor, rendimiento y combustible'
    },

    P0420: {
        description:
            'Convertidor catalítico ineficiente',

        affects:
            'Emisiones y eficiencia'
    },

    P0128: {
        description:
            'Temperatura del refrigerante baja',

        affects:
            'Sistema de enfriamiento'
    },

    P0171: {
        description:
            'Mezcla aire-combustible pobre',

        affects:
            'Motor y consumo'
    }

};

// Traducir códigos
const translateObd2Codes = (codesString) => {
    if (!codesString) return [];
    
    // Extract all OBD2 codes (P, C, B, or U followed by 4 digits) case-insensitively
    const matches = codesString.match(/[PCBU]\d{4}/gi) || [];
    
    // Normalize to uppercase and remove duplicates
    const uniqueCodes = [...new Set(matches.map(code => code.toUpperCase()))];

    return uniqueCodes.map(code => {
        const info = obd2Dictionary[code] || {
            description: 'Código desconocido',
            affects: 'No identificado'
        };

        return {
            code,
            description: info.description,
            affects: info.affects
        };
    });
};

// Subir códigos
const uploadObd2Codes = async (req, res) => {

    try {

        const { vehicle, obd2Codes } = req.body;

        const userId = req.user.id || req.user._id;

        const vehicleFound = await Vehicle.findOne({
            _id: vehicle,
            user: userId
        });

        if (!vehicleFound) {
            return res.status(404).json({
                message: 'Vehículo no encontrado'
            });
        }

        // 🔥 PRIMERO traducir
        const translations = translateObd2Codes(obd2Codes);

        // 🔥 LUEGO guardar (eliminar anteriores de este auto para mantener solo el último)
        const vehicleObjectId = new mongoose.Types.ObjectId(vehicle);
        console.log("🗑️ Backend: Eliminando códigos anteriores para el vehículo ID:", vehicleObjectId);
        const deleteResult = await VehicleData.deleteMany({ vehicle: vehicleObjectId });
        console.log("🗑️ Backend: Resultado de eliminación:", deleteResult);

        const vehicleData = new VehicleData({
            vehicle,
            obd2Codes,
            translations
        });

        const savedData = await vehicleData.save();
        console.log("💾 Backend: Nuevo diagnóstico guardado con éxito. ID:", savedData._id);

        res.status(201).json({
            message: 'Códigos OBD2 guardados',
            translations
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error guardando códigos',
            error: error.message
        });
    }
};

// Obtener historial
const getVehicleObd2Data =
    async (req, res) => {

        try {

            const { vehicleId } =
                req.params;

            const userId =
                req.user.id ||
                req.user._id;

            const vehicle =
                await Vehicle.findOne({

                    _id: vehicleId,

                    user: userId

                });

            if (!vehicle) {

                return res.status(404).json({

                    message:
                        'Vehículo no encontrado'

                });
            }

            console.log("🔍 Backend: Buscando diagnósticos para vehículo ID:", vehicleId);
            const obd2Data =
                await VehicleData.find({

                    vehicle: vehicleId

                }).sort({

                    _id: -1

                });
            console.log(`🔍 Backend: Se encontraron ${obd2Data.length} registros para este vehículo.`);
            if (obd2Data.length > 0) {
                console.log("🔍 Backend: ID del registro más reciente:", obd2Data[0]._id, "Códigos:", obd2Data[0].obd2Codes);
            }

            const dataWithTranslations =
                obd2Data.map(data => ({

                    ...data.toObject(),

                    translations:
                        translateObd2Codes(
                            data.obd2Codes
                        )

                }));

            res.json({

                vehicleId,

                obd2Data:
                    dataWithTranslations

            });

        } catch (error) {

            res.status(500).json({

                message:
                    'Error obteniendo datos',

                error: error.message

            });
        }
    };

module.exports = {

    uploadObd2Codes,

    getVehicleObd2Data

};