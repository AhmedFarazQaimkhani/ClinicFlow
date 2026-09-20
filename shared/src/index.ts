export const ROLES = ['OWNER', 'DOCTOR', 'RECEPTIONIST', 'DISPENSER'] as const;
export type UserRole = (typeof ROLES)[number];

export const TOKEN_STATUSES = [
  'WAITING',
  'CALLED',
  'CONSULTING',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;
export type TokenStatus = (typeof TOKEN_STATUSES)[number];

export const VISIT_STATUSES = [
  'WAITING',
  'CONSULTING',
  'PRESCRIPTION_READY',
  'COMPLETED',
  'CANCELLED',
] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

export const PRESCRIPTION_STATUSES = [
  'DRAFT',
  'READY',
  'PARTIALLY_DISPENSED',
  'DISPENSED',
  'CANCELLED',
] as const;
export type PrescriptionStatus = (typeof PRESCRIPTION_STATUSES)[number];

export const DISPENSING_TYPES = ['NEW_PRESCRIPTION', 'REPEAT'] as const;
export type DispensingType = (typeof DISPENSING_TYPES)[number];

export const PAYMENT_METHODS = [
  'CASH',
  'CARD',
  'BANK_TRANSFER',
  'JAZZCASH',
  'EASYPAISA',
  'OTHER',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_TIMINGS = [
  'BEFORE_CONSULTATION',
  'AFTER_CONSULTATION',
  'AT_DISPENSING',
] as const;
export type PaymentTiming = (typeof PAYMENT_TIMINGS)[number];

export function calculateMedicineQuantity(
  doseQuantity: number,
  frequencyPerDay: number,
  durationDays: number,
): number {
  if (doseQuantity < 0 || frequencyPerDay < 0 || durationDays < 0) {
    throw new Error('Quantity inputs cannot be negative.');
  }
  return Math.max(1, Math.ceil(doseQuantity * frequencyPerDay * durationDays));
}

export function formatTokenNumber(sequence: number, prefix = ''): string {
  return `${prefix}${String(sequence).padStart(3, '0')}`;
}

export function formatPatientNumber(sequence: number): string {
  return `P-${String(sequence).padStart(6, '0')}`;
}

export function formatPrescriptionNumber(sequence: number): string {
  return `RX-${String(sequence).padStart(6, '0')}`;
}

export function karachiDateString(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatPkr(amount: number): string {
  return `PKR ${Math.round(amount).toLocaleString('en-PK')}`;
}
