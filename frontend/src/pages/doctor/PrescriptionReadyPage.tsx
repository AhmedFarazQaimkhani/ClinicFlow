import { Button, Card, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

export default function PrescriptionReadyPage() {
  const { id } = useParams();
  const rx = useQuery({
    queryKey: ['rx', id],
    queryFn: async () => (await api.get(`/prescriptions/${id}`)).data.data,
  });
  const data = rx.data;
  if (!data) return null;
  return (
    <Stack spacing={2} maxWidth={560}>
      <PageHeader title={`Prescription #${data.prescriptionNumber}`} subtitle={`${data.patient.name} · Ready for dispensing`} />
      {data.items.map(
        (item: {
          id: string;
          medicineNameSnapshot: string;
          dose: string;
          frequency: string;
          quantity: number;
        }) => (
          <Card key={item.id} sx={{ p: 2 }}>
            <Typography fontWeight={700}>{item.medicineNameSnapshot}</Typography>
            <Typography>
              {item.dose} × {item.frequency}
            </Typography>
            <Typography color="text.secondary">{item.quantity} tablets</Typography>
          </Card>
        ),
      )}
      <Button component={Link} to={`/print/prescriptions/${data.id}`} target="_blank">
        Print (optional)
      </Button>
      <Button component={Link} to="/app/doctor" variant="contained">
        Next patient
      </Button>
    </Stack>
  );
}
