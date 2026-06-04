require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Espera a que la base de datos responda primero
        await connectDB();
        console.log("Conexión a la base de datos establecida.");

        // Una vez conectado, levanta Express
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });
    } catch (error) {
        console.error("Error crítico al iniciar el servidor:", error);
        process.exit(1);
    }
}

startServer();
