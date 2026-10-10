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
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: jsonSchema
        }
      })
    }
  );

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Gemini API respondió HTTP ${response.status}: ${errorDetails}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const rawText = candidate?.content?.parts
    ?.find(part => typeof part.text === 'string')
    ?.text;

  if (!rawText?.trim()) {
    const reason = candidate?.finishReason || data.promptFeedback?.blockReason;
    throw new Error(
      reason
        ? `Gemini no devolvió contenido. Motivo: ${reason}`
        : 'Gemini no devolvió contenido para el análisis'
    );
  }

  try {
    return JSON.parse(rawText.trim());
  } catch (error) {
    throw new Error(`Gemini devolvió JSON inválido: ${error.message}`);
  }
}

module.exports = { analyzeTrip };