jest.mock('../src/models/Vehicle', () => ({
    create: jest.fn()
}));

const Vehicle = require('../src/models/Vehicle');
const { registerVehicle } = require('../src/controllers/vehicleController');

const createResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
});

describe('vehicleController.registerVehicle', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('registra el vehículo del usuario autenticado sin imagen', async () => {
        const vehicle = { _id: 'vehicle-1', brand: 'Toyota', model: 'Corolla' };
        Vehicle.create.mockResolvedValue(vehicle);
        const req = {
            user: { id: 'user-1' },
            body: { brand: 'Toyota', model: 'Corolla', year: '2020' }
        };
        const res = createResponse();

        await registerVehicle(req, res);

        expect(Vehicle.create).toHaveBeenCalledWith({
            user: 'user-1',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            image: ''
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Vehículo registrado correctamente',
            vehicle
        });
    });

    test('guarda el nombre de la imagen recibida', async () => {
        Vehicle.create.mockResolvedValue({ _id: 'vehicle-2' });
        const req = {
            user: { _id: 'user-2' },
            body: { brand: 'Honda', model: 'Civic', year: '2022' },
            file: { filename: 'civic.png' }
        };
        const res = createResponse();

        await registerVehicle(req, res);

        expect(Vehicle.create).toHaveBeenCalledWith({
            user: 'user-2',
            brand: 'Honda',
            model: 'Civic',
            year: '2022',
            image: 'civic.png'
        });
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('responde con error si falla la creación del vehículo', async () => {
        const error = new Error('fallo de prueba');
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        Vehicle.create.mockRejectedValue(error);
        const req = {
            user: { id: 'user-1' },
            body: { brand: 'Toyota', model: 'Corolla', year: '2020' }
        };
        const res = createResponse();

        await registerVehicle(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'fallo de prueba' });
        consoleError.mockRestore();
    });
});
