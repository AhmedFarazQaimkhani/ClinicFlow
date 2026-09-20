import { Card, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { formatPkr } from '../../types';
import dayjs from 'dayjs';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';

export default function PaymentsPage() {
  const payments = useQuery({
    queryKey: ['payments'],
    queryFn: async () => (await api.get('/payments')).data.data,
  });
  return (
    <Stack spacing={2}>
      <PageHeader title="Payments" subtitle="Today's cash, card, JazzCash, and Easypaisa." />
      {(payments.data ?? []).map(
        (p: {
          id: string;
          amount: string;
          paymentMethod: string;
          status: string;
          paidAt?: string;
          patient: { name: string };
        }) => (
          <Card key={p.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <div>
              <Typography fontWeight={700}>{p.patient.name}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography color="text.secondary">{p.paymentMethod}</Typography>
                <StatusChip status={p.status} />
                {p.paidAt && (
                  <Typography color="text.secondary">· {dayjs(p.paidAt).format('h:mm A')}</Typography>
                )}
              </Stack>
            </div>
            <Typography fontWeight={800}>{formatPkr(Number(p.amount))}</Typography>
          </Card>
        ),
      )}
    </Stack>
  );
}
