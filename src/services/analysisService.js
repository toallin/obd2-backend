const analyze = (data) => {
    if (data.temperature > 90) {
        return "Alerta: Sobrecalentamiento";
    }

    if (data.fuel < 10) {
        return "Alerta: Combustible bajo";
    }

    return "Vehículo en buen estado";
};

module.exports = { analyze };