import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import LocalPharmacyOutlinedIcon from '@mui/icons-material/LocalPharmacyOutlined';
import VaccinesOutlinedIcon from '@mui/icons-material/VaccinesOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { homePath, useAuth } from '../auth/AuthProvider';
import { OfflineBanner } from '../components/OfflineBanner';
import { BrandMark } from '../components/BrandMark';
import { useClinicRealtime } from '../realtime/useClinicRealtime';
import type { UserRole } from '../types';

const NAV: Record<
  UserRole,
  { to: string; label: string; end?: boolean; icon: SvgIconComponent }[]
> = {
  RECEPTIONIST: [
    { to: '/app/reception', label: 'Dashboard', end: true, icon: SpaceDashboardOutlinedIcon },
    { to: '/app/patients', label: 'Patients', icon: PeopleOutlineIcon },
    { to: '/app/queue', label: 'Queue', icon: FormatListNumberedIcon },
    { to: '/app/repeat', label: 'Repeat Medicine', icon: MedicationOutlinedIcon },
    { to: '/app/dispensing', label: 'Give Medicine', icon: LocalPharmacyOutlinedIcon },
    { to: '/app/medicines', label: 'Medicines', icon: VaccinesOutlinedIcon },
    { to: '/app/payments', label: 'Payments', icon: PaymentsOutlinedIcon },
    { to: '/app/reports', label: 'Reports', icon: BarChartOutlinedIcon },
  ],
  DISPENSER: [
    { to: '/app/dispensing', label: 'Give Medicine', icon: LocalPharmacyOutlinedIcon },
    { to: '/app/repeat', label: 'Repeat Medicine', icon: MedicationOutlinedIcon },
    { to: '/app/medicines', label: 'Medicines', icon: VaccinesOutlinedIcon },
    { to: '/app/payments', label: 'Payments', icon: PaymentsOutlinedIcon },
  ],
  DOCTOR: [
    { to: '/app/doctor', label: 'Dashboard', end: true, icon: MedicalServicesOutlinedIcon },
    { to: '/app/doctor/patients', label: "Today's Patients", icon: PeopleOutlineIcon },
    { to: '/app/patients', label: 'Patient Search', icon: SearchOutlinedIcon },
    { to: '/app/medicines', label: 'Medicines', icon: VaccinesOutlinedIcon },
    { to: '/app/doctor/favorites', label: 'Favorites', icon: StarOutlineIcon },
    { to: '/app/doctor/repeats', label: 'Repeat Requests', icon: ReplayOutlinedIcon },
    { to: '/app/doctor/settings', label: 'Doctor Fee', icon: SettingsOutlinedIcon },
  ],
  OWNER: [
    { to: '/app/owner', label: 'Dashboard', end: true, icon: SpaceDashboardOutlinedIcon },
    { to: '/app/patients', label: 'Patients', icon: PeopleOutlineIcon },
    { to: '/app/owner/doctors', label: 'Doctors', icon: GroupsOutlinedIcon },
    { to: '/app/owner/staff', label: 'Staff', icon: BadgeOutlinedIcon },
    { to: '/app/medicines', label: 'Medicines', icon: VaccinesOutlinedIcon },
    { to: '/app/reports', label: 'Reports', icon: BarChartOutlinedIcon },
    { to: '/app/owner/settings', label: 'Settings', icon: SettingsOutlinedIcon },
  ],
};

const ROLE_LABEL: Record<UserRole, string> = {
  RECEPTIONIST: 'Reception',
  DISPENSER: 'Pharmacy',
  DOCTOR: 'Doctor',
  OWNER: 'Owner',
};

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <AppShell />;
}

function AppShell() {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  useClinicRealtime(Boolean(user));
  if (!user) return null;
  const items = NAV[user.role];
  const drawer = (
    <Box sx={{ width: 256, p: 2 }} role="navigation">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5, px: 0.5 }}>
        <BrandMark size={34} />
        <Box>
          <Typography sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1.1 }}>ClinicFlow</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Clinic desk</Typography>
        </Box>
      </Box>
      <List disablePadding>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 0.4,
                py: 1.05,
                color: 'text.secondary',
                '& .MuiListItemIcon-root': { color: 'text.secondary', minWidth: 40 },
                '&.active': {
                  bgcolor: '#E6F4F1',
                  color: '#0F766E',
                  '& .MuiListItemIcon-root': { color: '#0F766E' },
                  '& .MuiListItemText-primary': { fontWeight: 700 },
                },
              }}
            >
              <ListItemIcon>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        color="inherit"
        sx={{ borderBottom: '1px solid #D4E6E4', bgcolor: '#fff' }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          {compact && (
            <IconButton onClick={() => setOpen(true)} aria-label="Open menu">
              <MenuIcon />
            </IconButton>
          )}
          <Typography sx={{ fontWeight: 800, flex: 1, color: 'text.primary' }}>{user.clinicName}</Typography>
          <Chip label={ROLE_LABEL[user.role]} size="small" sx={{ bgcolor: '#E6F4F1', color: '#0F766E', fontWeight: 700 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#0F766E', fontSize: 14 }}>
              {user.name.slice(0, 1)}
            </Avatar>
            {!compact && (
              <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>{user.name}</Typography>
            )}
          </Box>
          <Button onClick={() => logout()} color="inherit" sx={{ minHeight: 40 }}>
            Log out
          </Button>
        </Toolbar>
        <OfflineBanner />
      </AppBar>
      <Box sx={{ display: 'flex' }}>
        {!compact && (
          <Box
            component="nav"
            sx={{
              width: 256,
              flexShrink: 0,
              borderRight: '1px solid #D4E6E4',
              minHeight: 'calc(100vh - 64px)',
              bgcolor: '#FBFEFE',
            }}
          >
            {drawer}
          </Box>
        )}
        <Drawer open={open} onClose={() => setOpen(false)}>
          {drawer}
        </Drawer>
        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 4 }, maxWidth: 1120 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export function RoleHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homePath(user.role)} replace />;
}
