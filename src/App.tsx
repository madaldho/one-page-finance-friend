import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
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
import LoansManagement from './pages/LoansManagement';
import LoanDetail from './pages/LoanDetail';
import { useAuth } from './contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Categories from "@/pages/Categories";
import Transactions from "@/pages/Transactions";

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
        <AuthRedirect />
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/home" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
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
          <Route path="/loans" element={
            <ProtectedRoute>
              <LoansManagement />
            </ProtectedRoute>
          } />
          <Route path="/loans/:id" element={
            <ProtectedRoute>
              <LoanDetail />
            </ProtectedRoute>
          } />
          <Route path="/categories" element={
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute>
              <Transactions />
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
