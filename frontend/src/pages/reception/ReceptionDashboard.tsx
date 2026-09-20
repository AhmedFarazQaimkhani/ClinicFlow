import { Box, Button, Card, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import api from '../../api/client';
import { formatPkr } from '../../types';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { StatusChip } from '../../components/StatusChip';
import { TokenBadge } from '../../components/TokenBadge';

export default function ReceptionDashboard() {
  const stats = useQuery({
    queryKey: ['token-stats'],
    queryFn: async () => (await api.get('/tokens/stats')).data.data,
  });
  const queue = useQuery({
    queryKey: ['queue'],
    queryFn: async () => (await api.get('/queue')).data.data,
    refetchInterval: 5000,
  });

  const s = stats.data ?? { waiting: 0, consulting: 0, completed: 0, collection: 0 };

  return (
    <Stack spacing={3}>
      <PageHeader title="Today" subtitle={dayjs().format('D MMMM YYYY')} />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <ActionCard
          to="/app/see-doctor"
          title="See Doctor"
          subtitle="Give a token and send the patient to the doctor"
          color="#1D4ED8"
          bg="#EFF6FF"
          icon={<MedicalServicesOutlinedIcon />}
        />
        <ActionCard
          to="/app/repeat"
          title="Repeat Medicine"
          subtitle="No token. Search the patient and give the same medicines"
          color="#047857"
          bg="#ECFDF5"
          icon={<MedicationOutlinedIcon />}
        />
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        <StatCard label="Waiting" value={s.waiting} accent="#C2410C" />
        <StatCard label="With doctor" value={s.consulting} accent="#0F766E" />
        <StatCard label="Completed" value={s.completed} accent="#047857" />
        <StatCard label="Collection" value={formatPkr(s.collection)} accent="#1D4ED8" />
      </Box>

      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="h6">Active queue</Typography>
          <Button component={Link} to="/app/queue" size="small">
            Open full queue
          </Button>
        </Stack>
        <Stack spacing={1}>
          {(queue.data ?? [])
            .filter((token: { status: string }) =>
              ['WAITING', 'CALLED', 'CONSULTING'].includes(token.status),
            )
            .slice(0, 8)
            .map(
              (token: {
                id: string;
                tokenNumber: string;
                status: string;
                patient: { name: string };
              }) => (
                <Card
                  key={token.id}
                  sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}
                >
                  <TokenBadge number={token.tokenNumber} size="sm" />
                  <Typography sx={{ fontWeight: 700, flex: 1 }}>{token.patient.name}</Typography>
                  <StatusChip status={token.status} />
                </Card>
              ),
            )}
          {!(queue.data ?? []).some((t: { status: string }) =>
            ['WAITING', 'CALLED', 'CONSULTING'].includes(t.status),
          ) && (
            <Typography color="text.secondary">No one waiting. Press See Doctor.</Typography>
          )}
          {(queue.data ?? []).filter((t: { status: string }) =>
            ['WAITING', 'CALLED', 'CONSULTING'].includes(t.status),
          ).length > 8 && (
            <Typography color="text.secondary" sx={{ fontSize: 14 }}>
              + more waiting — open full queue to search and filter
            </Typography>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}

function ActionCard({
  to,
  title,
  subtitle,
  color,
  bg,
  icon,
}: {
  to: string;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  icon: ReactNode;
}) {
  return (
    <Card
      component={Link}
      to={to}
      sx={{
        flex: 1,
        p: 2.5,
        textDecoration: 'none',
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        minHeight: 112,
        borderColor: bg,
        bgcolor: bg,
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 10px 24px rgba(15, 118, 110, 0.12)' },
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: 2.5,
          bgcolor: color,
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" sx={{ color }}>{title}</Typography>
        <Typography sx={{ color: 'text.secondary', mt: 0.25 }}>{subtitle}</Typography>
      </Box>
    </Card>
  );
}
