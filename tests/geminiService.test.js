const { analyzeTrip } = require('../src/services/geminiService');

describe('geminiService.analyzeTrip', () => {
    const originalApiKey = process.env.GEMINI_API_KEY;

    beforeEach(() => {
        process.env.GEMINI_API_KEY = 'test-api-key';
        global.fetch = jest.fn();
    });

    afterEach(() => {
        if (originalApiKey === undefined) {
            delete process.env.GEMINI_API_KEY;
        } else {
            process.env.GEMINI_API_KEY = originalApiKey;
        }
        jest.restoreAllMocks();
    });

    const tripInput = {
        vehicle: { brand: 'Toyota', model: 'Corolla', year: '2020' },
        origin: 'Bogotá',
        destination: 'Medellín',
        obdCodes: 'P0300\nP0171',
        translations: [
            { code: 'P0300', description: 'Fallo de encendido' },
            { code: 'P0171', description: 'Mezcla pobre' }
        ]
    };

    test('envía los códigos traducidos y devuelve el análisis JSON de Gemini', async () => {
        const analysis = {
            safeToTravel: false,
            riskLevel: 'High',
            codeAnalysis: [{ code: 'P0300' }, { code: 'P0171' }],
            warnings: ['Revisar el motor'],
            recommendations: ['Visitar un mecánico'],
            estimatedTripTime: '4 horas',
            futureFailurePrediction: [],
            tripAdvice: { canTravel: 'No', explanation: 'Riesgo alto' }
        };
        global.fetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                candidates: [{
                    content: { parts: [{ text: JSON.stringify(analysis) }] }
                }]
            })
        });

        const result = await analyzeTrip(tripInput);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(requestBody.contents[0].parts[0].text).toContain('P0300');
        expect(requestBody.contents[0].parts[0].text).toContain('P0171');
        expect(result).toEqual(analysis);
    });

    test('expone el error HTTP de Gemini en vez de devolver un análisis de respaldo', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 403,
            text: jest.fn().mockResolvedValue('API key not valid')
        });

        await expect(analyzeTrip(tripInput)).rejects.toThrow(
            'Gemini API respondió HTTP 403: API key not valid'
        );
    });

    test('expone cuando Gemini bloquea o no devuelve contenido', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                candidates: [{ finishReason: 'SAFETY' }]
            })
        });

        await expect(analyzeTrip(tripInput)).rejects.toThrow(
            'Gemini no devolvió contenido. Motivo: SAFETY'
        );
    });

    test('expone si la respuesta de Gemini no es JSON válido', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                candidates: [{
                    content: { parts: [{ text: 'respuesta inválida' }] }
                }]
            })
        });

        await expect(analyzeTrip(tripInput)).rejects.toThrow(
            'Gemini devolvió JSON inválido'
        );
    });
});
