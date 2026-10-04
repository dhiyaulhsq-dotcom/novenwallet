import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useFinanceStore } from './store/useFinanceStore';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { LoginScreen } from './components/layout/LoginScreen';
import { PinLockScreen } from './components/layout/PinLockScreen';
import { QuickTransactionModal } from './components/common/QuickTransactionModal';
import { LogoutConfirmModal } from './components/common/LogoutConfirmModal';
import { ToastContainer } from './components/common/Toast';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { WalletsPage } from './pages/WalletsPage';
import { BudgetPage } from './pages/BudgetPage';
import { GoalsPage } from './pages/GoalsPage';
import { DebtsPage } from './pages/DebtsPage';
import { InvestmentsPage } from './pages/InvestmentsPage';
import { BillsPage } from './pages/BillsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

import { subscribeToAuth } from './lib/firebase';
import { startRealtimeSync } from './lib/firestoreSync';

export default function App() {
  const {
    settings,
    isLocked,
    setLock,
    isAuthenticated,
    checkSession,
    processDueRecurringTransactions,
    firebaseUser,
    setFirebaseUser,
    syncFromFirebase,
  } = useFinanceStore();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Listen for Firebase Auth state changes (multi-user across sessions)
  useEffect(() => {
    const unsubscribeAuth = subscribeToAuth((user) => {
      if (user) {
        setFirebaseUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      }
    });
    return () => unsubscribeAuth();
  }, [setFirebaseUser]);

  // Real-time synchronization between Mobile & Desktop
  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsubscribeSync = startRealtimeSync(firebaseUser.uid, (data) => {
      syncFromFirebase(data);
    });
    return () => {
      unsubscribeSync();
    };
  }, [firebaseUser?.uid, syncFromFirebase]);

  // Sync dark mode class with settings
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Check login session (2-day timeout) on mount, interval, and window focus
  useEffect(() => {
    checkSession();
    const interval = setInterval(() => {
      checkSession();
    }, 30000); // Check every 30 seconds

    window.addEventListener('focus', checkSession);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkSession);
    };
  }, [checkSession]);

  // Lock app on first load if PIN is configured (only if authenticated)
  useEffect(() => {
    if (isAuthenticated && settings.pinHash) {
      setLock(true);
    }
  }, [isAuthenticated, settings.pinHash, setLock]);

  // Process due recurring transactions on initial load
  useEffect(() => {
    if (isAuthenticated) {
      processDueRecurringTransactions();
    }
  }, [isAuthenticated, processDueRecurringTransactions]);

  // Keyboard shortcut listener: Ctrl+K or Cmd+K or N key to trigger Quick Add
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAuthenticated) return;
      // Ignore if user is currently typing in an input/textarea/select
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickAddOpen(true);
      } else if (!isInput && (e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsQuickAddOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated]);

  // If user is not authenticated or 2 days have elapsed without login:
  // Render Login Screen immediately
  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <ToastContainer />
      </>
    );
  }

  return (
    <HashRouter>
      {/* PIN Lock Screen if locked */}
      {settings.pinHash && isLocked && <PinLockScreen />}

      <div className="flex min-h-screen bg-[#F6F8FB] dark:bg-[#0B1120] text-slate-800 dark:text-slate-100 transition-colors">
        {/* Desktop Sidebar */}
        <Sidebar onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
          <Header />

          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/wallets" element={<WalletsPage />} />
              <Route path="/budget" element={<BudgetPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/debts" element={<DebtsPage />} />
              <Route path="/investments" element={<InvestmentsPage />} />
              <Route path="/bills" element={<BillsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNav onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

        {/* Floating Quick Transaction Modal */}
        <QuickTransactionModal
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
        />

        {/* In-App Logout Confirmation Modal */}
        <LogoutConfirmModal />

        {/* Toast Notification Container */}
        <ToastContainer />
      </div>
    </HashRouter>
  );
}
