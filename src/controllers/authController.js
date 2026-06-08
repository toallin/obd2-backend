const authService = require('../services/authService');
const User = require('../models/User'); // Asume que tienes este modelo
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Verificar si el usuario ya existe
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Crear nuevo usuario
        const user = new User({
            email,
            password
        });

        await user.save();
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        // Verificar contraseña
        if (user.password !== password) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        // Generar token JWT
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

// ✅ Función getProfile - AHORA ESTÁ FUERA del login
const getProfile = async (req, res) => {
    try {
        // El middleware ya verificó el token y puso los datos en req.user
        // req.user tiene: { id: user._id, email: user.email }

        // Buscar usuario en la base de datos (excluyendo la contraseña)
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Devolver el email del usuario
        res.json({ user: { email: user.email } });

    } catch (error) {
        res.status(500).json({ message: 'Error getting profile', error: error.message });
    }
};

// Exportar correctamente las tres funciones
module.exports = { register, login, getProfile };
