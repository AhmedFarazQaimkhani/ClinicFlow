import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  Chip,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { calculateMedicineQuantity } from '../../types';
import { useAuth } from '../../auth/AuthProvider';
import { useOnline } from '../../components/OfflineBanner';
import { TokenBadge } from '../../components/TokenBadge';
import dayjs from 'dayjs';

interface RxItem {
  medicineId: string;
  label: string;
  dose: string;
  doseQuantity: number;
  frequency: string;
  frequencyPerDay: number;
  durationDays: number;
  quantity: number;
  instructions: string;
}

export default function ConsultationPage() {
  const { visitId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const online = useOnline();
  const [complaint, setComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<RxItem[]>([]);
  const [search, setSearch] = useState('');
  const [showNewMedicine, setShowNewMedicine] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStrength, setNewStrength] = useState('');
  const [error, setError] = useState('');

  const visit = useQuery({
    queryKey: ['visit', visitId],
    queryFn: async () => (await api.get(`/visits/${visitId}`)).data.data,
  });
  const history = useQuery({
    queryKey: ['history', visit.data?.patientId],
    enabled: Boolean(visit.data?.patientId),
    queryFn: async () =>
      (await api.get(`/patients/${visit.data.patientId}/history`)).data.data,
  });
  const medicines = useQuery({
    queryKey: ['medicines'],
    queryFn: async () => (await api.get('/medicines')).data.data,
  });
  const favorites = useQuery({
    queryKey: ['favorites', user?.doctorId],
    enabled: Boolean(user?.doctorId),
    queryFn: async () => (await api.get(`/medicines/favorites/${user?.doctorId}`)).data.data,
  });

  useEffect(() => {
    const status = visit.data?.status;
    const tokenStatus = visit.data?.token?.status;
    const canStart =
      ['WAITING', 'CALLED'].includes(status ?? '') ||
      ['WAITING', 'CALLED'].includes(tokenStatus ?? '');
    if (visit.data && canStart && status !== 'CONSULTING' && tokenStatus !== 'CONSULTING') {
      api.post(`/visits/${visitId}/start`).catch(() => undefined);
    }
  }, [visit.data, visitId]);

  const send = useMutation({
    mutationFn: async () =>
      api.post(`/prescriptions/visits/${visitId}/send`, {
        complaint,
        diagnosis,
        clinicalNotes: notes,
        items: items.map((i) => ({
          medicineId: i.medicineId,
          dose: i.dose,
          doseQuantity: i.doseQuantity,
          frequency: i.frequency,
          frequencyPerDay: i.frequencyPerDay,
          durationDays: i.durationDays,
          quantity: i.quantity,
          instructions: i.instructions,
        })),
      }),
    onSuccess: (res) => navigate(`/app/doctor/rx/${res.data.data.id}`),
    onError: (err: Error) => setError(err.message),
  });

  function addMedicine(med: { id: string; name: string; strength?: string }, preset?: Partial<RxItem>) {
    const doseQuantity = preset?.doseQuantity ?? 1;
    const frequencyPerDay = preset?.frequencyPerDay ?? 3;
    const durationDays = preset?.durationDays ?? 1;
    setItems((prev) => [
      ...prev,
      {
        medicineId: med.id,
        label: `${med.name} ${med.strength ?? ''}`.trim(),
        dose: preset?.dose ?? '1 tablet',
        doseQuantity,
        frequency: preset?.frequency ?? '3 times/day',
        frequencyPerDay,
        durationDays,
        quantity: calculateMedicineQuantity(doseQuantity, frequencyPerDay, durationDays),
        instructions: '',
      },
    ]);
  }

  const v = visit.data;
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center">
        {v?.token?.tokenNumber && <TokenBadge number={v.token.tokenNumber} />}
        <Box>
          <Typography variant="h4">{v?.patient?.name}</Typography>
          <Typography color="text.secondary">
            {v?.patient?.age ? `${v.patient.age} years` : ''}
            {v?.patient?.gender
              ? ` · ${v.patient.gender.charAt(0)}${v.patient.gender.slice(1).toLowerCase()}`
              : ''}
          </Typography>
        </Box>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}

      <Typography fontWeight={700}>Previous Visits</Typography>
      {(history.data?.events ?? [])
        .filter((e: { kind: string }) => e.kind === 'CONSULTATION')
        .slice(0, 4)
        .map((e: { visit: { id: string; createdAt: string; complaint?: string } }) => (
          <Typography key={e.visit.id} color="text.secondary">
            {dayjs(e.visit.createdAt).format('D MMM')} · {e.visit.complaint || 'Consultation'}
          </Typography>
        ))}

      <TextField label="Complaint" value={complaint} onChange={(e) => setComplaint(e.target.value)} />
      <TextField label="Diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
      <TextField
        label="Clinical Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        multiline
        minRows={2}
      />

      <Typography fontWeight={700}>⭐ Favorites</Typography>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {(favorites.data ?? []).map(
          (fav: {
            medicine: { id: string; name: string; strength?: string };
            defaultDose?: string;
            defaultDoseQuantity?: number;
            defaultFrequency?: string;
            defaultFrequencyPerDay?: number;
            defaultDurationDays?: number;
          }) => (
            <Chip
              key={fav.medicine.id}
              label={`${fav.medicine.name} ${fav.medicine.strength ?? ''}`}
              onClick={() =>
                addMedicine(fav.medicine, {
                  dose: fav.defaultDose,
                  doseQuantity: Number(fav.defaultDoseQuantity ?? 1),
                  frequency: fav.defaultFrequency,
                  frequencyPerDay: Number(fav.defaultFrequencyPerDay ?? 3),
                  durationDays: fav.defaultDurationDays ?? 3,
                })
              }
            />
          ),
        )}
      </Stack>

      <Autocomplete
        options={medicines.data ?? []}
        inputValue={search}
        onInputChange={(_e, value) => setSearch(value)}
        getOptionLabel={(m: { id: string; name: string; strength?: string }) => `${m.name} ${m.strength ?? ''}`}
        onChange={(_e, value) => {
          if (value) {
            addMedicine(value);
            setSearch('');
          }
        }}
        renderInput={(params) => <TextField {...params} label="+ Add medicine" />}
      />
      <Button variant="outlined" onClick={() => setShowNewMedicine(true)}>
        + New medicine
      </Button>
      {showNewMedicine && (
        <Card sx={{ p: 2 }}>
          <Typography fontWeight={700} sx={{ mb: 1 }}>
            New medicine
          </Typography>
          <Stack spacing={1}>
            <TextField
              label="Name *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <TextField
              label="Strength"
              placeholder="500mg"
              value={newStrength}
              onChange={(e) => setNewStrength(e.target.value)}
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                disabled={!newName.trim() || !online}
                onClick={async () => {
                  try {
                    const res = await api.post('/medicines', {
                      name: newName.trim(),
                      strength: newStrength.trim() || undefined,
                      form: 'Tablet',
                      sellingPrice: 0,
                      stockQuantity: 0,
                    });
                    addMedicine(res.data.data);
                    setNewName('');
                    setNewStrength('');
                    setShowNewMedicine(false);
                    medicines.refetch();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Could not add medicine.');
                  }
                }}
              >
                Add to prescription
              </Button>
              <Button onClick={() => setShowNewMedicine(false)}>Cancel</Button>
            </Stack>
          </Stack>
        </Card>
      )}

      {items.map((item, idx) => (
        <Card key={`${item.medicineId}-${idx}`} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            <Typography fontWeight={700}>{item.label}</Typography>
            <Button color="error" onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}>
              Remove
            </Button>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1, mt: 1 }}>
            <TextField
              label="Dose"
              value={item.dose}
              onChange={(e) => updateItem(idx, { dose: e.target.value })}
            />
            <TextField
              label="Frequency"
              value={item.frequency}
              onChange={(e) => updateItem(idx, { frequency: e.target.value })}
            />
            <TextField
              label="Duration (days)"
              type="number"
              value={item.durationDays}
              onChange={(e) => {
                const durationDays = Number(e.target.value);
                updateItem(idx, {
                  durationDays,
                  quantity: calculateMedicineQuantity(item.doseQuantity, item.frequencyPerDay, durationDays),
                });
              }}
            />
            <TextField
              label="Quantity"
              type="number"
              value={item.quantity}
              onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
            />
          </Box>
        </Card>
      ))}

      <Button
        variant="contained"
        disabled={!online || send.isPending}
        onClick={() => {
          if (!online) {
            setError('Connection lost. Please reconnect before saving.');
            return;
          }
          send.mutate();
        }}
      >
        Save & Send to Reception
      </Button>
    </Stack>
  );

  function updateItem(idx: number, patch: Partial<RxItem>) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  }
}
