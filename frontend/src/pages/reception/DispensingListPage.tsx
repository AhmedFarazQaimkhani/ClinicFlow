import { Button, Card, Chip, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { TokenBadge } from '../../components/TokenBadge';

export default function DispensingListPage() {
  const ready = useQuery({
    queryKey: ['dispensing-ready'],
    queryFn: async () => (await api.get('/dispensing/ready')).data.data,
    refetchInterval: 4000,
  });

  return (
    <Stack spacing={2}>
      <PageHeader title="Ready for dispensing" subtitle="Give medicines after the doctor writes, or for a repeat." />
      {(ready.data ?? []).map(
        (row: {
          id: string;
          patient: { name: string };
          prescription: { visit?: { token?: { tokenNumber: string } }; items: { medicineNameSnapshot: string }[] };
        }) => (
          <Card key={row.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
              {row.prescription.visit?.token ? (
                <TokenBadge number={row.prescription.visit.token.tokenNumber} size="sm" />
              ) : (
                <Chip label="Repeat" size="small" sx={{ bgcolor: '#ECFDF5', color: '#047857', fontWeight: 700 }} />
              )}
              <div>
                <Typography fontWeight={800}>{row.patient.name}</Typography>
                <Typography color="text.secondary">
                  {row.prescription.items.map((i) => i.medicineNameSnapshot).join(', ')}
                </Typography>
              </div>
            </Stack>
            <Button component={Link} to={`/app/dispensing/${row.id}`} variant="contained">
              Give medicine
            </Button>
          </Card>
        ),
      )}
      {!ready.data?.length && <Typography color="text.secondary">Nothing waiting.</Typography>}
    </Stack>
  );
}
