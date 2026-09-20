import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import dayjs from 'dayjs';
import { Box, Typography } from '@mui/material';

export default function PrintPrescriptionPage() {
  const { id } = useParams();
  const rx = useQuery({
    queryKey: ['rx', id],
    queryFn: async () => (await api.get(`/prescriptions/${id}`)).data.data,
  });
  const data = rx.data;
  if (!data) return null;
  return (
    <Box sx={{ width: '148mm', minHeight: '210mm', p: 3, bgcolor: '#fff', m: '0 auto' }}>
      <Typography align="center" sx={{ fontWeight: 800, fontSize: 22 }}>
        {data.doctor?.name ? '' : ''}
        Demo Family Clinic
      </Typography>
      <Typography align="center" sx={{ mb: 2 }}>
        {data.doctor.name}
      </Typography>
      <Typography>Patient: {data.patient.name}</Typography>
      <Typography sx={{ mb: 2 }}>Date: {dayjs(data.createdAt).format('D MMM YYYY')}</Typography>
      {data.items.map(
        (item: {
          id: string;
          medicineNameSnapshot: string;
          dose: string;
          frequency: string;
          durationDays: number;
          instructions?: string;
        }) => (
          <Box key={item.id} sx={{ mb: 1 }}>
            <Typography fontWeight={700}>{item.medicineNameSnapshot}</Typography>
            <Typography>
              {item.dose} · {item.frequency} · {item.durationDays} day(s)
            </Typography>
            {item.instructions && <Typography>{item.instructions}</Typography>}
          </Box>
        ),
      )}
      <Typography sx={{ mt: 6, fontSize: 12 }} color="text.secondary">
        For clinic use. Optional print.
      </Typography>
    </Box>
  );
}
