import { Alert, Button, Card, Stack, TextField, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

type Medicine = {
  id: string;
  name: string;
  strength?: string;
  form?: string;
  stockQuantity: number;
};

export default function MedicinesPage() {
  const qc = useQueryClient();
  const meds = useQuery({
    queryKey: ['medicines-all'],
    queryFn: async () => (await api.get('/medicines/all')).data.data as Medicine[],
  });
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [form, setForm] = useState('Tablet');
  const [stock, setStock] = useState('100');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!name.trim()) {
      setError('Medicine name is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.post('/medicines', {
        name: name.trim(),
        strength: strength.trim() || undefined,
        form: form.trim() || 'Tablet',
        sellingPrice: 0,
        stockQuantity: Number(stock) || 0,
      });
      setName('');
      setStrength('');
      setForm('Tablet');
      setStock('100');
      qc.invalidateQueries({ queryKey: ['medicines-all'] });
      qc.invalidateQueries({ queryKey: ['medicines'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add medicine.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(medicine: Medicine) {
    const label = `${medicine.name} ${medicine.strength ?? ''}`.trim();
    if (!window.confirm(`Remove ${label} from the medicine list? Old prescriptions will stay.`)) {
      return;
    }
    setError('');
    try {
      await api.delete(`/medicines/${medicine.id}`);
      qc.invalidateQueries({ queryKey: ['medicines-all'] });
      qc.invalidateQueries({ queryKey: ['medicines'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove medicine.');
    }
  }

  return (
    <Stack spacing={2} maxWidth={720}>
      <PageHeader
        title="Medicines"
        subtitle="Clinic stock list. Medicines are given with the doctor fee — no separate medicine price."
      />
      {error && <Alert severity="error">{error}</Alert>}

      <Card sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Add new medicine
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Name *"
            placeholder="Panadol"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Strength"
            placeholder="500mg"
            value={strength}
            onChange={(e) => setStrength(e.target.value)}
          />
          <TextField label="Form" value={form} onChange={(e) => setForm(e.target.value)} />
          <TextField
            label="Stock"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
          <Button variant="contained" onClick={add} disabled={busy || !name.trim()}>
            Add medicine
          </Button>
        </Stack>
      </Card>

      {(meds.data ?? []).map((m) => (
        <Card
          key={m.id}
          sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}
        >
          <div>
            <Typography fontWeight={700}>
              {m.name} {m.strength}
            </Typography>
            <Typography color="text.secondary">
              {m.form || 'Tablet'} · stock {m.stockQuantity}
            </Typography>
          </div>
          <Button color="error" onClick={() => remove(m)}>
            Delete
          </Button>
        </Card>
      ))}
    </Stack>
  );
}
