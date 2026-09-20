import { Card, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthProvider';
import api from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

export default function FavoritesPage() {
  const { user } = useAuth();
  const favorites = useQuery({
    queryKey: ['favorites', user?.doctorId],
    enabled: Boolean(user?.doctorId),
    queryFn: async () => (await api.get(`/medicines/favorites/${user?.doctorId}`)).data.data,
  });
  return (
    <Stack spacing={2}>
      <PageHeader title="Favorites" subtitle="Quick medicines for this doctor." />
      {(favorites.data ?? []).map(
        (fav: { id: string; medicine: { name: string; strength?: string } }) => (
          <Card key={fav.id} sx={{ p: 2 }}>
            <Typography>
              ⭐ {fav.medicine.name} {fav.medicine.strength}
            </Typography>
          </Card>
        ),
      )}
    </Stack>
  );
}
