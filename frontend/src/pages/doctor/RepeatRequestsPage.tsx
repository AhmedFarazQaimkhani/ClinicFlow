import { Button, Card, Stack, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

export default function RepeatRequestsPage() {
  const qc = useQueryClient();
  const rows = useQuery({
    queryKey: ['repeat-requests'],
    queryFn: async () => (await api.get('/dispensing/repeat-requests')).data.data,
  });

  async function review(id: string, status: 'APPROVED' | 'REJECTED') {
    await api.post(`/dispensing/repeat-requests/${id}/review`, { status });
    qc.invalidateQueries({ queryKey: ['repeat-requests'] });
  }

  return (
    <Stack spacing={2}>
      <PageHeader title="Repeat requests" subtitle="Approve or reject repeat medicine requests." />
      {(rows.data ?? []).map(
        (row: { id: string; patient: { name: string }; prescription: { prescriptionNumber: string } }) => (
          <Card key={row.id} sx={{ p: 2 }}>
            <Typography fontWeight={700}>{row.patient.name}</Typography>
            <Typography color="text.secondary">{row.prescription.prescriptionNumber}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button variant="contained" onClick={() => review(row.id, 'APPROVED')}>
                Approve
              </Button>
              <Button color="error" onClick={() => review(row.id, 'REJECTED')}>
                Reject
              </Button>
            </Stack>
          </Card>
        ),
      )}
      {!rows.data?.length && <Typography color="text.secondary">No pending requests.</Typography>}
    </Stack>
  );
}
