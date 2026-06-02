import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const EquipamentosPage = lazy(() => import('../pages/EquipamentosPage'));
const SensoresPage = lazy(() => import('../pages/SensoresPage'));
const TopicosPage = lazy(() => import('../pages/TopicosPage'));
const MonitoramentoPage = lazy(() => import('../pages/MonitoramentoPage'));
const AlertasPage = lazy(() => import('../pages/AlertasPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#007C73', borderTopColor: 'transparent' }} />
        <span className="text-xs text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Carregando...</span>
      </div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
          <Route path="/equipamentos" element={<Suspense fallback={<PageLoader />}><EquipamentosPage /></Suspense>} />
          <Route path="/sensores" element={<Suspense fallback={<PageLoader />}><SensoresPage /></Suspense>} />
          <Route path="/topicos" element={<Suspense fallback={<PageLoader />}><TopicosPage /></Suspense>} />
          <Route path="/monitoramento" element={<Suspense fallback={<PageLoader />}><MonitoramentoPage /></Suspense>} />
          <Route path="/alertas" element={<Suspense fallback={<PageLoader />}><AlertasPage /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
