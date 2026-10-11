import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import PracticePlanner from './pages/PracticePlanner';
import ReferenceFinder from './pages/ReferenceFinder';
import PracticeLog from './pages/PracticeLog';
import Settings from './pages/Settings';

function ConnectionState({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-amber-900/50 rounded-2xl p-6">
        <h1 className="text-xl font-bold text-white">Backend connection needed</h1>
        <p className="text-slate-400 text-sm mt-2">
          Start the ArtXP API on port 8000, then retry. Your legacy browser data
          has not been changed.
        </p>
        <p className="text-amber-400/80 text-xs mt-3 break-words">
          {error?.message || 'The API is unavailable.'}
        </p>
        <button
          onClick={onRetry}
          className="mt-5 w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl font-semibold text-sm"
        >
          Retry connection
        </button>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, authLoading, authError, retryConnection } = useApp();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Connecting to ArtXP…
      </div>
    );
  }

  if (authError) {
    return <ConnectionState error={authError} onRetry={retryConnection} />;
  }

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