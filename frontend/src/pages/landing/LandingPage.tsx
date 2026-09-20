import { Box, Button, Card, Container, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import LocalPharmacyOutlinedIcon from '@mui/icons-material/LocalPharmacyOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import { BrandMark } from '../../components/BrandMark';

const features = [
  {
    title: 'Token management',
    body: 'Give a token in a few seconds. The queue updates by itself.',
    icon: <ConfirmationNumberOutlinedIcon />,
  },
  {
    title: 'Digital prescription',
    body: 'The doctor writes medicines quickly. Reception sees them immediately.',
    icon: <DescriptionOutlinedIcon />,
  },
  {
    title: 'Repeat medicine',
    body: 'No token. No doctor visit. Search the patient and give the same medicines.',
    icon: <MedicationOutlinedIcon />,
  },
  {
    title: 'Medicine dispensing',
    body: 'Give medicines, deduct stock, and collect payment in one step.',
    icon: <LocalPharmacyOutlinedIcon />,
  },
  {
    title: 'Payments',
    body: 'Cash, card, JazzCash, Easypaisa. Daily collection on one screen.',
    icon: <PaymentsOutlinedIcon />,
  },
  {
    title: 'Daily reports',
    body: 'How many patients, how many repeats, how much collection.',
    icon: <BarChartOutlinedIcon />,
  },
];

export default function LandingPage() {
  return (
    <Box sx={{ bgcolor: '#F0F7F7', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <BrandMark size={36} />
            <Typography sx={{ fontWeight: 800, fontSize: 22, color: '#0F766E' }}>ClinicFlow</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button component={Link} to="/login" variant="text">
              Log in
            </Button>
            <Button component={Link} to="/login" variant="contained">
              Start Free
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ py: { xs: 6, md: 10 }, maxWidth: 760 }}>
          <Typography
            sx={{
              display: 'inline-block',
              bgcolor: '#E6F4F1',
              color: '#0F766E',
              fontWeight: 700,
              px: 1.5,
              py: 0.5,
              borderRadius: 5,
              mb: 2,
              fontSize: 13,
            }}
          >
            For Pakistani GP clinics
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: 40, md: 60 }, mb: 2, color: '#134E4A' }}>
            Your clinic. Without the paperwork.
          </Typography>
          <Typography sx={{ fontSize: 20, color: 'text.secondary', mb: 3 }}>
            Manage tokens, consultations, prescriptions, repeat medicines and payments from one
            simple screen.
          </Typography>
          <Typography sx={{ fontSize: 18, mb: 4, color: '#0F766E', fontWeight: 600 }}>
            Token se medicine tak — clinic ka pura daily kaam digital.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button component={Link} to="/login" variant="contained" size="large">
              Start Free
            </Button>
            <Button component={Link} to="/login" variant="outlined" size="large">
              Book Demo
            </Button>
          </Stack>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 8 }}>
          <WorkflowCard
            title="See doctor"
            steps={['Token', 'Doctor', 'Prescription', 'Medicine', 'Payment']}
            color="#1D4ED8"
            tint="#EFF6FF"
          />
          <WorkflowCard
            title="Repeat medicine"
            steps={['Search patient', 'Previous prescription', 'Dispense', 'Payment']}
            color="#047857"
            tint="#ECFDF5"
          />
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
            gap: 2,
            mb: 8,
          }}
        >
          {features.map((f) => (
            <Card key={f.title} sx={{ p: 3 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: '#E6F4F1',
                  color: '#0F766E',
                  display: 'grid',
                  placeItems: 'center',
                  mb: 1.5,
                }}
              >
                {f.icon}
              </Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {f.title}
              </Typography>
              <Typography color="text.secondary">{f.body}</Typography>
            </Card>
          ))}
        </Box>

        <Card sx={{ p: 4, mb: 6 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Simple pricing for Pakistani clinics
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Price name="Free" price="PKR 0" note="1 doctor, basic tokens" />
            <Price name="Starter" price="PKR 999/mo" note="Repeat medicine, payments, reports" />
            <Price name="Clinic" price="PKR 1,999/mo" note="Up to 3 doctors, inventory, staff" />
            <Price name="Pro" price="PKR 3,999/mo" note="Multiple doctors and branches" />
          </Stack>
        </Card>
      </Container>
    </Box>
  );
}

function WorkflowCard({
  title,
  steps,
  color,
  tint,
}: {
  title: string;
  steps: string[];
  color: string;
  tint: string;
}) {
  return (
    <Card sx={{ p: 3, flex: 1, bgcolor: tint, borderColor: tint }}>
      <Typography sx={{ fontWeight: 800, color, mb: 2, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 13 }}>
        {title}
      </Typography>
      <Stack spacing={1}>
        {steps.map((step, i) => (
          <Box key={step} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                bgcolor: color,
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontSize: 12,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {i + 1}
            </Box>
            <Typography sx={{ fontSize: 18, fontWeight: 600 }}>{step}</Typography>
          </Box>
        ))}
      </Stack>
    </Card>
  );
}

function Price({ name, price, note }: { name: string; price: string; note: string }) {
  return (
    <Box sx={{ flex: 1, p: 2, bgcolor: '#F0F7F7', borderRadius: 3, border: '1px solid #D4E6E4' }}>
      <Typography sx={{ fontWeight: 700, color: '#0F766E' }}>{name}</Typography>
      <Typography sx={{ fontSize: 22, my: 1 }}>{price}</Typography>
      <Typography color="text.secondary">{note}</Typography>
    </Box>
  );
}
