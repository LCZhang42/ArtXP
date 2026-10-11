import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import PracticePlanner from './pages/PracticePlanner';
import ReferenceFinder from './pages/ReferenceFinder';
import PracticeLog from './pages/PracticeLog';
import Settings from './pages/Settings';

function AppRoutes() {
  const { user } = useApp();

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/planner" element={<PracticePlanner />} />
        <Route path="/references" element={<ReferenceFinder />} />
        <Route path="/log" element={<PracticeLog />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
