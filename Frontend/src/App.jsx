import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TankManagementPage from './pages/TankManagementPage';
import RegulationsMasterPage from './pages/RegulationsMasterPage';
import CargoMasterPage from './pages/CargoMasterPage';
import GeneratePPTPage from './pages/GeneratePPTPage';
import TankCodeMasterPage from './pages/TankCodeMasterPage';
import CertificatesMasterPage from './pages/CertificatesMasterPage';
import DrawingsMasterPage from './pages/DrawingsMasterPage';
import ValveShellMasterPage from './pages/ValveShellMasterPage';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import InspectionReportPage from './pages/InspectionReportPage';
import PrintInspectionPage from './pages/PrintInspectionPage';

import { logoutUser } from './services/authService';
import { API_BASE_URL } from './services/api';
function LogoutHandler({ onLogout }) {
  useEffect(() => {
    const performLogout = async () => {
      try {
        await logoutUser();
      } catch (error) {
        console.error("Logout error", error);
      }
      onLogout();
    };
    performLogout();
  }, [onLogout]);

  return <div className="flex h-full items-center justify-center">Logging out...</div>;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [webAccess, setWebAccess] = useState([]);
  const navigate = useNavigate();

  // ... (useEffect and handlers remain same)

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const storedWebAccess = sessionStorage.getItem('web_access');
    if (token) {
      setIsAuthenticated(true);
      if (storedWebAccess) {
        setWebAccess(JSON.parse(storedWebAccess));
      }
    }
    setLoadingAuth(false);

    const handleBeforeUnload = () => {
      // 1. Check if we are downloading a file. If yes, DO NOT log out!
      if (window.isDownloading) {
        return;
      }

      const storedToken = sessionStorage.getItem('token');
      if (storedToken) {
        const blob = new Blob(
          [JSON.stringify({ token: storedToken })],
          { type: 'application/json' }
        );
        navigator.sendBeacon(`${API_BASE_URL}/auth/logout`, blob);
      }
      sessionStorage.clear();
      localStorage.clear();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    setIsAuthenticated(false);
    setWebAccess([]);
    navigate('/');
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    const storedWebAccess = sessionStorage.getItem('web_access');
    if (storedWebAccess) {
      setWebAccess(JSON.parse(storedWebAccess));
    }
    navigate('/');
  };

  if (loadingAuth) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
      </Routes>
    );
  }

  // Main App Layout Component
  const MainLayout = () => (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        webAccess={webAccess}
      />
      <div className="flex-1 min-w-0 flex flex-col overflow-auto bg-gray-50">
        <Routes>
          <Route path="/" element={<TankManagementPage />} />
          <Route path="/ppt" element={<GeneratePPTPage />} />
          <Route path="/cargo" element={<CargoMasterPage />} />
          <Route path="/regulations" element={<RegulationsMasterPage />} />
          <Route path="/masters/tank-code" element={<TankCodeMasterPage />} />
          <Route path="/masters/regulations" element={<RegulationsMasterPage />} />
          <Route path="/masters/certificates" element={<CertificatesMasterPage mode="list" />} />
          <Route path="/masters/certificates/add" element={<CertificatesMasterPage mode="add" />} />
          <Route path="/masters/certificates/edit/:id" element={<CertificatesMasterPage mode="edit" />} />
          <Route path="/masters/drawings" element={<DrawingsMasterPage mode="list" />} />
          <Route path="/masters/drawings/add" element={<DrawingsMasterPage mode="add" />} />
          <Route path="/masters/drawings/edit/:id" element={<DrawingsMasterPage mode="edit" />} />
          <Route path="/masters/valve-shell" element={<ValveShellMasterPage mode="list" />} />
          <Route path="/masters/valve-shell/add" element={<ValveShellMasterPage mode="add" />} />
          <Route path="/masters/valve-shell/edit/:id" element={<ValveShellMasterPage mode="edit" />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/inspection/*" element={<InspectionReportPage />} />
          <Route path="/logout" element={<LogoutHandler onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/inspection/print/:id" element={<PrintInspectionPage />} />
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
}