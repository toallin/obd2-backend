const authService = require('../services/authService');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');

const APP_NAME = 'OBD-II System';

// ──────────────────────────────────────────────────────
// REGISTER
// ──────────────────────────────────────────────────────
const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'El email y la contraseña son requeridos' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({ email, password });
        await user.save();

        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

// ──────────────────────────────────────────────────────
// LOGIN — Paso 1: verificar email + contraseña
// ──────────────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña requeridos' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        // Si tiene 2FA activado → no emitir JWT todavía
        if (user.totpEnabled) {
            return res.status(200).json({ requires2FA: true });
        }

        // Sin 2FA → login normal
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Login correcto',
            token,
            user: { id: user._id, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

// ──────────────────────────────────────────────────────
// GET PROFILE
// ──────────────────────────────────────────────────────
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user: { email: user.email } });
    } catch (error) {
        res.status(500).json({ message: 'Error getting profile', error: error.message });
    }
};

// ──────────────────────────────────────────────────────
// 2FA SETUP — Genera secreto + QR para que el usuario escanee
// ──────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────
// 2FA SETUP — Versión corregida con findOneAndUpdate
// ──────────────────────────────────────────────────────
const setup2FA = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'El correo electrónico es requerido para configurar el 2FA' });
        }

        // 1. Buscar si el usuario existe antes de generar nada
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // 2. Generar el secreto único de TOTP
        const secret = authenticator.generateSecret();

        // 3. 🔥 SOLUCIÓN: Actualizar directamente en la BD sin disparar validaciones del esquema completo
        await User.findOneAndUpdate(
            { email },
            {
                $set: {
                    totpSecret: secret,
                    totpEnabled: false
                }
            }
        );

        // 4. Generar URL estándar para las apps autenticadoras
        const otpauthUrl = authenticator.keyuri(email, APP_NAME, secret);

        // 5. Convertir la URL en la imagen QR que espera tu Frontend
        const qrCode = await QRCode.toDataURL(otpauthUrl);

        // 6. Responder con éxito
        res.status(200).json({ qrCode, secret });
    } catch (error) {
        // Si vuelve a fallar, te dirá exactamente la razón en la respuesta de la red
        res.status(500).json({
            message: 'Error generando 2FA en el servidor',
            error: error.message
        });
    }
};

// ──────────────────────────────────────────────────────
// 2FA VERIFY SETUP — Confirmar primer código
// ──────────────────────────────────────────────────────
const verifySetup2FA = async (req, res) => {
    try {
        const { email, token } = req.body;

        if (!email || !token) {
            return res.status(400).json({ message: 'Email y token son requeridos' });
        }

        const user = await User.findOne({ email });
        if (!user || !user.totpSecret) {
            return res.status(400).json({ message: 'Configura el 2FA primero' });
        }

        const isValid = authenticator.verify({ token, secret: user.totpSecret });

        if (!isValid) {
            return res.status(401).json({ message: 'Código incorrecto' });
        }

        // Activar 2FA oficialmente
        user.totpEnabled = true;
        await user.save();

        res.status(200).json({ message: '2FA activado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error verificando 2FA', error: error.message });
    }
};

// ──────────────────────────────────────────────────────
// 2FA LOGIN — Paso 2 del login: verificar código TOTP
// ──────────────────────────────────────────────────────
const login2FA = async (req, res) => {
    try {
        const { email, token } = req.body;

        if (!email || !token) {
            return res.status(400).json({ message: 'Email y token son requeridos' });
        }

        const user = await User.findOne({ email });
        if (!user || !user.totpEnabled) {
            return res.status(400).json({ message: 'Usuario o 2FA no válido' });
        }

        const isValid = authenticator.verify({ token, secret: user.totpSecret });

        if (!isValid) {
            return res.status(401).json({ message: 'Código incorrecto o expirado' });
        }

        // Código correcto → emitir JWT definitivo
        const jwtToken = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Login correcto',
            token: jwtToken,
            user: { id: user._id, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error en 2FA login', error: error.message });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    setup2FA,
    verifySetup2FA,
    login2FA
};