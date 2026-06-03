const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    origin: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    distanceKm: {
      type: Number,
      default: 0,
    },
    durationMin: {
      type: Number,
      default: 0,
    },
    aiAnalysis: {
      safeToTravel: Boolean,
      riskLevel: String, // Low | Medium | High
      warnings: [String],
      recommendations: [String],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);