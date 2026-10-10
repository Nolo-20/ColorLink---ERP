import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ModernLoginScreen } from './components/ModernLoginScreen';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { HomeLaunchpad } from './components/HomeLaunchpad';
import { PipelineTraceability } from './components/PipelineTraceability';
import { AdvisorProjectManager } from './components/AdvisorProjectManager';
import { QualityReviewModule } from './components/QualityReviewModule';
import { InventoryModule } from './components/InventoryModule';
import { CustomerOrdersView } from './components/CustomerOrdersView';
import { RoleDashboard } from './components/RoleDashboard';
import { OrdersStoreView } from './components/OrdersStoreView';
import { RolePermissionGuideModal } from './components/RolePermissionGuideModal';
import { EscalateAdvisorModal } from './components/EscalateAdvisorModal';
import { PickupRedeemScannerModal } from './components/PickupRedeemScannerModal';
import { EmployeeManagementPanel } from './components/EmployeeManagementPanel';
import { PaintCalculatorModal } from './components/PaintCalculatorModal';
import { UserProfileModal } from './components/UserProfileModal';
import { CheckCircle2, XCircle } from 'lucide-react';

/** Aviso global: verde para confirmaciones, rojo para errores. */
const GlobalToast: React.FC<{ message: string; kind: 'ok' | 'error' }> = ({ message, kind }) => {
  const isError = kind === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-[60] sm:max-w-sm bg-[#091526] border shadow-2xl text-white px-4 py-3 rounded-xl flex items-center gap-3 ${
        isError ? 'border-rose-500/70 shadow-rose-500/20' : 'border-emerald-500/60 shadow-emerald-500/20'
      }`}
    >
      {isError
        ? <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
        : <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
      <span className="text-xs font-semibold">{message}</span>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { currentUser, authLoading, activeTab, toastMessage, toastKind, theme } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // En pantallas pequeñas el menú lateral es un panel que se abre encima del contenido
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => { setMobileNavOpen(false); }, [activeTab]);
  const toggleNav = () => {
    if (window.matchMedia('(max-width: 767px)').matches) setMobileNavOpen(v => !v);
    else setSidebarCollapsed(v => !v);
  };

  // Mientras se verifica la sesión guardada en el servidor
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050C18] text-slate-300 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
          <span className="text-xs font-semibold">Conectando con ColorLink…</span>
        </div>
      </div>
    );
  }

  // If user is not logged in, render the login screen
  if (!currentUser) {
    return (
      <>
        <ModernLoginScreen />
        {/* Global Toast */}
        {toastMessage && <GlobalToast message={toastMessage} kind={toastKind} />}
      </>
    );
  }

  return (
    <div className={`min-h-screen flex font-['Plus_Jakarta_Sans',sans-serif] transition-colors ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#050C18] text-slate-100'
    }`}>
      {/* Left Sidebar with role-based items */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Top Navbar */}
        <Navbar 
          collapsed={sidebarCollapsed} 
 
          onToggleSidebar={toggleNav} 
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-8 py-5 sm:py-8">
          {activeTab === 'inicio' && <HomeLaunchpad />}
          {activeTab === 'pipeline' && <PipelineTraceability />}
          {activeTab === 'proyectos' && <AdvisorProjectManager />}
          {activeTab === 'pedidos' && <OrdersStoreView />}
          {activeTab === 'canje_sucursal' && <OrdersStoreView />}
          {activeTab === 'calidad' && <QualityReviewModule />}
          {activeTab === 'inventarios' && <InventoryModule />}
          {activeTab === 'despachos' && <CustomerOrdersView />}
          {activeTab === 'colaboradores' && <EmployeeManagementPanel />}
          {activeTab === 'reportes' && <RoleDashboard />}
          {activeTab === 'roles_permisos' && <RolePermissionGuideModal />}
        </main>

        {/* Footer */}
        <footer className={`w-full border-t py-6 px-6 text-center text-xs flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto ${
          theme === 'light' ? 'border-slate-200 text-slate-500' : 'border-slate-900/80 text-slate-500'
        }`}>
          <p>© {new Date().getFullYear()} COLORLINK S.A.S. • Medellín, Colombia</p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>ERP ColorLink</span>
          </div>
        </footer>
      </div>

      {/* Global Modals */}
      <PaintCalculatorModal />
      <EscalateAdvisorModal />
      <PickupRedeemScannerModal />
      <UserProfileModal />

      {/* Global Toast Notification */}
      {toastMessage && <GlobalToast message={toastMessage} kind={toastKind} />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
