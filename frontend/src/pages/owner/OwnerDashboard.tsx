import { Box, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { formatPkr } from '../../types';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';

export default function OwnerDashboard() {
  const daily = useQuery({
    queryKey: ['owner-today'],
    queryFn: async () => (await api.get('/reports/daily')).data.data,
  });
  const d = daily.data;
  return (
    <Stack spacing={2}>
      <PageHeader title="Today" subtitle="Clinic collection and patient counts." />
      {d && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          <StatCard label="Patients" value={d.totalPatients} accent="#0F766E" />
          <StatCard label="Doctor visits" value={d.doctorConsultations} accent="#1D4ED8" />
          <StatCard label="Medicine repeats" value={d.medicineRepeats} accent="#047857" />
          <StatCard label="Collection" value={formatPkr(d.totalRevenue)} accent="#0F766E" />
          <StatCard label="Pending" value={formatPkr(d.pendingPayments)} accent="#C2410C" />
        </Box>
      )}
    </Stack>
  );
}
