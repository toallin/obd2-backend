/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación de usuarios
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: cristian@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Usuario creado
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: cristian@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login correcto
 *       401:
 *         description: Credenciales incorrectas
 */
const router = require('express').Router();

// 💡 CORRECCIÓN: Usamos exactamente "verifySetup2FA" que viene de tu controlador
const {
    login,
    register,
    getProfile,
    setup2FA,
    verifySetup2FA, // ← Cambiado aquí
    login2FA,
    generateTestCode  // ← Agrega esta línea
} = require('../controllers/authController');

const authMiddleware = require('../middlewares/auth');

// Rutas base
router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);

// Rutas de doble factor (2FA)
router.post('/2fa/setup', setup2FA);
router.post('/2fa/verify-setup', verifySetup2FA); // ← Cambiado aquí también
router.post('/2fa/login', login2FA);
router.post('/2fa/generate-test-code', generateTestCode);
module.exports = router;