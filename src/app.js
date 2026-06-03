const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const vehicleDataRoutes = require('./routes/vehicleDataRoutes');
const obd2Routes = require('./routes/obd2Routes');

const app = express();

// =======================
// MIDDLEWARES PRIMERO
// =======================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// archivos estáticos
app.use('/uploads', express.static('uploads'));

// =======================
// RUTA BASE
// =======================
app.get('/', (req, res) => {
    res.send('API funcionando correctamente 🚀');
});

// =======================
// SWAGGER
// =======================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// =======================
// RUTAS
// =======================
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/vehicledata', vehicleDataRoutes);
app.use('/api/obd2', obd2Routes);
app.use('/api/trips', require('./routes/tripRoutes'));

module.exports = app;