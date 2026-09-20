import { Alert, Box, Button, Card, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { MrnChip } from '../../components/MrnChip';

export default function RepeatMedicinePage() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const search = useQuery({
    queryKey: ['patients', q],
    queryFn: async () => (await api.get('/patients', { params: { q } })).data.data,
    enabled: q.trim().length >= 1,
  });

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Repeat medicine"
        subtitle="MRN se patient dhoondhein. Token ki zaroorat nahi — last prescription mil jayegi."
      />
      <TextField
        autoFocus
        label="Search MRN / name / phone"
        placeholder="P-000002 · Fatima · 0300…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {search.data?.map(
        (p: { id: string; name: string; phone?: string; patientNumber: string }) => (
          <Card key={p.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{p.name}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <MrnChip mrn={p.patientNumber} />
                {p.phone && <Typography color="text.secondary">{p.phone}</Typography>}
              </Stack>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => navigate(`/app/patients/${p.id}`)}>
                History
              </Button>
              <Button variant="contained" color="success" onClick={() => navigate(`/app/repeat/${p.id}`)}>
                Open last prescription
              </Button>
            </Stack>
          </Card>
        ),
      )}
      {q && search.data?.length === 0 && <Alert severity="info">Patient not found.</Alert>}
    </Stack>
  );
}
