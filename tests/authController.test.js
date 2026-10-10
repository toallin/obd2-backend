jest.mock('../src/models/User', () => jest.fn());
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'token-de-prueba')
}));
jest.mock('speakeasy', () => ({
    generateSecret: jest.fn(),
    otpauthURL: jest.fn(),
    totp: { verify: jest.fn() }
}));
jest.mock('qrcode', () => ({
    toDataURL: jest.fn()
}));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../src/models/User');
const {
    register,
    login,
    setup2FA,
    verifySetup2FA,
    login2FA
} = require('../src/controllers/authController');

const createResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
});

describe('authController.register', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        User.mockImplementation(function (userData) {
            Object.assign(this, userData);
            this.save = jest.fn().mockResolvedValue(this);
        });
    });

    describe('authController.login', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('inicia sesión con contraseña correcta y devuelve un token', async () => {
            const password = 'clave-segura';
            const user = {
                _id: 'user-1',
                email: 'ana@example.com',
                password: await bcrypt.hash(password, 10),
                totpEnabled: false
            };
            User.findOne = jest.fn().mockResolvedValue(user);
            const req = { body: { email: user.email, password } };
            const res = createResponse();

            await login(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: user.email });
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: user._id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Login correcto',
                token: 'token-de-prueba',
                user: { id: user._id, email: user.email }
            });
        });

        test('solicita el código 2FA cuando está activado', async () => {
            const password = 'clave-segura';
            const user = {
                _id: 'user-1',
                email: 'ana@example.com',
                password: await bcrypt.hash(password, 10),
                totpEnabled: true
            };
            User.findOne = jest.fn().mockResolvedValue(user);
            const req = { body: { email: user.email, password } };
            const res = createResponse();

            await login(req, res);

            expect(jwt.sign).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ requires2FA: true });
        });

        test('rechaza una contraseña incorrecta', async () => {
            User.findOne = jest.fn().mockResolvedValue({
                email: 'ana@example.com',
                password: await bcrypt.hash('otra-clave', 10)
            });
            const req = {
                body: { email: 'ana@example.com', password: 'clave-incorrecta' }
            };
            const res = createResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Credenciales incorrectas'
            });
        });
    });

    describe('authController.setup2FA', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('genera y guarda el secreto 2FA y devuelve el código QR', async () => {
            const user = {
                save: jest.fn().mockResolvedValue(undefined),
                totpEnabled: false
            };
            User.findOne = jest.fn().mockResolvedValue(user);
            speakeasy.generateSecret.mockReturnValue({
                base32: 'SECRETO-DE-PRUEBA',
                otpauth_url: 'otpauth://totp/prueba'
            });
            QRCode.toDataURL.mockResolvedValue('data:image/png;base64,prueba');
            const req = { body: { email: 'ana@example.com' } };
            const res = createResponse();

            await setup2FA(req, res);

            expect(speakeasy.generateSecret).toHaveBeenCalledWith({
                length: 20,
                name: 'OBD2-System:ana@example.com',
                issuer: 'OBD2-System'
            });
            expect(user.totpSecret).toBe('SECRETO-DE-PRUEBA');
            expect(user.totpEnabled).toBe(false);
            expect(user.save).toHaveBeenCalledTimes(1);
            expect(QRCode.toDataURL).toHaveBeenCalledWith('otpauth://totp/prueba');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                qrCode: 'data:image/png;base64,prueba',
                secret: 'SECRETO-DE-PRUEBA'
            });
        });

        test('reutiliza el secreto pendiente al volver a solicitar el QR', async () => {
            const user = {
                totpSecret: 'SECRETO-DE-PRUEBA',
                totpEnabled: false,
                save: jest.fn()
            };
            User.findOne = jest.fn().mockResolvedValue(user);
            speakeasy.otpauthURL.mockReturnValue('otpauth://totp/prueba');
            QRCode.toDataURL.mockResolvedValue('data:image/png;base64,prueba');
            const req = { body: { email: 'ana@example.com' } };
            const res = createResponse();

            await setup2FA(req, res);

            expect(speakeasy.generateSecret).not.toHaveBeenCalled();
            expect(speakeasy.otpauthURL).toHaveBeenCalledWith({
                secret: 'SECRETO-DE-PRUEBA',
                encoding: 'base32',
                label: 'OBD2-System:ana@example.com',
                issuer: 'OBD2-System'
            });
            expect(user.save).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                qrCode: 'data:image/png;base64,prueba',
                secret: 'SECRETO-DE-PRUEBA'
            });
        });

        test('no reemplaza el secreto de una cuenta con 2FA activo', async () => {
            const user = {
                totpSecret: 'SECRETO-ACTIVO',
                totpEnabled: true,
                save: jest.fn()
            };
            User.findOne = jest.fn().mockResolvedValue(user);
            const req = { body: { email: 'ana@example.com' } };
            const res = createResponse();

            await setup2FA(req, res);

            expect(speakeasy.generateSecret).not.toHaveBeenCalled();
            expect(user.totpSecret).toBe('SECRETO-ACTIVO');
            expect(user.save).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'El 2FA ya está activado'
            });
        });
    });

    describe('authController.verifySetup2FA', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('activa el 2FA si el código es válido', async () => {
            const user = {
                totpSecret: 'SECRETO-DE-PRUEBA',
                totpEnabled: false,
                save: jest.fn().mockResolvedValue(undefined)
            };
            User.findOne = jest.fn().mockResolvedValue(user);
            speakeasy.totp.verify.mockReturnValue(true);
            const req = {
                body: { email: 'ana@example.com', token: '123456' }
            };
            const res = createResponse();

            await verifySetup2FA(req, res);

            expect(speakeasy.totp.verify).toHaveBeenCalledWith({
                secret: 'SECRETO-DE-PRUEBA',
                encoding: 'base32',
                token: '123456',
                window: 2
            });
            expect(user.totpEnabled).toBe(true);
            expect(user.save).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: '2FA activado correctamente',
                totpEnabled: true
            });
        });

        test('no activa el 2FA si el código es incorrecto', async () => {
            const user = {
                totpSecret: 'SECRETO-DE-PRUEBA',
                totpEnabled: false,
                save: jest.fn()
            };
            User.findOne = jest.fn().mockResolvedValue(user);
            speakeasy.totp.verify.mockReturnValue(false);
            const req = {
                body: { email: 'ana@example.com', token: '000000' }
            };
            const res = createResponse();

            await verifySetup2FA(req, res);

            expect(user.save).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Código incorrecto o expirado'
            });
        });
    });

    describe('authController.login2FA', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('inicia sesión y devuelve token cuando el código 2FA es válido', async () => {
            const user = {
                _id: 'user-1',
                email: 'ana@example.com',
                totpSecret: 'SECRETO-DE-PRUEBA',
                totpEnabled: true
            };
            User.findOne = jest.fn().mockResolvedValue(user);
            speakeasy.totp.verify.mockReturnValue(true);
            const req = {
                body: { email: user.email, token: '123456' }
            };
            const res = createResponse();

            await login2FA(req, res);

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: user._id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Login correcto',
                token: 'token-de-prueba',
                user: { id: user._id, email: user.email }
            });
        });
    });

    test('registra un usuario y guarda la contraseña cifrada', async () => {
        User.findOne = jest.fn().mockResolvedValue(null);
        const req = {
            body: { email: 'ana@example.com', password: 'clave-segura' }
        };
        const res = createResponse();

        await register(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'ana@example.com' });
        const savedUser = User.mock.instances[0];
        expect(savedUser.email).toBe('ana@example.com');
        expect(await bcrypt.compare('clave-segura', savedUser.password)).toBe(true);
        expect(savedUser.save).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Usuario registrado exitosamente'
        });
    });

    test('rechaza la solicitud si falta el email o la contraseña', async () => {
        User.findOne = jest.fn();
        const req = { body: { email: 'ana@example.com' } };
        const res = createResponse();

        await register(req, res);

        expect(User.findOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('no registra un email que ya existe', async () => {
        User.findOne = jest.fn().mockResolvedValue({ email: 'ana@example.com' });
        const req = {
            body: { email: 'ana@example.com', password: 'clave-segura' }
        };
        const res = createResponse();

        await register(req, res);

        expect(User).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'El usuario ya existe' });
    });
});
