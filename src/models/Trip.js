const mongoose = require('mongoose');

const codeAnalysisSchema = new mongoose.Schema(
  {
    code: String,
    meaning: String,
    cause: String,
    risk: String,
    whatCanHappenDuringTrip: String,
    mechanicAdvice: String,
    possibleRepair: String,
    repairCostLevel: String,
  },
  { _id: false }
);

const obdTranslationSchema = new mongoose.Schema(
  {
    code: String,
    description: String,
    affects: String,
    symptoms: String,
    guide: String,
  },
  { _id: false }
);

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
    obdCodes: {
      type: String,
      default: '',
    },
    obdTranslations: {
      type: [obdTranslationSchema],
      default: [],
    },
    aiAnalysis: {
      safeToTravel: Boolean,
      riskLevel: String, // Low | Medium | High
      estimatedTripTime: String,
      codeAnalysis: {
        type: [codeAnalysisSchema],
        default: [],
      },
      warnings: [String],
      recommendations: [String],
      futureFailurePrediction: [String],
      tripAdvice: {
        canTravel: String,
        explanation: String,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);