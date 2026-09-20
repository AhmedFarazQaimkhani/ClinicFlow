import { Alert, Button, Card, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import api from '../../api/client';
import { formatPkr } from '../../types';
import { PageHeader } from '../../components/PageHeader';

export default function DoctorSettingsPage() {
  const qc = useQueryClient();
  const me = useQuery({
    queryKey: ['doctor-me'],
    queryFn: async () => (await api.get('/doctors/me')).data.data,
  });
  const [fee, setFee] = useState('1500');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (me.data?.consultationFee != null) {
      setFee(String(me.data.consultationFee));
    }
  }, [me.data]);

  const save = useMutation({
    mutationFn: async () =>
      api.patch('/doctors/me/fee', { consultationFee: Number(fee) || 0 }),
    onSuccess: (res) => {
      setMessage(`Doctor fee saved: ${formatPkr(Number(res.data.data.consultationFee))}`);
      setError('');
      qc.invalidateQueries({ queryKey: ['doctor-me'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['token-preview'] });
    },
    onError: (err: Error) => {
      setError(err.message);
      setMessage('');
    },
  });

  function bump(delta: number) {
    setFee(String(Math.max(0, (Number(fee) || 0) + delta)));
  }

  return (
    <Stack spacing={2} maxWidth={480}>
      <PageHeader
        title="Doctor fee"
        subtitle="Increase or decrease your consultation fee. Medicines are included in this fee."
      />
      {error && <Alert severity="error">{error}</Alert>}
      {message && <Alert severity="success">{message}</Alert>}
      <Card sx={{ p: 3 }}>
        <Typography color="text.secondary" sx={{ mb: 1 }}>
          Current fee
        </Typography>
        <Typography variant="h3" sx={{ mb: 3 }}>
          {formatPkr(Number(fee) || 0)}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button variant="outlined" onClick={() => bump(-100)}>
            − 100
          </Button>
          <Button variant="outlined" onClick={() => bump(-50)}>
            − 50
          </Button>
          <Button variant="outlined" onClick={() => bump(50)}>
            + 50
          </Button>
          <Button variant="outlined" onClick={() => bump(100)}>
            + 100
          </Button>
        </Stack>
        <TextField
          label="Consultation fee (PKR)"
          type="number"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save doctor fee'}
        </Button>
      </Card>
    </Stack>
  );
}
