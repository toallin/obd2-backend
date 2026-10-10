jest.mock('../src/models/Trip', () => ({
    create: jest.fn()
}));
jest.mock('../src/models/VehicleData', () => ({
    findOne: jest.fn()
}));
jest.mock('../src/models/Vehicle', () => ({
    findOne: jest.fn()
}));
jest.mock('../src/services/geminiService', () => ({
    analyzeTrip: jest.fn()
}));

const Trip = require('../src/models/Trip');
const VehicleData = require('../src/models/VehicleData');
const Vehicle = require('../src/models/Vehicle');
const geminiService = require('../src/services/geminiService');
const { createTrip } = require('../src/controllers/tripController');

const createResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
});

describe('tripController.createTrip', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('analiza con IA y guarda el viaje con los datos del análisis', async () => {
        const vehicle = {
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020'
        };
        const obdData = {
            obd2Codes: 'P0300\nP0171\nP0420',
            translations: [
                { code: 'P0300', description: 'Fallo de encendido' },
                { code: 'P0171', description: 'Mezcla pobre' },
                { code: 'P0420', description: 'Eficiencia baja del catalizador' }
            ]
        };
        const aiResult = {
            safeToTravel: false,
            riskLevel: 'High',
            estimatedTripTime: '6 horas',
            codeAnalysis: [
                { code: 'P0300', meaning: 'Fallo de encendido' },
                { code: 'P0171', meaning: 'Mezcla pobre' },
                { code: 'P0420', meaning: 'Eficiencia baja del catalizador' }
            ],
            warnings: ['Revisar el motor'],
            recommendations: ['Visitar un mecánico'],
            futureFailurePrediction: ['El motor podría fallar'],
            tripAdvice: { canTravel: 'No', explanation: 'Riesgo alto' }
        };
        const trip = { _id: 'trip-1' };

        Vehicle.findOne.mockResolvedValue(vehicle);
        VehicleData.findOne.mockReturnValue({
            sort: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(obdData)
            })
        });
        geminiService.analyzeTrip.mockResolvedValue(aiResult);
        Trip.create.mockResolvedValue(trip);

        const req = {
            user: { id: 'user-1' },
            body: {
                vehicleId: 'vehicle-1',
                origin: 'Bogotá',
                destination: 'Medellín',
                distanceKm: '415',
                durationMin: '360'
            }
        };
        const res = createResponse();

        await createTrip(req, res);

        expect(Vehicle.findOne).toHaveBeenCalledWith({
            _id: 'vehicle-1',
            user: 'user-1'
        });
        expect(geminiService.analyzeTrip).toHaveBeenCalledWith({
            vehicle: { brand: 'Toyota', model: 'Corolla', year: '2020' },
            origin: 'Bogotá',
            destination: 'Medellín',
            obdCodes: 'P0300\nP0171\nP0420',
            translations: obdData.translations
        });
        expect(Trip.create).toHaveBeenCalledWith({
            user: 'user-1',
            vehicle: 'vehicle-1',
            origin: 'Bogotá',
            destination: 'Medellín',
            distanceKm: 415,
            durationMin: 360,
            obdCodes: 'P0300\nP0171\nP0420',
            obdTranslations: obdData.translations,
            aiAnalysis: {
                safeToTravel: false,
                riskLevel: 'High',
                estimatedTripTime: '6 horas',
                codeAnalysis: [
                    { code: 'P0300', meaning: 'Fallo de encendido' },
                    { code: 'P0171', meaning: 'Mezcla pobre' },
                    { code: 'P0420', meaning: 'Eficiencia baja del catalizador' }
                ],
                warnings: ['Revisar el motor'],
                recommendations: ['Visitar un mecánico'],
                futureFailurePrediction: ['El motor podría fallar'],
                tripAdvice: { canTravel: 'No', explanation: 'Riesgo alto' }
            }
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ trip, aiResult });
    });

    test('no crea ni analiza el viaje si el vehículo no pertenece al usuario', async () => {
        Vehicle.findOne.mockResolvedValue(null);
        const req = {
            user: { id: 'user-1' },
            body: { vehicleId: 'vehicle-otro', origin: 'Bogotá', destination: 'Cali' }
        };
        const res = createResponse();

        await createTrip(req, res);

        expect(geminiService.analyzeTrip).not.toHaveBeenCalled();
        expect(Trip.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Vehículo no encontrado' });
    });

    test('no guarda el viaje si el análisis de IA no devuelve resultado', async () => {
        Vehicle.findOne.mockResolvedValue({
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020'
        });
        VehicleData.findOne.mockReturnValue({
            sort: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(null)
            })
        });
        geminiService.analyzeTrip.mockResolvedValue(null);

        const req = {
            user: { id: 'user-1' },
            body: {
                vehicleId: 'vehicle-1',
                origin: 'Bogotá',
                destination: 'Medellín'
            }
        };
        const res = createResponse();

        await createTrip(req, res);

        expect(Trip.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: 'El análisis de IA no retornó resultado'
        });
    });

    test('no guarda el viaje y devuelve error si Gemini falla', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        Vehicle.findOne.mockResolvedValue({
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020'
        });
        VehicleData.findOne.mockReturnValue({
            sort: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(null)
            })
        });
        geminiService.analyzeTrip.mockRejectedValue(
            new Error('Gemini API respondió HTTP 403: API key not valid')
        );

        const req = {
            user: { id: 'user-1' },
            body: {
                vehicleId: 'vehicle-1',
                origin: 'Bogotá',
                destination: 'Medellín'
            }
        };
        const res = createResponse();

        await createTrip(req, res);

        expect(Trip.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Gemini API respondió HTTP 403: API key not valid'
        });
        consoleError.mockRestore();
    });
});
