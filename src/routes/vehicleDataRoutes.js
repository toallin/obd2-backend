/**
 * @swagger
 * tags:
 *   name: VehicleData
 *   description: Gestión de códigos OBD2
 */

/**
 * @swagger
 * /api/vehicledata/upload:
 *   post:
 *     summary: Subir códigos OBD2 extraídos
 *     tags: [VehicleData]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 example: 60d5ecb74bbcc12b8c8b4567
 *               obd2Codes:
 *                 type: string
 *                 example: "P0300, P0420, P0128"
 *     responses:
 *       201:
 *         description: Códigos OBD2 guardados
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Vehículo no encontrado
 */

/**
 * @swagger
 * /api/vehicledata/{vehicleId}:
 *   get:
 *     summary: Obtener códigos OBD2 de un vehículo
 *     tags: [VehicleData]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60d5ecb74bbcc12b8c8b4567
 *     responses:
 *       200:
 *         description: Datos OBD2 del vehículo
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Vehículo no encontrado
 */

const router = require('express').Router();
const { uploadObd2Codes, getVehicleObd2Data } = require('../controllers/vehicleDataController');
const authMiddleware = require('../middlewares/auth');

router.post('/upload', authMiddleware, uploadObd2Codes);
router.get('/:vehicleId', authMiddleware, getVehicleObd2Data);

module.exports = router;