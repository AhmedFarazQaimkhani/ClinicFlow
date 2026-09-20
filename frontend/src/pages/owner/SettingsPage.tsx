import { Button, FormControlLabel, MenuItem, Stack, Switch, TextField } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import api from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

export default function SettingsPage() {
  const settings = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data.data.settings,
  });
  const [form, setForm] = useState({
    clinicName: '',
    consultationFee: 1500,
    paymentTiming: 'AT_DISPENSING',
    repeatRequiresDoctorApproval: false,
    repeatValidityDays: 30,
    negativeStockAllowed: false,
  });

  useEffect(() => {
    if (settings.data) {
      setForm({
        clinicName: settings.data.clinicName,
        consultationFee: Number(settings.data.consultationFee),
        paymentTiming: settings.data.paymentTiming,
        repeatRequiresDoctorApproval: settings.data.repeatRequiresDoctorApproval,
        repeatValidityDays: settings.data.repeatValidityDays,
        negativeStockAllowed: settings.data.negativeStockAllowed,
      });
    }
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async () => api.patch('/settings', form),
  });

  return (
    <Stack spacing={2} maxWidth={560}>
      <PageHeader title="Settings" subtitle="Clinic name, default doctor fee, and repeat rules." />
      <TextField
        label="Clinic name"
        value={form.clinicName}
        onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
      />
      <TextField
        label="Default doctor fee (PKR)"
        type="number"
        value={form.consultationFee}
        onChange={(e) => setForm({ ...form, consultationFee: Number(e.target.value) })}
        helperText="Applies to all doctors. Doctors can also change their own fee from Doctor Fee."
      />
      <TextField
        select
        label="When to collect consultation fee"
        value={form.paymentTiming}
        onChange={(e) => setForm({ ...form, paymentTiming: e.target.value })}
      >
        <MenuItem value="BEFORE_CONSULTATION">Before consultation</MenuItem>
        <MenuItem value="AFTER_CONSULTATION">After consultation</MenuItem>
        <MenuItem value="AT_DISPENSING">At medicine counter</MenuItem>
      </TextField>
      <FormControlLabel
        control={
          <Switch
            checked={form.repeatRequiresDoctorApproval}
            onChange={(e) => setForm({ ...form, repeatRequiresDoctorApproval: e.target.checked })}
          />
        }
        label="Repeat medicines need doctor approval"
      />
      <TextField
        label="Repeat valid for (days)"
        type="number"
        value={form.repeatValidityDays}
        onChange={(e) => setForm({ ...form, repeatValidityDays: Number(e.target.value) })}
      />
      <FormControlLabel
        control={
          <Switch
            checked={form.negativeStockAllowed}
            onChange={(e) => setForm({ ...form, negativeStockAllowed: e.target.checked })}
          />
        }
        label="Allow negative stock"
      />
      <Button variant="contained" onClick={() => save.mutate()}>
        Save settings
      </Button>
    </Stack>
  );
}
