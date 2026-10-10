const User = require('../models/User');
const bcrypt = require('bcryptjs');
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
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
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

        const passwordIsValid = await bcrypt.compare(password, user.password);
        if (!passwordIsValid) {
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

        if (user.totpEnabled) {
            return res.status(409).json({
                success: false,
                message: 'El 2FA ya está activado'
            });
        }

        let otpauthUrl;
        if (user.totpSecret && !user.totpEnabled) {
            otpauthUrl = speakeasy.otpauthURL({
                secret: user.totpSecret,
                encoding: 'base32',
                label: `OBD2-System:${email}`,
                issuer: 'OBD2-System'
            });
        } else {
            const secret = speakeasy.generateSecret({
                length: 20,
                name: `OBD2-System:${email}`,
                issuer: 'OBD2-System'
            });

            user.totpSecret = secret.base32;
            user.totpEnabled = false;
            await user.save();
            otpauthUrl = secret.otpauth_url;
        }

        // Generar QR
        const qrCode = await QRCode.toDataURL(otpauthUrl);
        console.log('✅ QR generado exitosamente');

        res.status(200).json({
            success: true,
            qrCode: qrCode,
            secret: user.totpSecret
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
// 🔧 SOLO PARA PRUEBAS - Genera un código TOTP válido
const generateTestCode = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user || !user.totpSecret) {
            return res.status(404).json({
                success: false,
                message: 'Usuario o secreto no encontrado'
            });
        }

        // Generar código con speakeasy
        const token = speakeasy.totp({
            secret: user.totpSecret,
            encoding: 'base32',
            window: 0 // Sin ventana de tiempo
        });

        res.json({
            success: true,
            secret: user.totpSecret,
            generatedCode: token,
            currentTime: new Date().toISOString(),
            timestamp: Date.now()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
module.exports = {
    register,
    login,
    getProfile,
    setup2FA,
    verifySetup2FA,
    login2FA,
    generateTestCode
};