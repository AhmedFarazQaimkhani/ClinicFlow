import {
  Alert,
  Box,
  Button,
  Card,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { formatPkr } from '../../types';
import { useOnline } from '../../components/OfflineBanner';
import { PageHeader } from '../../components/PageHeader';
import { TokenBadge } from '../../components/TokenBadge';
import { MrnChip } from '../../components/MrnChip';
import dayjs from 'dayjs';

export default function CreateTokenPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const online = useOnline();
  const [payNow, setPayNow] = useState('later');
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{
    tokenNumber: string;
    tokenDate?: string;
    patient?: { name: string; patientNumber: string };
  } | null>(null);

  const patient = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => (await api.get(`/patients/${patientId}`)).data.data,
  });
  const preview = useQuery({
    queryKey: ['token-preview'],
    queryFn: async () => (await api.get('/tokens/preview')).data.data,
  });
  const settings = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data.data,
  });
  const doctor = settings.data?.doctors?.[0];

  async function create() {
    if (!online) {
      setError('Connection lost. Please reconnect before saving.');
      return;
    }
    try {
      const res = await api.post('/tokens', {
        patientId,
        doctorId: doctor?.id,
        payNow: payNow === 'now',
        paymentMethod: 'CASH',
      });
      setCreated(res.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create token.');
    }
  }

  if (created) {
    return (
      <Stack spacing={3} alignItems="center" sx={{ py: 6 }}>
        <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
          Token given · {dayjs(created.tokenDate || undefined).format('D MMM YYYY')}
        </Typography>
        <TokenBadge number={created.tokenNumber} size="lg" />
        <Typography variant="h5">{created.patient?.name ?? patient.data?.name}</Typography>
        <MrnChip mrn={created.patient?.patientNumber ?? patient.data?.patientNumber ?? ''} />
        <Typography color="text.secondary" sx={{ textAlign: 'center', maxWidth: 360 }}>
          Rozana token 001 se start hota hai. Kal wapas dhoondhne ke liye date + token, ya MRN use karein.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/app/reception')}>
          Back to dashboard
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={2} maxWidth={520}>
      <PageHeader title="Create token" subtitle="Confirm the patient, then print today's token." />
      {error && <Alert severity="error">{error}</Alert>}
      <Card sx={{ p: 2 }}>
        <Row label="Patient" value={patient.data?.name ?? '…'} />
        <Row label="MRN" value={patient.data?.patientNumber ?? '…'} />
        <Row label="Doctor" value={doctor?.name ?? 'Dr. Ahmed'} />
        <Row label="Consultation Fee" value={formatPkr(Number(preview.data?.consultationFee ?? 1500))} />
        <Row label="Today's date" value={dayjs().format('D MMM YYYY')} />
        <Row label="Token Preview" value={`#${preview.data?.tokenNumber ?? '—'}`} />
      </Card>
      <Typography fontWeight={700}>Payment</Typography>
      <RadioGroup value={payNow} onChange={(e) => setPayNow(e.target.value)}>
        <FormControlLabel value="now" control={<Radio />} label="Pay now" />
        <FormControlLabel value="later" control={<Radio />} label="Pay later" />
      </RadioGroup>
      <Button variant="contained" onClick={create} disabled={!online}>
        Create Token
      </Button>
    </Stack>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight={700}>{value}</Typography>
    </Box>
  );
}
