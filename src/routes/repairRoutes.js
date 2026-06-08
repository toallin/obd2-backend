const router = require('express').Router();
const auth = require('../middlewares/auth');
const {
  getRepairsByVehicle,
  createRepair,
  updateRepair,
  deleteRepair,
} = require('../controllers/repairController');

// Obtener reparaciones de un vehículo
router.get('/vehicle/:vehicleId', auth, getRepairsByVehicle);

// Crear nueva reparación
router.post('/', auth, createRepair);

// Actualizar reparación
router.put('/:repairId', auth, updateRepair);

// Eliminar reparación
router.delete('/:repairId', auth, deleteRepair);

module.exports = router;
