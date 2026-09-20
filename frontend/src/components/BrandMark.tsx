import { Box } from '@mui/material';

export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        borderRadius: 2,
        bgcolor: '#0F766E',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        boxShadow: '0 6px 16px rgba(15, 118, 110, 0.28)',
      }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path
          d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z"
          fill="#ECFDF5"
        />
      </svg>
    </Box>
  );
}
