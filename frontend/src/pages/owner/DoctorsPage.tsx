import { Button, Card, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

export default function DoctorsPage() {
  const doctors = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => (await api.get('/doctors')).data.data,
  });
  return (
    <Stack spacing={2}>
      <PageHeader title="Doctors" subtitle="Doctors working at this clinic." />
      {(doctors.data ?? []).map(
        (d: { id: string; name: string; specialization?: string; consultationFee: string }) => (
          <Card key={d.id} sx={{ p: 2 }}>
            <Typography fontWeight={700}>{d.name}</Typography>
            <Typography color="text.secondary">
              {d.specialization} · PKR {Number(d.consultationFee)}
            </Typography>
          </Card>
        ),
      )}
      <Button disabled>Add doctor from Staff</Button>
    </Stack>
  );
}
