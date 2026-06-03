const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Extrae el token del header 'Authorization' (formato: Bearer <token>)
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Si no hay token, responde con error 401
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        // Verifica el token usando la clave secreta de .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Agrega los datos del usuario decodificados a req.user
        req.user = decoded;
        // Pasa al siguiente middleware o ruta
        next();
    } catch (error) {
        // Si el token es inválido, responde con error 401
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware;