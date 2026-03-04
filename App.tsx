import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import { ROLE } from './types';

// Lazy loading de páginas para otimizar bundle
const LoginPage = lazy(() => import('./pages/LoginPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const ManageRoomsPage = lazy(() => import('./pages/admin/ManageRoomsPage'));
const ManageUsersPage = lazy(() => import('./pages/admin/ManageUsersPage'));
const ManageHolidaysPage = lazy(() => import('./pages/admin/ManageHolidaysPage'));
const ManageBlackoutsPage = lazy(() => import('./pages/admin/ManageBlackoutsPage'));
const ManageBookingsPage = lazy(() => import('./pages/admin/ManageBookingsPage'));
const AuditLogPage = lazy(() => import('./pages/admin/AuditLogPage'));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ManageIssuesPage = lazy(() => import('./pages/admin/ManageIssuesPage'));
const FindSlotPage = lazy(() => import('./pages/FindSlotPage'));
const MaintenanceIssuesPage = lazy(() => import('./pages/maintenance/MaintenanceIssuesPage'));
const MaintenanceBlockPage = lazy(() => import('./pages/maintenance/MaintenanceBlockPage'));
const ManageRoomTypesPage = lazy(() => import('./pages/admin/ManageRoomTypesPage'));
const ManageLocationsPage = lazy(() => import('./pages/admin/ManageLocationsPage'));

// Componente de loading
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

function App(): React.ReactNode {
  return (
    <AuthProvider>
      <HashRouter>
        <Suspense fallback={<Loading />}>
          <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
            <Header />
            <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-grow">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/my-bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
                <Route path="/find-slot" element={<ProtectedRoute><FindSlotPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                
                {/* Maintenance Routes */}
                <Route 
                  path="/maintenance/issues" 
                  element={
                    <ProtectedRoute roles={[ROLE.MAINTENANCE, ROLE.ADMIN]}>
                      <MaintenanceIssuesPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/maintenance/blocks" 
                  element={
                    <ProtectedRoute roles={[ROLE.MAINTENANCE, ROLE.ADMIN]}>
                      <MaintenanceBlockPage />
                    </ProtectedRoute>
                  } 
                />

                {/* Admin Routes */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute roles={[ROLE.ADMIN]}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/rooms" 
                  element={
                    <ProtectedRoute roles={[ROLE.ADMIN]}>
                      <ManageRoomsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/room-types" 
                  element={
                    <ProtectedRoute roles={[ROLE.ADMIN]}>
                      <ManageRoomTypesPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/locations" 
                  element={
                    <ProtectedRoute roles={[ROLE.ADMIN]}>
                      <ManageLocationsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/users" 
                  element={
                    <ProtectedRoute roles={[ROLE.ADMIN]}>
                      <ManageUsersPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/bookings" 
                  element={
                    <ProtectedRoute roles={[ROLE.ADMIN]}>
                      <ManageBookingsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/holidays-blackouts" 
                  element={
                    <ProtectedRoute roles={[ROLE.ADMIN]}>
                      <div className="space-y-8">
                        <ManageHolidaysPage />
                        <ManageBlackoutsPage />
                      </div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/reports" 
                  element={
                    <ProtectedRoute roles={[ROLE.ADMIN]}>
                      <AdminReportsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/issues" 
                  element={
                    <ProtectedRoute roles={[ROLE.ADMIN]}>
                      <ManageIssuesPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/audit-logs" 
                  element={
                    <ProtectedRoute roles={[ROLE.ADMIN]}>
                      <AuditLogPage />
                    </ProtectedRoute>
                  } 
                />

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            <footer className="bg-white border-t py-6 mt-12">
              <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                <p>&copy; {new Date().getFullYear()} EasyAgenda. Sistema de Gestão de Espaços.</p>
                <div className="flex gap-6 mt-4 md:mt-0">
                  <span className="font-semibold hidden sm:inline">Documentação Técnica:</span>
                  <a href="#/doc/README.md" className="hover:text-indigo-600 transition-colors">Geral</a>
                  <a href="#/doc/REGRAS_NEGOCIO.md" className="hover:text-indigo-600 transition-colors">Negócio</a>
                  <a href="#/doc/ROLES_PERMISSOES.md" className="hover:text-indigo-600 transition-colors">Acessos</a>
                </div>
              </div>
            </footer>
          </div>
        </Suspense>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
