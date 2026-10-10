jest.mock('../../src/models/Trip', () => ({
    create: jest.fn()
}));
jest.mock('../../src/models/VehicleData', () => ({
    findOne: jest.fn()
}));
jest.mock('../../src/models/Vehicle', () => ({
    findOne: jest.fn()
}));
jest.mock('../../src/services/geminiService', () => ({
    analyzeTrip: jest.fn()
}));
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn()
}));

const request = require('supertest');
const Trip = require('../../src/models/Trip');
const VehicleData = require('../../src/models/VehicleData');
const Vehicle = require('../../src/models/Vehicle');
const geminiService = require('../../src/services/geminiService');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');

describe('Integración POST /api/trips', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('crea el viaje y devuelve el análisis de IA', async () => {
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
            warnings: ['Revisar el motor'],
            recommendations: ['Visitar un mecánico']
        };
        const trip = {
            _id: 'trip-1',
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
                estimatedTripTime: '',
                codeAnalysis: [],
                warnings: ['Revisar el motor'],
                recommendations: ['Visitar un mecánico'],
                futureFailurePrediction: [],
                tripAdvice: {}
            }
        };

        jwt.verify.mockReturnValue({ id: 'user-1' });
        Vehicle.findOne.mockResolvedValue(vehicle);
        VehicleData.findOne.mockReturnValue({
            sort: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(obdData)
            })
        });
        geminiService.analyzeTrip.mockResolvedValue(aiResult);
        Trip.create.mockResolvedValue(trip);

        const response = await request(app)
            .post('/api/trips')
            .set('Authorization', 'Bearer token-de-prueba')
            .send({
                vehicleId: 'vehicle-1',
                origin: 'Bogotá',
                destination: 'Medellín',
                distanceKm: '415',
                durationMin: '360'
            });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({ trip, aiResult });
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
                estimatedTripTime: '',
                codeAnalysis: [],
                warnings: ['Revisar el motor'],
                recommendations: ['Visitar un mecánico'],
                futureFailurePrediction: [],
                tripAdvice: {}
            }
        });
    });

    test('rechaza la solicitud si no se envía token', async () => {
        const response = await request(app)
            .post('/api/trips')
            .send({
                vehicleId: 'vehicle-1',
                origin: 'Bogotá',
                destination: 'Medellín'
            });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'No token provided' });
        expect(Vehicle.findOne).not.toHaveBeenCalled();
        expect(geminiService.analyzeTrip).not.toHaveBeenCalled();
        expect(Trip.create).not.toHaveBeenCalled();
    });

    test('no crea el viaje si el vehículo no pertenece al usuario autenticado', async () => {
        jwt.verify.mockReturnValue({ id: 'user-1' });
        Vehicle.findOne.mockResolvedValue(null);

        const response = await request(app)
            .post('/api/trips')
            .set('Authorization', 'Bearer token-de-prueba')
            .send({
                vehicleId: 'vehicle-otro',
                origin: 'Bogotá',
                destination: 'Medellín'
            });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: 'Vehículo no encontrado' });
        expect(geminiService.analyzeTrip).not.toHaveBeenCalled();
        expect(Trip.create).not.toHaveBeenCalled();
    });

    test('devuelve el error de Gemini y no crea un viaje con análisis de respaldo', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        jwt.verify.mockReturnValue({ id: 'user-1' });
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

        const response = await request(app)
            .post('/api/trips')
            .set('Authorization', 'Bearer token-de-prueba')
            .send({
                vehicleId: 'vehicle-1',
                origin: 'Bogotá',
                destination: 'Medellín'
            });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            message: 'Gemini API respondió HTTP 403: API key not valid'
        });
        expect(Trip.create).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });
});
