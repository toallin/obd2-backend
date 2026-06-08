const RepairLog = require('../models/RepairLog');
const Vehicle = require('../models/Vehicle');

// Obtener todos los registros de reparación de un vehículo
const getRepairsByVehicle = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { vehicleId } = req.params;

    // Verificar que el vehículo pertenezca al usuario
    const vehicle = await Vehicle.findOne({ _id: vehicleId, user: userId });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    const repairs = await RepairLog.find({ vehicle: vehicleId, user: userId })
      .sort({ repairDate: -1 })
      .lean();

    return res.json({ repairs, vehicle });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Crear un nuevo registro de reparación
const createRepair = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { vehicleId, type, description, mileageKm, cost, workshopName, repairDate } = req.body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, user: userId });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    const repair = await RepairLog.create({
      vehicle: vehicleId,
      user: userId,
      type,
      description: description || '',
      mileageKm: Number(mileageKm) || 0,
      cost: Number(cost) || 0,
      workshopName: workshopName || '',
      repairDate: repairDate || new Date(),
    });

    return res.status(201).json({ repair });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Actualizar un registro de reparación
const updateRepair = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { repairId } = req.params;
    const { type, description, mileageKm, cost, workshopName, repairDate } = req.body;

    const repair = await RepairLog.findOne({ _id: repairId, user: userId });
    if (!repair) {
      return res.status(404).json({ message: 'Registro de reparación no encontrado' });
    }

    if (type) repair.type = type;
    if (description !== undefined) repair.description = description;
    if (mileageKm !== undefined) repair.mileageKm = Number(mileageKm) || 0;
    if (cost !== undefined) repair.cost = Number(cost) || 0;
    if (workshopName !== undefined) repair.workshopName = workshopName;
    if (repairDate) repair.repairDate = repairDate;

    await repair.save();
    return res.json({ repair });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Eliminar un registro de reparación
const deleteRepair = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { repairId } = req.params;

    const repair = await RepairLog.findOneAndDelete({ _id: repairId, user: userId });
    if (!repair) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }

    return res.json({ message: 'Registro eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getRepairsByVehicle, createRepair, updateRepair, deleteRepair };
