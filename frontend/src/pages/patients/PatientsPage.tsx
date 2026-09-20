import {
  Alert,
  Box,
  Button,
  Card,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { MrnChip } from '../../components/MrnChip';
import { StatusChip } from '../../components/StatusChip';
import { TokenBadge } from '../../components/TokenBadge';

type PatientRow = {
  id: string;
  name: string;
  patientNumber: string;
  phone?: string;
};

type DayToken = {
  id: string;
  tokenNumber: string;
  status: string;
  tokenDate: string;
  patient: { id: string; name: string; patientNumber: string; phone?: string };
  visit?: {
    id: string;
    complaint?: string;
    prescription?: { items: { medicineNameSnapshot: string }[] };
  };
};

export default function PatientsPage() {
  const [mode, setMode] = useState<'patient' | 'day'>('patient');
  const [q, setQ] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [token, setToken] = useState('');

  const patients = useQuery({
    queryKey: ['patients', q],
    queryFn: async () => (await api.get('/patients', { params: { q } })).data.data as PatientRow[],
    enabled: mode === 'patient',
  });

  const day = useQuery({
    queryKey: ['tokens-by-day', date, token],
    queryFn: async () =>
      (
        await api.get('/tokens/by-day', {
          params: { date, ...(token.trim() ? { token: token.trim() } : {}) },
        })
      ).data.data as { date: string; count: number; tokens: DayToken[] },
    enabled: mode === 'day' && Boolean(date),
  });

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Patients"
        subtitle="Har patient ka permanent MRN hota hai. Rozana token 001 se restart hota hai — date + token se us din ke patients milte hain."
      />

      <Tabs
        value={mode}
        onChange={(_e, v: 'patient' | 'day') => setMode(v)}
        sx={{ minHeight: 44, '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 700 } }}
      >
        <Tab value="patient" label="MRN / name / phone" />
        <Tab value="day" label="Date / token" />
      </Tabs>

      {mode === 'patient' && (
        <>
          <TextField
            label="Search MRN, name, or phone"
            placeholder="P-000002 · Fatima · 0300…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
          <Typography color="text.secondary" sx={{ fontSize: 14 }}>
            MRN kabhi change nahi hota. Isi se history aur repeat medicine asani se milti hai.
          </Typography>
          {(patients.data ?? []).map((p) => (
            <Card
              key={p.id}
              sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}
            >
              <Box>
                <Typography fontWeight={700}>{p.name}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <MrnChip mrn={p.patientNumber} />
                  {p.phone && <Typography color="text.secondary">{p.phone}</Typography>}
                </Stack>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button component={Link} to={`/app/patients/${p.id}`} variant="outlined">
                  History
                </Button>
                <Button component={Link} to={`/app/repeat/${p.id}`} color="success" variant="contained">
                  Repeat
                </Button>
              </Stack>
            </Card>
          ))}
          {q && patients.data?.length === 0 && (
            <Alert severity="info">No patient found for this MRN / name / phone.</Alert>
          )}
        </>
      )}

      {mode === 'day' && (
        <>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Token (optional)"
              placeholder="003 or leave empty for all"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              sx={{ flex: 1 }}
            />
          </Stack>
          <Typography color="text.secondary" sx={{ fontSize: 14 }}>
            Sirf date → us din ke sab patients. Date + token → us din ka woh token.
          </Typography>
          {day.data && (
            <Typography fontWeight={700}>
              {dayjs(day.data.date).format('D MMM YYYY')} · {day.data.count} patient
              {day.data.count === 1 ? '' : 's'}
            </Typography>
          )}
          {(day.data?.tokens ?? []).map((t) => (
            <Card key={t.id} sx={{ p: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <TokenBadge number={t.tokenNumber} size="sm" />
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={700}>{t.patient.name}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                    <MrnChip mrn={t.patient.patientNumber} />
                    <StatusChip status={t.status} />
                  </Stack>
                  {t.visit?.complaint && (
                    <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 14 }}>
                      {t.visit.complaint}
                    </Typography>
                  )}
                  {t.visit?.prescription?.items?.length ? (
                    <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                      Rx:{' '}
                      {t.visit.prescription.items.map((i) => i.medicineNameSnapshot).join(', ')}
                    </Typography>
                  ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button component={Link} to={`/app/patients/${t.patient.id}`} variant="outlined">
                    History
                  </Button>
                  <Button
                    component={Link}
                    to={`/app/repeat/${t.patient.id}`}
                    color="success"
                    variant="contained"
                  >
                    Repeat
                  </Button>
                </Stack>
              </Stack>
            </Card>
          ))}
          {day.isFetched && day.data?.count === 0 && (
            <Alert severity="info">
              {token.trim()
                ? `No token #${token} on ${dayjs(date).format('D MMM YYYY')}.`
                : `No patients on ${dayjs(date).format('D MMM YYYY')}.`}
            </Alert>
          )}
        </>
      )}
    </Stack>
  );
}
