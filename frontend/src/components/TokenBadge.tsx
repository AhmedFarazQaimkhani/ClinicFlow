import { Box } from '@mui/material';

export function TokenBadge({ number, size = 'md' }: { number: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims =
    size === 'lg'
      ? { minWidth: 88, height: 88, fontSize: 32, borderRadius: 4 }
      : size === 'sm'
        ? { minWidth: 48, height: 36, fontSize: 14, borderRadius: 1.5 }
        : { minWidth: 56, height: 44, fontSize: 16, borderRadius: 2 };
  return (
    <Box
      sx={{
        ...dims,
        px: 1.25,
        bgcolor: '#0F766E',
        color: '#ECFDF5',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 800,
        letterSpacing: '-0.02em',
        flexShrink: 0,
      }}
    >
      #{number}
    </Box>
  );
}
