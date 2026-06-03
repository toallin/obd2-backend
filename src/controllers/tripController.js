const Trip = require('../models/Trip');
const VehicleData = require('../models/VehicleData');
const Vehicle = require('../models/Vehicle');
const geminiService = require('../services/geminiService');

// CREATE TRIP
const createTrip = async (req, res) => {
  try {
    const { vehicleId, origin, destination } = req.body;
    const userId = req.user?.id || req.user?._id;

    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      user: userId,
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
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

    if (!aiResult || aiResult.rawResponse) {
      return res.status(500).json({
        message: 'AI analysis failed',
        debug: aiResult,
      });
    }

    const trip = await Trip.create({
      user: userId,
      vehicle: vehicleId,
      origin,
      destination,
      distanceKm: Number(aiResult.distance) || 0,
      durationMin: 0,
      aiAnalysis: {
        safeToTravel: aiResult.safeToTravel,
        riskLevel: aiResult.riskLevel,
        warnings: aiResult.warnings || [],
        recommendations: aiResult.recommendations || [],
      },
    });

    return res.status(201).json({ trip });
  } catch (error) {
    console.error(error);
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