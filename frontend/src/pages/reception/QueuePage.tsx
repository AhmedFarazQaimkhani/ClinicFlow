import {
  Box,
  Button,
  Card,
  Chip,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';
import { TokenBadge } from '../../components/TokenBadge';

type QueueToken = {
  id: string;
  tokenNumber: string;
  status: string;
  patient: { name: string };
};

type FilterTab = 'active' | 'WAITING' | 'CALLED' | 'CONSULTING' | 'done' | 'all';

const ACTIVE = new Set(['WAITING', 'CALLED', 'CONSULTING']);
const DONE = new Set(['COMPLETED', 'CANCELLED', 'NO_SHOW', 'PRESCRIPTION_READY']);

export default function QueuePage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<FilterTab>('active');
  const [q, setQ] = useState('');
  const queue = useQuery({
    queryKey: ['queue'],
    queryFn: async () => (await api.get('/queue')).data.data as QueueToken[],
    refetchInterval: 4000,
  });

  const tokens = queue.data ?? [];
  const counts = useMemo(() => {
    const c = { active: 0, WAITING: 0, CALLED: 0, CONSULTING: 0, done: 0, all: tokens.length };
    for (const t of tokens) {
      if (ACTIVE.has(t.status)) c.active += 1;
      if (t.status === 'WAITING') c.WAITING += 1;
      if (t.status === 'CALLED') c.CALLED += 1;
      if (t.status === 'CONSULTING') c.CONSULTING += 1;
      if (DONE.has(t.status)) c.done += 1;
    }
    return c;
  }, [tokens]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tokens.filter((t) => {
      const matchQ =
        !needle ||
        t.patient.name.toLowerCase().includes(needle) ||
        t.tokenNumber.toLowerCase().includes(needle) ||
        `#${t.tokenNumber}`.includes(needle);
      if (!matchQ) return false;
      if (tab === 'all') return true;
      if (tab === 'active') return ACTIVE.has(t.status);
      if (tab === 'done') return DONE.has(t.status);
      return t.status === tab;
    });
  }, [tokens, tab, q]);

  const nextWaiting = tokens.find((t) => t.status === 'WAITING');

  async function setStatus(id: string, status: string) {
    await api.patch(`/tokens/${id}/status`, { status });
    qc.invalidateQueries({ queryKey: ['queue'] });
    qc.invalidateQueries({ queryKey: ['token-stats'] });
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Queue"
        subtitle={`${counts.active} active · ${counts.WAITING} waiting · search or filter instead of scrolling everything`}
      />

      {nextWaiting && (
        <Card sx={{ p: 2, bgcolor: '#FFF7ED', borderColor: '#FED7AA' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#C2410C' }}>Next to call</Typography>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.75 }}>
                <TokenBadge number={nextWaiting.tokenNumber} />
                <Typography variant="h6">{nextWaiting.patient.name}</Typography>
              </Stack>
            </Box>
            <Button variant="contained" size="large" onClick={() => setStatus(nextWaiting.id, 'CALLED')}>
              Call now
            </Button>
          </Stack>
        </Card>
      )}

      <TextField
        label="Find token or patient name"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="#003 or Fatima"
      />

      <Tabs
        value={tab}
        onChange={(_e, value: FilterTab) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 44,
          '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 700 },
        }}
      >
        <Tab value="active" label={`Active (${counts.active})`} />
        <Tab value="WAITING" label={`Waiting (${counts.WAITING})`} />
        <Tab value="CALLED" label={`Called (${counts.CALLED})`} />
        <Tab value="CONSULTING" label={`With doctor (${counts.CONSULTING})`} />
        <Tab value="done" label={`Done (${counts.done})`} />
        <Tab value="all" label={`All (${counts.all})`} />
      </Tabs>

      <Card sx={{ overflow: 'hidden' }}>
        {filtered.map((token, index) => (
          <Box
            key={token.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 1.5,
              py: 1.15,
              borderBottom: index < filtered.length - 1 ? '1px solid #D4E6E4' : 'none',
              bgcolor: token.status === 'WAITING' && token.id === nextWaiting?.id ? '#FFFBEB' : 'transparent',
              flexWrap: 'wrap',
            }}
          >
            <TokenBadge number={token.tokenNumber} size="sm" />
            <Typography sx={{ flex: 1, fontWeight: 700, minWidth: 120 }}>{token.patient.name}</Typography>
            <StatusChip status={token.status} />
            {token.status === 'WAITING' && (
              <Button size="small" variant="contained" onClick={() => setStatus(token.id, 'CALLED')}>
                Call
              </Button>
            )}
            {token.status === 'CONSULTING' && (
              <Button size="small" color="warning" onClick={() => setStatus(token.id, 'WAITING')}>
                Back to waiting
              </Button>
            )}
            {['WAITING', 'CALLED'].includes(token.status) && (
              <>
                <Button size="small" color="warning" onClick={() => setStatus(token.id, 'NO_SHOW')}>
                  No-show
                </Button>
                <Button size="small" color="error" onClick={() => setStatus(token.id, 'CANCELLED')}>
                  Cancel
                </Button>
              </>
            )}
          </Box>
        ))}
        {!filtered.length && (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            {tokens.length ? 'No patients match this filter.' : 'Queue is empty.'}
          </Typography>
        )}
      </Card>

      {q && (
        <Chip
          label={`Showing ${filtered.length} of ${tokens.length}`}
          onDelete={() => setQ('')}
          sx={{ alignSelf: 'flex-start', bgcolor: '#E6F4F1', color: '#0F766E', fontWeight: 700 }}
        />
      )}
    </Stack>
  );
}
