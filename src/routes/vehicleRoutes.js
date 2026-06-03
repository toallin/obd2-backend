/**
 * @swagger
 * tags:
 *   name: Vehicles
 *   description: Gestión de vehículos y historial OBD2
 */

/**
 * @swagger
 * /api/vehicles/register:
 *   post:
 *     summary: Registrar vehículo
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               year:
 *                 type: number
 *                 example: 2020
 *               model:
 *                 type: string
 *                 example: Toyota Corolla
 *     responses:
 *       201:
 *         description: Vehículo registrado
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/vehicles/history:
 *   post:
 *     summary: Agregar historial OBD2
 *     tags: [Vehicles]
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
 *               obd2Data:
 *                 type: string
 *                 example: "Códigos OBD2 extraídos: P0300, P0420"
 *     responses:
 *       201:
 *         description: Historial agregado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Vehículo no encontrado
 */

/**
 * @swagger
 * /api/vehicles/{vehicleId}:
 *   get:
 *     summary: Obtener vehículo con historial
 *     tags: [Vehicles]
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
 *         description: Vehículo con historial
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Vehículo no encontrado
 */
const router = require('express').Router();

const upload = require('../middlewares/upload');

const {
    registerVehicle,
    getUserVehicles
} = require('../controllers/vehicleController');

const auth = require('../middlewares/auth');

/**
 * Registrar vehículo
 */
router.post(
    '/register',
    auth,
    upload.single('image'),
    registerVehicle
);

/**
 * Obtener vehículos
 */
router.get(
    '/my',
    auth,
    getUserVehicles
);

module.exports = router;