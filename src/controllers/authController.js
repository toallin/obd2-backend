const User = require('../models/User');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
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
// LOGIN
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

        if (user.totpEnabled) {
            return res.status(200).json({ requires2FA: true });
        }

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
// ✅ 2FA SETUP - Usando speakeasy
// ──────────────────────────────────────────────────────
const setup2FA = async (req, res) => {
    try {
        console.log('📱 Setup 2FA iniciado');
        console.log('📧 Email recibido:', req.body);

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico es requerido para configurar el 2FA'
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // ✅ Generar secreto con speakeasy
        const secret = speakeasy.generateSecret({
            length: 20,
            name: `OBD2:${email}`
        });

        console.log('🔑 Secreto generado:', secret.base32);

        // Guardar secreto
        user.totpSecret = secret.base32;
        user.totpEnabled = false;
        await user.save();
        console.log('💾 Secreto guardado en BD');

        // Generar URL para QR
        const otpauthUrl = speakeasy.otpauthURL({
            secret: secret.base32,
            label: email,
            issuer: 'OBD2-System'
        });

        console.log('📱 URL OTP generada');

        // Generar QR
        const qrCode = await QRCode.toDataURL(otpauthUrl);
        console.log('✅ QR generado exitosamente');

        res.status(200).json({
            success: true,
            qrCode: qrCode,
            secret: secret.base32
        });

    } catch (error) {
        console.error('❌ ERROR en setup 2FA:', error);
        res.status(500).json({
            success: false,
            message: 'Error generando 2FA en el servidor',
            error: error.message
        });
    }
};

// ──────────────────────────────────────────────────────
// ✅ 2FA VERIFY SETUP - Usando speakeasy
// ──────────────────────────────────────────────────────
const verifySetup2FA = async (req, res) => {
    try {
        console.log('🔐 Verificando 2FA');
        const { email, token } = req.body;

        if (!email || !token) {
            return res.status(400).json({
                success: false,
                message: 'Email y token son requeridos'
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (!user.totpSecret) {
            return res.status(400).json({
                success: false,
                message: 'Configura el 2FA primero'
            });
        }

        // ✅ Verificar con speakeasy
        const verified = speakeasy.totp.verify({
            secret: user.totpSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        console.log('✅ Token válido:', verified);

        if (!verified) {
            return res.status(401).json({
                success: false,
                message: 'Código incorrecto o expirado'
            });
        }

        user.totpEnabled = true;
        await user.save();

        res.status(200).json({
            success: true,
            message: '2FA activado correctamente',
            totpEnabled: true
        });
    } catch (error) {
        console.error('❌ ERROR en verify 2FA:', error);
        res.status(500).json({
            success: false,
            message: 'Error verificando 2FA',
            error: error.message
        });
    }
};

// ──────────────────────────────────────────────────────
// 2FA LOGIN
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

        const verified = speakeasy.totp.verify({
            secret: user.totpSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (!verified) {
            return res.status(401).json({ message: 'Código incorrecto o expirado' });
        }

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