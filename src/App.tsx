import React, { useState } from 'react';
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
import { CheckCircle2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser, activeTab, toastMessage, theme } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // If user is not logged in, render the login screen
  if (!currentUser) {
    return (
      <>
        <ModernLoginScreen />
        {/* Global Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#091526] border border-emerald-500/60 shadow-2xl shadow-emerald-500/10 text-white px-4 py-3 rounded-xl flex items-center gap-3 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        )}
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
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Navbar */}
        <Navbar 
          collapsed={sidebarCollapsed} 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
          {activeTab === 'inicio' && <HomeLaunchpad />}
          {activeTab === 'pipeline' && <PipelineTraceability />}
          {activeTab === 'proyectos' && <AdvisorProjectManager />}
          {activeTab === 'pedidos' && <OrdersStoreView />}
          {activeTab === 'tienda_cliente' && <OrdersStoreView />}
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
          <p>Copyright 2026 © Derechos Reservados • COLORLINK S.A.S. • Valle de Aburrá, Colombia</p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Sistema ERP Operacional v2.4</span>
          </div>
        </footer>
      </div>

      {/* Global Modals */}
      <PaintCalculatorModal />
      <EscalateAdvisorModal />
      <PickupRedeemScannerModal />
      <UserProfileModal />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#091526] border border-emerald-500/60 shadow-2xl shadow-emerald-500/20 text-white px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
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
