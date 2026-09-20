export type UserRole = 'OWNER' | 'DOCTOR' | 'RECEPTIONIST' | 'DISPENSER';

export interface SessionUser {
  id: string;
  clinicId: string;
  name: string;
  role: UserRole;
  canDispense: boolean;
  doctorId: string | null;
  clinicName: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

export function formatPkr(amount: number): string {
  return `PKR ${Math.round(Number(amount) || 0).toLocaleString('en-PK')}`;
}

export function calculateMedicineQuantity(
  doseQuantity: number,
  frequencyPerDay: number,
  durationDays: number,
): number {
  return Math.max(1, Math.ceil(doseQuantity * frequencyPerDay * durationDays));
}
