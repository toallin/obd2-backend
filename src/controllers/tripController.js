const Trip = require('../models/Trip');
const VehicleData = require('../models/VehicleData');
const Vehicle = require('../models/Vehicle');
const geminiService = require('../services/geminiService');

// CREATE TRIP
const createTrip = async (req, res) => {
  try {
    const { vehicleId, origin, destination, distanceKm, durationMin } = req.body;
    const userId = req.user?.id || req.user?._id;

    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      user: userId,
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    const latestData = await VehicleData.findOne({ vehicle: vehicleId })
      .sort({ extractedAt: -1 })
      .lean();

    const obdCodes = latestData?.obd2Codes || '';
    const translations = latestData?.translations || [];

    const aiResult = await geminiService.analyzeTrip({
      vehicle: {
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
      },
      origin,
      destination,
      obdCodes,
      translations,
    });

    if (!aiResult) {
      return res.status(500).json({
        message: 'El análisis de IA no retornó resultado',
      });
    }

    const trip = await Trip.create({
      user: userId,
      vehicle: vehicleId,
      origin,
      destination,
      distanceKm: Number(distanceKm) || 0,
      durationMin: Number(durationMin) || 0,
      obdCodes,
      obdTranslations: translations,
      aiAnalysis: {
        safeToTravel: aiResult.safeToTravel,
        riskLevel: aiResult.riskLevel,
        estimatedTripTime: aiResult.estimatedTripTime || '',
        codeAnalysis: aiResult.codeAnalysis || [],
        warnings: aiResult.warnings || [],
        recommendations: aiResult.recommendations || [],
        futureFailurePrediction: aiResult.futureFailurePrediction || [],
        tripAdvice: aiResult.tripAdvice || {},
      },
    });

    return res.status(201).json({ trip, aiResult });
  } catch (error) {
    console.error('Error en createTrip:', error);
    res.status(500).json({ message: error.message });
  }
};


// GET TRIPS
const getTrips = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    const trips = await Trip.find({ user: userId })
      .populate('vehicle')
      .sort({ createdAt: -1 });

    return res.status(200).json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTrip, getTrips };