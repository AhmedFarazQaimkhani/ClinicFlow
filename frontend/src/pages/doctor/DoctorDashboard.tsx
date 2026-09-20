import { Button, Card, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';
import { TokenBadge } from '../../components/TokenBadge';

type TodayToken = {
  id: string;
  tokenNumber: string;
  status: string;
  patient: { name: string; age?: number };
  visit?: { id: string };
};

export default function DoctorDashboard() {
  const [tab, setTab] = useState<'waiting' | 'all'>('waiting');
  const [q, setQ] = useState('');
  const today = useQuery({
    queryKey: ['doctor-today'],
    queryFn: async () => (await api.get('/visits/doctor-today')).data.data,
    refetchInterval: 4000,
  });
  const d = today.data;
  const next = d?.next;
  const list = (d?.today ?? []) as TodayToken[];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return list.filter((token) => {
      const matchQ =
        !needle ||
        token.patient.name.toLowerCase().includes(needle) ||
        token.tokenNumber.toLowerCase().includes(needle);
      if (!matchQ) return false;
      if (tab === 'waiting') return ['WAITING', 'CALLED', 'CONSULTING'].includes(token.status);
      return true;
    });
  }, [list, tab, q]);

  return (
    <Stack spacing={3}>
      <PageHeader title="Doctor" subtitle={`${d?.waitingCount ?? 0} waiting`} />
      {next ? (
        <Card sx={{ p: 3, bgcolor: '#ECFEFF', borderColor: '#CFFAFE' }}>
          <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: 13, mb: 1.5 }}>
            Next patient
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <TokenBadge number={next.tokenNumber} size="lg" />
            <Stack spacing={0.5} sx={{ flex: 1 }}>
              <Typography variant="h4">{next.patient.name}</Typography>
              <Typography color="text.secondary">
                {next.patient.age ? `${next.patient.age} years` : 'Age not recorded'}
              </Typography>
            </Stack>
            <Button
              component={Link}
              to={`/app/doctor/consult/${next.visit.id}`}
              variant="contained"
              size="large"
            >
              Start consultation
            </Button>
          </Stack>
        </Card>
      ) : (
        <Card sx={{ p: 3 }}>
          <Typography color="text.secondary">No one is waiting.</Typography>
        </Card>
      )}

      <Typography variant="h6">Today's patients</Typography>
      <TextField
        label="Find patient or token"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        size="small"
      />
      <Tabs
        value={tab}
        onChange={(_e, value: 'waiting' | 'all') => setTab(value)}
        sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 700 } }}
      >
        <Tab
          value="waiting"
          label={`Active (${list.filter((t) => ['WAITING', 'CALLED', 'CONSULTING'].includes(t.status)).length})`}
        />
        <Tab value="all" label={`All today (${list.length})`} />
      </Tabs>
      <Card sx={{ overflow: 'hidden' }}>
        {filtered.map((token, index) => (
          <Stack
            key={token.id}
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{
              px: 1.5,
              py: 1.1,
              borderBottom: index < filtered.length - 1 ? '1px solid #D4E6E4' : 'none',
            }}
          >
            <TokenBadge number={token.tokenNumber} size="sm" />
            <Typography sx={{ flex: 1, fontWeight: 700 }}>{token.patient.name}</Typography>
            <StatusChip status={token.status} />
          </Stack>
        ))}
        {!filtered.length && (
          <Typography color="text.secondary" sx={{ p: 2 }}>
            No patients in this view.
          </Typography>
        )}
      </Card>
    </Stack>
  );
}
