import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import ScrollToTop from './components/ScrollToTop';
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
        <AuthRedirect />
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/home" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin123" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/analysis" element={
            <ProtectedRoute>
              <Analysis />
            </ProtectedRoute>
          } />
          <Route path="/wallet/:id" element={
            <ProtectedRoute>
              <WalletDetail />
            </ProtectedRoute>
          } />
          <Route path="/wallet/add" element={
            <ProtectedRoute>
              <WalletForm />
            </ProtectedRoute>
          } />
          <Route path="/wallet/edit/:id" element={
            <ProtectedRoute>
              <WalletForm />
            </ProtectedRoute>
          } />
          <Route path="/transaction/:type" element={
            <ProtectedRoute>
              <TransactionPage />
            </ProtectedRoute>
          } />
          <Route path="/transaction/:type/:id" element={
            <ProtectedRoute>
              <TransactionPage />
            </ProtectedRoute>
          } />
          <Route path="/budgets" element={
            <ProtectedRoute>
              <BudgetManagement />
            </ProtectedRoute>
          } />
          <Route path="/budget-sources/add" element={
            <ProtectedRoute>
              <AddBudgetSource />
            </ProtectedRoute>
          } />
          <Route path="/budget/add" element={
            <ProtectedRoute>
              <AddBudget />
            </ProtectedRoute>
          } />
          <Route path="/savings" element={
            <ProtectedRoute>
              <SavingsManagement />
            </ProtectedRoute>
          } />
          <Route path="/savings/add" element={
            <ProtectedRoute>
              <AddSavingsTarget />
            </ProtectedRoute>
          } />
          <Route path="/savings/deposit/:id" element={
            <ProtectedRoute>
              <SavingsDeposit />
            </ProtectedRoute>
          } />
          <Route path="/savings/withdraw/:id" element={
            <ProtectedRoute>
              <SavingsWithdraw />
            </ProtectedRoute>
          } />
          <Route path="/savings/edit/:id" element={
            <ProtectedRoute>
              <SavingsEdit />
            </ProtectedRoute>
          } />
          <Route path="/loans" element={
            <ProtectedRoute>
              <LoansManagement />
            </ProtectedRoute>
          } />
          <Route path="/loans/add-debt" element={
            <ProtectedRoute>
              <AddDebtPage />
            </ProtectedRoute>
          } />
          <Route path="/loans/add-receivable" element={
            <ProtectedRoute>
              <AddReceivablePage />
            </ProtectedRoute>
          } />
          <Route path="/loans/edit/:id" element={
            <ProtectedRoute>
              <EditLoanPage />
            </ProtectedRoute>
          } />
          <Route path="/loans/:id/payment" element={
            <ProtectedRoute>
              <LoanPaymentPage />
            </ProtectedRoute>
          } />
          <Route path="/categories" element={
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
          } />
          <Route path="/categories/add" element={
            <ProtectedRoute>
              <CategoryForm />
            </ProtectedRoute>
          } />
          <Route path="/categories/edit/:id" element={
            <ProtectedRoute>
              <CategoryForm />
            </ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          } />
          <Route path="/assets" element={
            <ProtectedRoute>
              <AssetsPage />
            </ProtectedRoute>
          } />
          <Route path="/assets/:id" element={
            <ProtectedRoute>
              <AssetDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/assets/add" element={
            <ProtectedRoute>
              <AddAssetPage />
            </ProtectedRoute>
          } />
          <Route path="/assets/edit/:id" element={
            <ProtectedRoute>
              <EditAssetPage />
            </ProtectedRoute>
          } />
          <Route path="/assets/:id/update" element={
            <ProtectedRoute>
              <UpdateAssetValuePage />
            </ProtectedRoute>
          } />
          <Route path="/assets/sell/:id" element={
            <ProtectedRoute>
              <SellAssetPage />
            </ProtectedRoute>
          } />
          <Route path="/assets/transactions/:id" element={
            <ProtectedRoute>
              <AssetTransactionsPage />
            </ProtectedRoute>
          } />
          <Route path="/assets/transactions" element={
            <ProtectedRoute>
              <AssetTransactionsPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
