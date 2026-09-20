import { Button, Card, Chip, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import dayjs from 'dayjs';
import { PageHeader } from '../../components/PageHeader';
import { MrnChip } from '../../components/MrnChip';
import { TokenBadge } from '../../components/TokenBadge';

export default function PatientHistoryPage() {
  const { id } = useParams();
  const history = useQuery({
    queryKey: ['history', id],
    queryFn: async () => (await api.get(`/patients/${id}/history`)).data.data,
  });
  const data = history.data;
  if (!data) return null;
  return (
    <Stack spacing={2}>
      <PageHeader title={data.patient.name} subtitle={data.patient.phone || 'No phone on file'} />
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <MrnChip mrn={data.patient.patientNumber} />
        <Button component={Link} to={`/app/repeat/${data.patient.id}`} color="success" variant="contained" size="small">
          Repeat medicine
        </Button>
        <Button component={Link} to={`/app/tokens/new/${data.patient.id}`} variant="outlined" size="small">
          Give token today
        </Button>
      </Stack>

      {!data.events.length && (
        <Typography color="text.secondary">No visits or repeats yet.</Typography>
      )}

      {data.events.map((event: HistoryEvent) =>
        event.kind === 'CONSULTATION' ? (
          <Card key={event.visit.id} sx={{ p: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
              {event.visit.token?.tokenNumber && (
                <TokenBadge number={event.visit.token.tokenNumber} size="sm" />
              )}
              <Typography fontWeight={700}>
                {dayjs(event.visit.token?.tokenDate || event.at).format('D MMM YYYY')} · Doctor
              </Typography>
              {event.visit.token?.tokenDate && (
                <Chip
                  size="small"
                  label={dayjs(event.visit.token.tokenDate).format('YYYY-MM-DD')}
                  sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700 }}
                />
              )}
            </Stack>
            <Typography>Complaint: {event.visit.complaint || '—'}</Typography>
            <Typography>
              Prescription:{' '}
              {(event.visit.prescription?.items ?? [])
                .map((i: { medicineNameSnapshot: string }) => i.medicineNameSnapshot)
                .join(', ') || '—'}
            </Typography>
          </Card>
        ) : (
          <Card key={event.dispensing.id} sx={{ p: 2 }}>
            <Typography fontWeight={700}>
              {dayjs(event.at).format('D MMM YYYY')} · Medicine repeat
            </Typography>
            <Typography>
              {event.dispensing.items
                .map((i: { quantity: number }) => `×${i.quantity}`)
                .join(', ')}
            </Typography>
            <Typography color="text.secondary">No separate medicine charge</Typography>
          </Card>
        ),
      )}
    </Stack>
  );
}

type HistoryEvent =
  | {
      kind: 'CONSULTATION';
      at: string;
      visit: {
        id: string;
        complaint?: string;
        token?: { tokenNumber: string; tokenDate: string };
        prescription?: { items: { medicineNameSnapshot: string }[] };
      };
    }
  | {
      kind: 'MEDICINE_REPEAT';
      at: string;
      dispensing: {
        id: string;
        items: { quantity: number }[];
        payments: { amount: string }[];
      };
    };
