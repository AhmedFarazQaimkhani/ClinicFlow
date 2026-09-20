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

/** Digits-only form of an MRN / patient number for flexible search. */
export function mrnDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Expand a user search into possible patientNumber matches.
 * Accepts: P-000012, MRN-12, 12, 000012
 */
export function mrnSearchVariants(term: string): string[] {
  const raw = term.trim();
  if (!raw) return [];
  const digits = mrnDigits(raw);
  const variants = new Set<string>([raw]);
  if (digits) {
    const padded = digits.padStart(6, '0').slice(-6);
    variants.add(padded);
    variants.add(`P-${padded}`);
    // Only use short numeric forms when the user typed enough digits
    if (digits.length >= 3) {
      variants.add(digits);
      variants.add(`P-${digits}`);
    }
  }
  return [...variants];
}

/** Parse YYYY-MM-DD as a UTC date for Prisma @db.Date (Karachi clinic day). */
export function parseClinicDate(input: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Normalize token input: "3", "#3", "003" → "003" (or keep prefix if present). */
export function normalizeTokenQuery(input: string): string {
  const raw = input.trim().replace(/^#/, '');
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw;
  return digits.padStart(3, '0');
}

export function formatPrescriptionNumber(sequence: number): string {
  return `RX-${String(sequence).padStart(6, '0')}`;
}

export function karachiToday(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return new Date(`${parts}T00:00:00.000Z`);
}

export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
}

export function normalizePhone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  const trimmed = phone.replace(/[\s-]/g, '').trim();
  return trimmed.length ? trimmed : undefined;
}

export function isValidPkPhone(phone: string): boolean {
  return /^(03\d{9}|\+923\d{9}|92\d{10})$/.test(phone.replace(/[\s-]/g, ''));
}
