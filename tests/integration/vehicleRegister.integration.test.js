jest.mock('../../src/models/Vehicle', () => ({
    create: jest.fn()
}));
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn()
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const Vehicle = require('../../src/models/Vehicle');
const app = require('../../src/app');

describe('Integración POST /api/vehicles/register', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('registra un vehículo con un token válido', async () => {
        const vehicle = {
            _id: 'vehicle-1',
            user: 'user-1',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            image: ''
        };
        jwt.verify.mockReturnValue({
            id: 'user-1',
            email: 'ana@example.com'
        });
        Vehicle.create.mockResolvedValue(vehicle);

        const response = await request(app)
            .post('/api/vehicles/register')
            .set('Authorization', 'Bearer token-de-prueba')
            .send({ brand: 'Toyota', model: 'Corolla', year: '2020' });

        expect(jwt.verify).toHaveBeenCalledWith(
            'token-de-prueba',
            process.env.JWT_SECRET
        );
        expect(Vehicle.create).toHaveBeenCalledWith({
            user: 'user-1',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            image: ''
        });
        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            message: 'Vehículo registrado correctamente',
            vehicle
        });
    });

    test('rechaza la solicitud si no se envía token', async () => {
        const response = await request(app)
            .post('/api/vehicles/register')
            .send({ brand: 'Toyota', model: 'Corolla', year: '2020' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'No token provided' });
        expect(Vehicle.create).not.toHaveBeenCalled();
    });

    test('responde 500 si falla la creación del vehículo', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        jwt.verify.mockReturnValue({ id: 'user-1' });
        Vehicle.create.mockRejectedValue(new Error('fallo de prueba'));

        const response = await request(app)
            .post('/api/vehicles/register')
            .set('Authorization', 'Bearer token-de-prueba')
            .send({ brand: 'Toyota', model: 'Corolla', year: '2020' });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: 'fallo de prueba' });
        consoleError.mockRestore();
    });
});
