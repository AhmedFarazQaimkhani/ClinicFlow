import { Chip } from '@mui/material';

/** Permanent patient Medical Record Number (unique per clinic). */
export function MrnChip({ mrn }: { mrn: string }) {
  return (
    <Chip
      size="small"
      label={`MRN ${mrn}`}
      sx={{ bgcolor: '#E6F4F1', color: '#0F766E', fontWeight: 700 }}
    />
  );
}
