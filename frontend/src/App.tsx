import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import theme from './theme/theme';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth, RoleHome } from './layouts/AppLayout';
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/login/LoginPage';
import ReceptionDashboard from './pages/reception/ReceptionDashboard';
import SeeDoctorPage from './pages/reception/SeeDoctorPage';
import CreatePatientPage from './pages/reception/CreatePatientPage';
import CreateTokenPage from './pages/reception/CreateTokenPage';
import QueuePage from './pages/reception/QueuePage';
import RepeatMedicinePage from './pages/reception/RepeatSearchPage';
import RepeatConfirmPage from './pages/reception/RepeatConfirmPage';
import DispensingListPage from './pages/reception/DispensingListPage';
import DispenseDetailPage from './pages/reception/DispenseDetailPage';
import PaymentsPage from './pages/reception/PaymentsPage';
import ReportsPage from './pages/reception/ReportsPage';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import ConsultationPage from './pages/doctor/ConsultationPage';
import PrescriptionReadyPage from './pages/doctor/PrescriptionReadyPage';
import FavoritesPage from './pages/doctor/FavoritesPage';
import RepeatRequestsPage from './pages/doctor/RepeatRequestsPage';
import DoctorSettingsPage from './pages/doctor/DoctorSettingsPage';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import StaffPage from './pages/owner/StaffPage';
import DoctorsPage from './pages/owner/DoctorsPage';
import MedicinesPage from './pages/owner/MedicinesPage';
import SettingsPage from './pages/owner/SettingsPage';
import PatientsPage from './pages/patients/PatientsPage';
import PatientHistoryPage from './pages/patients/PatientHistoryPage';
import PrintPrescriptionPage from './pages/print/PrintPrescriptionPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/print/prescriptions/:id" element={<PrintPrescriptionPage />} />
              <Route path="/app" element={<RequireAuth />}>
                <Route index element={<RoleHome />} />
                <Route path="reception" element={<ReceptionDashboard />} />
                <Route path="see-doctor" element={<SeeDoctorPage />} />
                <Route path="patients" element={<PatientsPage />} />
                <Route path="patients/new" element={<CreatePatientPage />} />
                <Route path="patients/:id" element={<PatientHistoryPage />} />
                <Route path="tokens/new/:patientId" element={<CreateTokenPage />} />
                <Route path="queue" element={<QueuePage />} />
                <Route path="repeat" element={<RepeatMedicinePage />} />
                <Route path="repeat/:patientId" element={<RepeatConfirmPage />} />
                <Route path="dispensing" element={<DispensingListPage />} />
                <Route path="dispensing/:id" element={<DispenseDetailPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="doctor" element={<DoctorDashboard />} />
                <Route path="doctor/consult/:visitId" element={<ConsultationPage />} />
                <Route path="doctor/rx/:id" element={<PrescriptionReadyPage />} />
                <Route path="doctor/favorites" element={<FavoritesPage />} />
                <Route path="doctor/repeats" element={<RepeatRequestsPage />} />
                <Route path="doctor/settings" element={<DoctorSettingsPage />} />
                <Route path="doctor/patients" element={<DoctorDashboard />} />
                <Route path="owner" element={<OwnerDashboard />} />
                <Route path="owner/staff" element={<StaffPage />} />
                <Route path="owner/doctors" element={<DoctorsPage />} />
                <Route path="medicines" element={<MedicinesPage />} />
                <Route path="owner/medicines" element={<MedicinesPage />} />
                <Route path="owner/settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
