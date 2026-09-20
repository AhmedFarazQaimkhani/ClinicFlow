import {
  Alert,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useOnline } from '../../components/OfflineBanner';
import { PageHeader } from '../../components/PageHeader';

export default function CreatePatientPage() {
  const navigate = useNavigate();
  const online = useOnline();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!online) {
      setError('Connection lost. Please reconnect before saving.');
      return;
    }
    if (!name.trim()) {
      setError('Patient name is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/patients', {
        name,
        phone: phone || undefined,
        age: age ? Number(age) : undefined,
        gender: gender || undefined,
        address: address || undefined,
      });
      navigate(`/app/tokens/new/${res.data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create patient.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Stack spacing={2} maxWidth={520}>
        <PageHeader
          title="New patient"
          subtitle="Naya permanent MRN banega. Phir aaj ka token (001 se) milega."
        />
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Name *" value={name} onChange={(e) => setName(e.target.value)} required />
        <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <TextField label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
        <FormControl>
          <InputLabel>Gender</InputLabel>
          <Select label="Gender" value={gender} onChange={(e) => setGender(e.target.value)}>
            <MenuItem value="">Prefer not to say</MenuItem>
            <MenuItem value="MALE">Male</MenuItem>
            <MenuItem value="FEMALE">Female</MenuItem>
            <MenuItem value="OTHER">Other</MenuItem>
          </Select>
        </FormControl>
        <TextField label="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Button type="submit" variant="contained" disabled={busy || !online}>
          Create Patient & Token
        </Button>
      </Stack>
    </form>
  );
}
