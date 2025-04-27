import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import ScrollToTop from './components/ScrollToTop';
import SessionManager from './components/SessionManager';
import Auth from './components/Auth';
import Index from './pages/Index';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Analysis from './pages/Analysis';
import WalletDetail from './pages/WalletDetail';
import NotFound from './pages/NotFound';
import TransactionPage from './pages/TransactionPage';
import BudgetManagement from './pages/BudgetManagement';
import AddBudgetSource from './pages/AddBudgetSource';
import AddBudget from './pages/AddBudget';
import SavingsManagement from './pages/SavingsManagement';
import AddSavingsTarget from './pages/AddSavingsTarget';
import SavingsDeposit from './pages/SavingsDeposit';
import SavingsWithdraw from './pages/SavingsWithdraw';
import SavingsEdit from './pages/SavingsEdit';
import LoansManagement from './pages/LoansManagement';
import LoanDetail from './pages/LoanDetail';
import { useAuth } from './contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Categories from "@/pages/Categories";
import Transactions from "@/pages/Transactions";
import WalletForm from "@/components/WalletForm";
import LoanPaymentPage from './pages/LoanPaymentPage';
import AddDebtPage from './pages/AddDebtPage';
import AddReceivablePage from './pages/AddReceivablePage';
import EditLoanPage from './pages/EditLoanPage';
import { CategoryForm } from './components/CategoryForm';
import AssetsPage from './pages/AssetsPage';
import AssetDetailPage from './pages/AssetDetailPage';
import AddAssetPage from './pages/AddAssetPage';
import EditAssetPage from './pages/EditAssetPage';
import UpdateAssetValuePage from './pages/UpdateAssetValuePage';
import SellAssetPage from './pages/SellAssetPage';
import AssetTransactionsPage from './pages/AssetTransactionsPage';
import SubscriptionChecker from './components/subscription/SubscriptionChecker';
import ProtectedProRoute from './components/premium/ProtectedProRoute';
import ProRouteGuard from './components/premium/ProRouteGuard';
import Upgrade from './pages/Upgrade';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';

// Create a wrapper component to handle auth redirects
const AuthRedirect = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading) {
      // Jangan redirect untuk rute admin
      if (location.pathname.includes('/admin')) {
        return;
      }
      
      // Skip redirect for transaction pages if user is authenticated
      if (user && location.pathname === '/') {
        navigate('/home', { replace: true });
      } else if (!user && location.pathname !== '/' && !location.pathname.includes('/auth')) {
        navigate('/', { replace: true });
      }
    }
  }, [user, isLoading, navigate, location.pathname]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If no user and not on auth page, render nothing (will redirect)
  if (!user && location.pathname !== '/') {
    return null;
  }

  return null;
};

// Create a protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <ScrollToTop />
        <SessionManager />
        <SubscriptionChecker />
        <Routes>
          <Route path="/" element={<>
            <AuthRedirect />
            <Auth />
          </>} />
          <Route path="/home" element={
            <ProtectedRoute>
              <AuthRedirect />
              <Index />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes - tidak menggunakan AuthRedirect */}
          <Route path="/admin123" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
          
          {/* Halaman Upgrade */}
          <Route path="/upgrade" element={
            <ProtectedRoute>
              <AuthRedirect />
              <Upgrade />
            </ProtectedRoute>
          } />
          
          {/* Rute lainnya dengan AuthRedirect */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <AuthRedirect />
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <AuthRedirect />
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/analysis" element={
            <ProtectedRoute>
              <AuthRedirect />
              <Analysis />
            </ProtectedRoute>
          } />
          <Route path="/wallet/:id" element={
            <ProtectedRoute>
              <AuthRedirect />
              <WalletDetail />
            </ProtectedRoute>
          } />
          <Route path="/wallet/add" element={
            <ProtectedRoute>
              <AuthRedirect />
              <WalletForm />
            </ProtectedRoute>
          } />
          <Route path="/wallet/edit/:id" element={
            <ProtectedRoute>
              <AuthRedirect />
              <WalletForm />
            </ProtectedRoute>
          } />
          <Route path="/transaction/:type" element={
            <ProtectedRoute>
              <AuthRedirect />
              <TransactionPage />
            </ProtectedRoute>
          } />
          <Route path="/transaction/:type/:id" element={
            <ProtectedRoute>
              <AuthRedirect />
              <TransactionPage />
            </ProtectedRoute>
          } />
          
          {/* FITUR PRO: Budgeting - Gunakan ProtectedProRoute */}
          <Route path="/budgets" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProRouteGuard featureName="Budget Management">
                <BudgetManagement />
              </ProRouteGuard>
            </ProtectedRoute>
          } />
          <Route path="/budget-sources/add" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProtectedProRoute feature="budget">
                <AddBudgetSource />
              </ProtectedProRoute>
            </ProtectedRoute>
          } />
          <Route path="/budget/add" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProtectedProRoute feature="budget">
                <AddBudget />
              </ProtectedProRoute>
            </ProtectedRoute>
          } />
          
          {/* FITUR PRO: Savings - Gunakan ProtectedProRoute */}
          <Route path="/savings" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProRouteGuard featureName="Tabungan">
                <SavingsManagement />
              </ProRouteGuard>
            </ProtectedRoute>
          } />
          <Route path="/savings/add" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProtectedProRoute feature="saving">
                <AddSavingsTarget />
              </ProtectedProRoute>
            </ProtectedRoute>
          } />
          <Route path="/savings/deposit/:id" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProtectedProRoute feature="saving">
                <SavingsDeposit />
              </ProtectedProRoute>
            </ProtectedRoute>
          } />
          <Route path="/savings/withdraw/:id" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProtectedProRoute feature="saving">
                <SavingsWithdraw />
              </ProtectedProRoute>
            </ProtectedRoute>
          } />
          <Route path="/savings/edit/:id" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProtectedProRoute feature="saving">
                <SavingsEdit />
              </ProtectedProRoute>
            </ProtectedRoute>
          } />
          
          {/* FITUR PRO: Loans - Gunakan ProtectedProRoute */}
          <Route path="/loans" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProRouteGuard featureName="Hutang & Piutang">
                <LoansManagement />
              </ProRouteGuard>
            </ProtectedRoute>
          } />
          <Route path="/loans/add-debt" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProtectedProRoute feature="loan">
                <AddDebtPage />
              </ProtectedProRoute>
            </ProtectedRoute>
          } />
          <Route path="/loans/add-receivable" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProtectedProRoute feature="loan">
                <AddReceivablePage />
              </ProtectedProRoute>
            </ProtectedRoute>
          } />
          <Route path="/loans/edit/:id" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProtectedProRoute feature="loan">
                <EditLoanPage />
              </ProtectedProRoute>
            </ProtectedRoute>
          } />
          <Route path="/loans/:id/payment" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProtectedProRoute feature="loan">
                <LoanPaymentPage />
              </ProtectedProRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/categories" element={
            <ProtectedRoute>
              <AuthRedirect />
              <Categories />
            </ProtectedRoute>
          } />
          <Route path="/categories/add" element={
            <ProtectedRoute>
              <AuthRedirect />
              <CategoryForm />
            </ProtectedRoute>
          } />
          <Route path="/categories/edit/:id" element={
            <ProtectedRoute>
              <AuthRedirect />
              <CategoryForm />
            </ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute>
              <AuthRedirect />
              <Transactions />
            </ProtectedRoute>
          } />
          
          {/* FITUR PRO: Assets - Gunakan ProtectedProRoute */}
          <Route path="/assets" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProtectedProRoute feature="assets">
                <AssetsPage />
              </ProtectedProRoute>
            </ProtectedRoute>
          } />
          <Route path="/assets/add" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProtectedProRoute feature="assets">
                <AddAssetPage />
              </ProtectedProRoute>
            </ProtectedRoute>
          } />
          <Route path="/assets/edit/:id" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProtectedProRoute feature="assets">
                <EditAssetPage />
              </ProtectedProRoute>
            </ProtectedRoute>
          } />
          <Route path="/assets/update-value/:id" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProtectedProRoute feature="assets">
                <UpdateAssetValuePage />
              </ProtectedProRoute>
            </ProtectedRoute>
          } />
          <Route path="/assets/sell/:id" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProtectedProRoute feature="assets">
                <SellAssetPage />
              </ProtectedProRoute>
            </ProtectedRoute>
          } />
          <Route path="/assets/transactions" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProtectedProRoute feature="assets">
                <AssetTransactionsPage />
              </ProtectedProRoute>
            </ProtectedRoute>
          } />
          <Route path="/assets/:id" element={
            <ProtectedRoute>
              <AuthRedirect />
              <ProtectedProRoute feature="assets">
                <AssetDetailPage />
              </ProtectedProRoute>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App;
