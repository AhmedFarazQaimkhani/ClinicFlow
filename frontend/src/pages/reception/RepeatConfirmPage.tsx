import {
  Alert,
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useOnline } from '../../components/OfflineBanner';
import { PageHeader } from '../../components/PageHeader';
import dayjs from 'dayjs';

export default function RepeatConfirmPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const online = useOnline();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const latest = useQuery({
    queryKey: ['latest-rx', patientId],
    queryFn: async () => (await api.get('/prescriptions/latest', { params: { patientId } })).data.data,
  });

  const items = latest.data?.items ?? [];
  const chosen = useMemo(
    () => items.filter((i: { id: string }) => (selected.length ? selected.includes(i.id) : true)),
    [items, selected],
  );

  async function confirm() {
    if (!online) {
      setError('Connection lost. Please reconnect before saving.');
      return;
    }
    try {
      const res = await api.post('/dispensing/repeat', {
        patientId,
        prescriptionId: latest.data.id,
        itemIds: chosen.map((i: { id: string }) => i.id),
      });
      if (res.data.data.requiresApproval) {
        setDone(true);
        setError('');
        return;
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not repeat medicines.');
    }
  }

  if (latest.isError) {
    return <Alert severity="warning">No previous prescription found. This patient should see the doctor.</Alert>;
  }

  if (done) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ py: 6 }}>
        <PageHeader title="Done" subtitle="Medicines given. No token was created." />
        <Button variant="contained" onClick={() => navigate('/app/reception')}>
          Back to dashboard
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={2} maxWidth={640}>
      <PageHeader
        title="Repeat medicines"
        subtitle={`Last prescription · ${latest.data ? dayjs(latest.data.createdAt).format('D MMM YYYY') : ''}`}
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Alert severity="info" sx={{ bgcolor: '#ECFDF5', color: '#134E4A' }}>
        No separate charge. Medicines are covered under the doctor fee.
      </Alert>
      {items.map(
        (item: {
          id: string;
          medicineNameSnapshot: string;
          strengthSnapshot?: string;
          quantity: number;
        }) => (
          <Card key={item.id} sx={{ px: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selected.length === 0 || selected.includes(item.id)}
                  onChange={(e) => {
                    const base = selected.length ? selected : items.map((i: { id: string }) => i.id);
                    setSelected(
                      e.target.checked ? [...base, item.id] : base.filter((id: string) => id !== item.id),
                    );
                  }}
                />
              }
              label={`${item.medicineNameSnapshot} ${item.strengthSnapshot ?? ''} · Qty ${item.quantity}`}
            />
          </Card>
        ),
      )}
      <Typography color="text.secondary">
        {chosen.length} medicine{chosen.length === 1 ? '' : 's'} selected · Amount due: PKR 0
      </Typography>
      <Button variant="contained" color="success" onClick={confirm} disabled={!online || !chosen.length}>
        Confirm & give medicine
      </Button>
    </Stack>
  );
}
