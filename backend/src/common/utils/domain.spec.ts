import {
  calculateMedicineQuantity,
  formatPatientNumber,
  formatPrescriptionNumber,
  formatTokenNumber,
  mrnSearchVariants,
  normalizeTokenQuery,
  parseClinicDate,
} from './domain';

describe('domain helpers', () => {
  it('calculates medicine quantity from dose × frequency × duration', () => {
    expect(calculateMedicineQuantity(1, 3, 1)).toBe(3);
    expect(calculateMedicineQuantity(1, 3, 5)).toBe(15);
    expect(calculateMedicineQuantity(2, 2, 7)).toBe(28);
  });

  it('does not allow negative quantity inputs', () => {
    expect(() => calculateMedicineQuantity(-1, 1, 1)).toThrow();
  });

  it('formats daily token numbers', () => {
    expect(formatTokenNumber(1)).toBe('001');
    expect(formatTokenNumber(128)).toBe('128');
    expect(formatTokenNumber(8, 'A')).toBe('A008');
  });

  it('formats patient and prescription numbers', () => {
    expect(formatPatientNumber(1)).toBe('P-000001');
    expect(formatPatientNumber(128)).toBe('P-000128');
    expect(formatPrescriptionNumber(10283)).toBe('RX-010283');
  });

  it('expands MRN search variants', () => {
    expect(mrnSearchVariants('12')).toContain('P-000012');
    expect(mrnSearchVariants('P-000002')).toContain('000002');
  });

  it('normalizes token and date queries', () => {
    expect(normalizeTokenQuery('3')).toBe('003');
    expect(normalizeTokenQuery('#12')).toBe('012');
    expect(parseClinicDate('2026-09-18')?.toISOString()).toBe('2026-09-18T00:00:00.000Z');
    expect(parseClinicDate('18/09/2026')).toBeNull();
  });
});
