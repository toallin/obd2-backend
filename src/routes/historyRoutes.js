/**
 * @swagger
 * /api/history:
 *   get:
 *     summary: Obtener historial
 *     tags: [History]
 *     responses:
 *       200:
 *         description: Lista de historial
 */
const router = require('express').Router();
const { getHistory } = require('../controllers/historyController');

router.get('/', getHistory);

module.exports = router;