const router = require('express').Router();
const auth = require('../middlewares/auth');
const { createTrip, getTrips } = require('../controllers/tripController');

/**
 * @swagger
 * /api/trips:
 *   post:
 *     summary: Crear y analizar un nuevo viaje
 *     tags: [Trips]
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
 *               origin:
 *                 type: string
 *                 example: "Ciudad de México"
 *               destination:
 *                 type: string
 *                 example: "Puebla"
 *               distance:
 *                 type: string
 *                 example: "135 km"
 *               duration:
 *                 type: string
 *                 example: "2h 15m"
 *     responses:
 *       201:
 *         description: Viaje registrado y analizado
 *       401:
 *         description: No autorizado
 * 
 *   get:
 *     summary: Obtener historial de viajes del usuario
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial de viajes
 */

router.post('/', auth, createTrip);
router.get('/', auth, getTrips);

module.exports = router;
