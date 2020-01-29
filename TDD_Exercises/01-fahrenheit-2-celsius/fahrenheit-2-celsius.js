function fahrenheit2celcius(f) {
    return (f - 32) * (5 / 9);
}

function celcius2fahrenheit(c) {
    return (c * 9/5) + 32;
}

module.exports = {
    fahrenheit2celcius,
    celcius2fahrenheit
};

