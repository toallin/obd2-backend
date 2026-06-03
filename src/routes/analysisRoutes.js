/**
 * @swagger
 * /api/analysis:
 *   post:
 *     summary: Analizar vehículo
 *     tags: [Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               temperature:
 *                 type: number
 *                 example: 95
 *               fuel:
 *                 type: number
 *                 example: 5
 *     responses:
 *       200:
 *         description: Resultado del análisis
 */
const router = require('express').Router();
const { analyze } = require('../controllers/analysisController');

router.post('/', analyze);

module.exports = router;