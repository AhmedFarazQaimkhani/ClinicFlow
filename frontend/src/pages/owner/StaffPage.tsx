import { Button, Card, Stack, TextField, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

export default function StaffPage() {
  const qc = useQueryClient();
  const staff = useQuery({
    queryKey: ['staff'],
    queryFn: async () => (await api.get('/users')).data.data,
  });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Demo1234!');

  async function add() {
    await api.post('/users', {
      name,
      email,
      password,
      role: 'RECEPTIONIST',
      canDispense: true,
    });
    setName('');
    setEmail('');
    qc.invalidateQueries({ queryKey: ['staff'] });
  }

  return (
    <Stack spacing={2} maxWidth={640}>
      <PageHeader title="Staff" subtitle="Reception and pharmacy users." />
      {(staff.data ?? []).map((u: { id: string; name: string; role: string; email?: string }) => (
        <Card key={u.id} sx={{ p: 2 }}>
          <Typography fontWeight={700}>{u.name}</Typography>
          <Typography color="text.secondary">
            {u.role}
            {u.email ? ` · ${u.email}` : ''}
          </Typography>
        </Card>
      ))}
      <Typography variant="h6">Add receptionist</Typography>
      <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button variant="contained" onClick={add} disabled={!name || !email}>
        Add staff
      </Button>
    </Stack>
  );
}
