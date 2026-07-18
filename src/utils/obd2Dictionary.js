const obd2Dictionary = {
    P0128: {
        description: 'Temperatura del refrigerante baja (termostato defectuoso)',
        affects: 'Sistema de enfriamiento y rendimiento térmico del motor',
        symptoms: 'La calefacción del habitáculo no calienta bien, aumento leve en consumo de combustible y la aguja de temperatura tarda en subir.',
        guide: '1. Verifique el nivel y estado del líquido refrigerante.\n2. Pruebe el termostato; a menudo se queda pegado en posición abierta y requiere reemplazo.\n3. Inspeccione el sensor de temperatura del refrigerante (ECT) y su cableado.'
    },
    P0171: {
        description: 'Mezcla aire-combustible demasiado pobre (Banco 1)',
        affects: 'Sistema de inyección y admisión de aire',
        symptoms: 'Falta de potencia al acelerar, motor inestable o tembloroso en ralentí, a veces se escuchan pequeñas explosiones de admisión.',
        guide: '1. Busque fugas de aire o vacío en las mangueras de admisión.\n2. Limpie el sensor de flujo de masa de aire (MAF) con limpiador especial.\n3. Compruebe el filtro y la presión de la bomba de gasolina (posible baja presión).'
    },
    P0300: {
        description: 'Fallas de encendido múltiples o aleatorias detectadas',
        affects: 'Motor, combustión interna y eficiencia de combustible',
        symptoms: 'Temblores fuertes del motor, pérdida notable de potencia, olor a gasolina cruda en el escape y parpadeo de la luz Check Engine.',
        guide: '1. Revise el estado de las bujías (desgaste o depósitos de carbón) y sus cables.\n2. Pruebe las bobinas de encendido (puede intercambiarlas para verificar si la falla se muda).\n3. Inspeccione los inyectores y verifique que no haya fugas de vacío en el colector de admisión.'
    },
    P0420: {
        description: 'Eficiencia del sistema del convertidor catalítico por debajo del umbral',
        affects: 'Sistema de escape y control de emisiones contaminantes',
        symptoms: 'Olor fuerte a huevo podrido o azufre proveniente del escape, pérdida ligera de potencia y luz de advertencia del motor encendida.',
        guide: '1. Compruebe si hay fugas de escape en los tubos o juntas antes del catalizador.\n2. Monitoree las lecturas de los sensores de oxígeno delantero y trasero para descartar fallas de sensores.\n3. Si los sensores operan bien, probablemente requiera reemplazar el catalizador.'
    },
    P0455: {
        description: 'Fuga grande detectada en el sistema de emisiones evaporativas (EVAP)',
        affects: 'Sistema de emisiones y tanque de combustible',
        symptoms: 'Fuerte olor a vapores de gasolina cerca del vehículo. No suele causar fallas directas en la marcha del motor.',
        guide: '1. Inspeccione la tapa del tanque de combustible (puede estar floja, agrietada o mal sellada).\n2. Revise las mangueras y tuberías de la línea de carbón activado (canister).\n3. Verifique el estado de la válvula de purga del EVAP.'
    },
    P0500: {
        description: 'Mal funcionamiento del sensor de velocidad del vehículo (VSS)',
        affects: 'Transmisión automática, velocímetro y control de crucero',
        symptoms: 'El velocímetro no registra velocidad o salta de forma inestable, cambios bruscos o tardíos en transmisiones automáticas.',
        guide: '1. Revise el conector físico y el cableado del sensor de velocidad en la transmisión.\n2. Limpie el extremo magnético del sensor de posibles virutas de metal.\n3. Mida la resistencia eléctrica del sensor VSS y reemplácelo si es necesario.'
    },
    P0113: {
        description: 'Circuito del sensor de temperatura del aire de admisión (IAT) - Entrada alta',
        affects: 'Admisión y cálculo de la densidad de aire',
        symptoms: 'Dificultad para encender el motor en frío, marcha mínima (ralentí) inestable y consumo ligeramente elevado de combustible.',
        guide: '1. Asegúrese de que el sensor IAT (integrado en el MAF en muchos autos) esté bien conectado.\n2. Revise si hay cables cortados o contactos sucios.\n3. Reemplace el sensor IAT si las lecturas de resistencia no coinciden con las tablas del fabricante.'
    },
    P0135: {
        description: 'Falla en el circuito del calentador del sensor de oxígeno (Banco 1, Sensor 1)',
        affects: 'Sistema de escape y dosificación de combustible',
        symptoms: 'Aumento del consumo de combustible y mayor emisión de humo negro debido a que el motor tarda más en entrar en circuito cerrado.',
        guide: '1. Revise el fusible del circuito del calentador del sensor de oxígeno (O2 Heater).\n2. Mida la resistencia del elemento calefactor en el sensor (pines de calefacción).\n3. Si el calentador interno está abierto, reemplace el sensor de oxígeno.'
    }
};

module.exports = obd2Dictionary;