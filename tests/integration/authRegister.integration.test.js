jest.mock('../../src/models/User', () => jest.fn());

const request = require('supertest');
const bcrypt = require('bcryptjs');
const User = require('../../src/models/User');
const app = require('../../src/app');

describe('Integración POST /api/auth/register', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        User.findOne = jest.fn();
        User.mockImplementation(function (userData) {
            Object.assign(this, userData);
            this.save = jest.fn().mockResolvedValue(this);
        });
    });

    test('responde 201 y guarda el nuevo usuario con contraseña cifrada', async () => {
        User.findOne.mockResolvedValue(null);

        const response = await request(app)
            .post('/api/auth/register')
            .send({ email: 'ana@example.com', password: 'clave-segura' });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            message: 'Usuario registrado exitosamente'
        });
        expect(User.findOne).toHaveBeenCalledWith({ email: 'ana@example.com' });

        const savedUser = User.mock.instances[0];
        expect(savedUser.email).toBe('ana@example.com');
        expect(await bcrypt.compare('clave-segura', savedUser.password)).toBe(true);
        expect(savedUser.save).toHaveBeenCalledTimes(1);
    });

    test('responde 400 y no guarda el usuario si el email ya existe', async () => {
        User.findOne.mockResolvedValue({ email: 'ana@example.com' });

        const response = await request(app)
            .post('/api/auth/register')
            .send({ email: 'ana@example.com', password: 'clave-segura' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: 'El usuario ya existe' });
        expect(User).not.toHaveBeenCalled();
    });

    test('responde 400 cuando faltan datos requeridos', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ email: 'ana@example.com' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: 'El email y la contraseña son requeridos'
        });
        expect(User.findOne).not.toHaveBeenCalled();
    });

    test('responde 500 si falla el guardado', async () => {
        User.findOne.mockResolvedValue(null);
        User.mockImplementationOnce(function (userData) {
            Object.assign(this, userData);
            this.save = jest.fn().mockRejectedValue(new Error('fallo de prueba'));
        });

        const response = await request(app)
            .post('/api/auth/register')
            .send({ email: 'ana@example.com', password: 'clave-segura' });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            message: 'Error al registrar usuario',
            error: 'fallo de prueba'
        });
    });
});
