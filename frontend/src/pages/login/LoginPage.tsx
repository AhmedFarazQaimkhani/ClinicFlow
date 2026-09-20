import { Alert, Box, Button, Card, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { homePath, useAuth } from '../../auth/AuthProvider';
import { BrandMark } from '../../components/BrandMark';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('reception@demo.clinic');
  const [password, setPassword] = useState('Demo1234!');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(identifier, password);
      navigate(homePath(user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        background: '#F0F7F7',
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          p: 8,
          background: 'linear-gradient(160deg, #115E59 0%, #0F766E 55%, #1D4ED8 130%)',
          color: '#ECFDF5',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <BrandMark size={44} />
          <Typography sx={{ fontWeight: 800, fontSize: 22 }}>ClinicFlow</Typography>
        </Box>
        <Typography variant="h3" sx={{ color: '#fff', mb: 2, maxWidth: 420 }}>
          Token to medicine, without the paper pile.
        </Typography>
        <Typography sx={{ opacity: 0.88, maxWidth: 400, fontSize: 18 }}>
          Built for Pakistani GP clinics. Reception, doctor, pharmacy, and payments on one calm
          screen.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', placeItems: 'center', p: 3 }}>
        <Card sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 420 }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, mb: 2 }}>
            <BrandMark size={32} />
            <Typography sx={{ fontWeight: 800, color: 'primary.main' }}>ClinicFlow</Typography>
          </Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Log in
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Use your clinic phone or email.
          </Typography>
          <form onSubmit={onSubmit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Phone / Email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <Button type="submit" variant="contained" disabled={busy}>
                {busy ? 'Please wait…' : 'Login'}
              </Button>
              <Typography variant="body2" color="text.secondary">
                Demo: reception@demo.clinic · doctor@demo.clinic · owner@demo.clinic
                <br />
                Password: Demo1234!
              </Typography>
            </Stack>
          </form>
        </Card>
      </Box>
    </Box>
  );
}
