import { Alert, Box, Button, Card, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { formatPkr } from '../../types';
import { useOnline } from '../../components/OfflineBanner';
import { PageHeader } from '../../components/PageHeader';

export default function DispenseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const online = useOnline();
  const [method, setMethod] = useState('CASH');
  const [error, setError] = useState('');

  const row = useQuery({
    queryKey: ['dispensing', id],
    queryFn: async () => (await api.get(`/dispensing/${id}`)).data.data,
  });

  const data = row.data;
  if (!data) return null;

  const items = data.prescription.items;
  const consult = Number(data.prescription.visit?.doctor?.consultationFee ?? 1500);
  const consultPaid = (data.prescription.visit?.payments ?? []).some(
    (p: { visitId?: string; dispensingId?: string; status: string }) =>
      p.status === 'PAID' && p.visitId && !p.dispensingId,
  );
  const due = consultPaid ? 0 : consult;

  async function complete() {
    if (!online) {
      setError('Connection lost. Please reconnect before saving.');
      return;
    }
    try {
      await api.post(`/dispensing/${id}/complete`, {
        paymentMethod: method,
        consultationAmount: due,
      });
      navigate('/app/dispensing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete.');
    }
  }

  return (
    <Stack spacing={2} maxWidth={640}>
      <PageHeader title="Give medicine" subtitle={data.patient.name} />
      {error && <Alert severity="error">{error}</Alert>}
      <Alert severity="info" sx={{ bgcolor: '#ECFEFF', color: '#134E4A' }}>
        Medicines are included in the doctor fee. No separate medicine charge.
      </Alert>
      {items.map(
        (item: { id: string; medicineNameSnapshot: string; quantity: number; strengthSnapshot?: string }) => (
          <Card key={item.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography>
              {item.medicineNameSnapshot} {item.strengthSnapshot}
            </Typography>
            <Typography color="text.secondary">Qty {item.quantity}</Typography>
          </Card>
        ),
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography>Doctor fee</Typography>
        <Typography fontWeight={700}>{consultPaid ? 'Already paid' : formatPkr(consult)}</Typography>
      </Box>
      {due > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Collect now</Typography>
            <Typography variant="h6">{formatPkr(due)}</Typography>
          </Box>
          <TextField select label="Payment" value={method} onChange={(e) => setMethod(e.target.value)}>
            {['CASH', 'CARD', 'BANK_TRANSFER', 'JAZZCASH', 'EASYPAISA', 'OTHER'].map((m) => (
              <MenuItem key={m} value={m}>
                {m.replace('_', ' ')}
              </MenuItem>
            ))}
          </TextField>
        </>
      )}
      <Button variant="contained" onClick={complete} disabled={!online}>
        {due > 0 ? 'Collect fee & give medicine' : 'Give medicine'}
      </Button>
    </Stack>
  );
}
