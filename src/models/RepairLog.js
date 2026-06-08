const mongoose = require('mongoose');

const repairLogSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'Cambio de aceite',
        'Cambio de llantas',
        'Cambio de frenos',
        'Cambio de batería',
        'Cambio de filtro de aire',
        'Cambio de bujías',
        'Alineación y balanceo',
        'Cambio de correa',
        'Reparación de motor',
        'Reparación eléctrica',
        'Cambio de amortiguadores',
        'Mantenimiento general',
        'Otro',
      ],
    },
    description: {
      type: String,
      default: '',
    },
    mileageKm: {
      type: Number,
      default: 0,
    },
    cost: {
      type: Number,
      default: 0,
    },
    workshopName: {
      type: String,
      default: '',
    },
    repairDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RepairLog', repairLogSchema);
