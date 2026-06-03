require('dotenv').config();

async function analyzeTrip({ vehicle, origin, destination, obdCodes, translations }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY missing in .env');
  }

  const prompt = `
Eres un ingeniero automotriz experto en diagnóstico predictivo y mecánica automotriz.
Tu tarea es analizar el estado del vehículo antes de un viaje y predecir posibles fallas.

---
VEHÍCULO:
${vehicle.brand} ${vehicle.model} (${vehicle.year})

ORIGEN:
${origin}

DESTINO:
${destination}

---
CÓDIGOS OBD2 DETECTADOS:
${translations?.length
      ? translations.map(t => `
Código: ${t.code}
Problema: ${t.description}
`).join('\n')
      : 'No hay códigos OBD2 detectados'}

---
TAREAS:
1. Analiza cada código OBD2 individualmente detallando significado, causa probable, riesgo y qué puede fallar durante el viaje.
2. Explica qué pasará si el usuario viaja sin reparar.
3. Da un diagnóstico general del motor.
4. Incluye recomendaciones de viaje.
5. Para cada código incluye qué debe revisar el mecánico, posible reparación y nivel de costo (Low, Medium, High).
6. Predice fallas futuras del vehículo durante el viaje.
7. Determina si puede viajar, puede viajar con riesgo o NO debe viajar.

IMPORTANTE: Responde estrictamente en español.
`;

  // 🔹 Definimos el esquema exacto que necesitas para tu UI
  const jsonSchema = {
    type: "OBJECT",
    properties: {
      safeToTravel: { type: "BOOLEAN" },
      riskLevel: { type: "STRING", enum: ["Low", "Medium", "High"] },
      estimatedTripTime: { type: "STRING" },
      codeAnalysis: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            code: { type: "STRING" },
            meaning: { type: "STRING" },
            cause: { type: "STRING" },
            risk: { type: "STRING" },
            whatCanHappenDuringTrip: { type: "STRING" },
            mechanicAdvice: { type: "STRING" },
            possibleRepair: { type: "STRING" },
            repairCostLevel: { type: "STRING", enum: ["Low", "Medium", "High"] }
          },
          required: ["code", "meaning", "cause", "risk", "whatCanHappenDuringTrip", "mechanicAdvice", "possibleRepair", "repairCostLevel"]
        }
      },
      warnings: { type: "ARRAY", items: { type: "STRING" } },
      recommendations: { type: "ARRAY", items: { type: "STRING" } },
      futureFailurePrediction: { type: "ARRAY", items: { type: "STRING" } },
      tripAdvice: {
        type: "OBJECT",
        properties: {
          canTravel: { type: "STRING" },
          explanation: { type: "STRING" }
        },
        required: ["canTravel", "explanation"]
      }
    },
    required: ["safeToTravel", "riskLevel", "estimatedTripTime", "codeAnalysis", "warnings", "recommendations", "futureFailurePrediction", "tripAdvice"]
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          // 🔥 AQUÍ CONFIGURAMOS EL MODO JSON ESTRICTO
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: jsonSchema
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error('Gemini API error: ' + err);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Ya viene como JSON puro de forma garantizada, directo al parse
    return JSON.parse(rawText.trim());

  } catch (e) {
    console.error('❌ ERROR PROCESANDO DIAGNÓSTICO:', e);

    return {
      safeToTravel: false,
      riskLevel: "Medium",
      estimatedTripTime: "N/A",
      codeAnalysis: [],
      warnings: ["Error al procesar respuesta de IA"],
      recommendations: ["Reintentar análisis"],
      futureFailurePrediction: [],
      tripAdvice: {
        canTravel: "UNKNOWN",
        explanation: "No se pudo analizar correctamente debido a un fallo en el formateo."
      }
    };
  }
}

module.exports = { analyzeTrip };