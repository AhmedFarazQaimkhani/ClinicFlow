import { Box, Card, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { formatPkr } from '../../types';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';

export default function ReportsPage() {
  const daily = useQuery({
    queryKey: ['report-daily'],
    queryFn: async () => (await api.get('/reports/daily')).data.data,
  });
  const meds = useQuery({
    queryKey: ['report-meds'],
    queryFn: async () => (await api.get('/reports/medicines')).data.data,
  });
  const d = daily.data;
  return (
    <Stack spacing={2}>
      <PageHeader title="Reports" subtitle="Today's patients, repeats, and doctor-fee collection." />
      {d && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          <StatCard label="Total patients" value={d.totalPatients} accent="#0F766E" />
          <StatCard label="Doctor consultations" value={d.doctorConsultations} accent="#1D4ED8" />
          <StatCard label="Medicine repeats" value={d.medicineRepeats} accent="#047857" />
          <StatCard label="Doctor fee collection" value={formatPkr(d.consultationRevenue)} accent="#1D4ED8" />
          <StatCard label="Pending" value={formatPkr(d.pendingPayments)} accent="#C2410C" />
          <StatCard label="Total collection" value={formatPkr(d.totalRevenue)} accent="#0F766E" />
        </Box>
      )}
      <Typography variant="h6">Medicines given today</Typography>
      <Typography color="text.secondary" sx={{ mt: -1 }}>
        Stock use only — medicines are not billed separately.
      </Typography>
      {(meds.data ?? []).map(
        (m: { medicine: string; quantity: number; stock: number }) => (
          <Card key={m.medicine} sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography fontWeight={700}>{m.medicine}</Typography>
            <Typography color="text.secondary">
              Qty {m.quantity} · stock left {m.stock}
            </Typography>
          </Card>
        ),
      )}
    </Stack>
  );
}
