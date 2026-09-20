import { Card, Typography } from '@mui/material';

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <Card sx={{ p: 2.25, borderTop: accent ? `3px solid ${accent}` : undefined }}>
      <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ mt: 0.5 }}>
        {value}
      </Typography>
    </Card>
  );
}
