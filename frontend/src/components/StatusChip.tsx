import { Chip } from '@mui/material';

const STYLES: Record<string, { bg: string; color: string; label: string }> = {
  WAITING: { bg: '#FFF7ED', color: '#C2410C', label: 'Waiting' },
  CALLED: { bg: '#EFF6FF', color: '#1D4ED8', label: 'Called' },
  CONSULTING: { bg: '#ECFEFF', color: '#0F766E', label: 'With doctor' },
  COMPLETED: { bg: '#ECFDF5', color: '#047857', label: 'Completed' },
  CANCELLED: { bg: '#FEF2F2', color: '#B91C1C', label: 'Cancelled' },
  NO_SHOW: { bg: '#F5F5F4', color: '#57534E', label: 'No-show' },
  PRESCRIPTION_READY: { bg: '#ECFEFF', color: '#0F766E', label: 'Ready' },
  READY: { bg: '#ECFEFF', color: '#0F766E', label: 'Ready' },
  DISPENSED: { bg: '#ECFDF5', color: '#047857', label: 'Given' },
  PENDING: { bg: '#FFF7ED', color: '#C2410C', label: 'Pending' },
  PAID: { bg: '#ECFDF5', color: '#047857', label: 'Paid' },
};

export function StatusChip({ status }: { status: string }) {
  const style = STYLES[status] ?? {
    bg: '#F1F5F9',
    color: '#475569',
    label: status.replaceAll('_', ' ').toLowerCase(),
  };
  return (
    <Chip
      label={style.label}
      size="small"
      sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700 }}
    />
  );
}
