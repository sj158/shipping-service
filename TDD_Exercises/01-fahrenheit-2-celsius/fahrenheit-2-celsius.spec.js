const { fahrenheit2celcius } = require('./fahrenheit-2-celsius.js');

describe('the fahrenheit-2-celcius canary spec', () => {
  it('shows the infrastructure works', () => {
    expect(true).toBe(true);
  });

  describe('the fahrenheit-2-celcius should behave as follows', () => {

    it('function fahrenheit2celcius exists', () => {
      expect(fahrenheit2celcius).toBeDefined();
    });

    it('converts 50 F to 10C', () => {
      expect(fahrenheit2celcius(50)).toEqual(10)
    });

    it('convert 212 F to 100 C', () => {
      expect(fahrenheit2celcius(212)).toEqual(100)
    });

    it('convert 32 F to 0 C', () => {
      expect(fahrenheit2celcius(32)).toEqual(0)
    });

    it('convert -40 F to -40 C', () => {
      expect(fahrenheit2celcius(-40)).toEqual(-40)
    });

  });

});