import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import WalletCard from "@/components/WalletCard";
import BudgetCard from "@/components/BudgetCard";
import SavingsCard from "@/components/SavingsCard";
import LoansCard from "@/components/LoansCard";
import TransactionList from "@/components/TransactionList";
import TransactionActions from "@/components/TransactionActions";
import WalletForm from "@/components/WalletForm";
import { Plus, ArrowRight } from "lucide-react";
import { Transaction, Wallet, Budget, Saving, Loan, UserSettings } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [showAddWallet, setShowAddWallet] = useState(false);
  
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  
  const [settings, setSettings] = useState<UserSettings>({
    id: "",
    user_id: "",
    show_budgeting: true,
    show_savings: true,
    show_loans: true,
  });
  
  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);
  
  const fetchData = async () => {
    try {
      if (!user) {
        toast({
          title: "Tidak Terautentikasi",
          description: "Silakan login untuk melihat data",
          variant: "destructive"
        });
        return;
      }

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData as Transaction[]);

      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (walletsError) throw walletsError;
      setWallets(walletsData as Wallet[]);

      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!settingsError && settingsData) {
        setSettings(settingsData as UserSettings);
      }

      const fetchPromises = [];

      if (settings.show_budgeting || !settingsData) {
        fetchPromises.push(
          supabase.from('budgets')
            .select('*')
            .eq('user_id', user.id)
            .then(({ data, error }) => {
              if (error) throw error;
              setBudgets(data as Budget[]);
            })
        );
      }

      if (settings.show_savings || !settingsData) {
        fetchPromises.push(
          supabase.from('savings')
            .select('*')
            .eq('user_id', user.id)
            .then(({ data, error }) => {
              if (error) throw error;
              setSavings(data as Saving[]);
            })
        );
      }

      if (settings.show_loans || !settingsData) {
        fetchPromises.push(
          supabase.from('loans')
            .select('*')
            .eq('user_id', user.id)
            .then(({ data, error }) => {
              if (error) throw error;
              setLoans(data as Loan[]);
            })
        );
      }

      await Promise.all(fetchPromises);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Gagal Memuat Data",
        description: "Terjadi kesalahan saat mengambil data",
        variant: "destructive"
      });
    }
  };
  
  useEffect(() => {
    let incomeSum = 0;
    let expenseSum = 0;
    let walletBalance = 0;
    
    transactions.forEach(transaction => {
      if (transaction.type === "income") {
        incomeSum += transaction.amount;
      } else if (transaction.type === "expense") {
        expenseSum += transaction.amount;
      }
    });
    
    wallets.forEach(wallet => {
      walletBalance += wallet.balance;
    });
    
    setTotalIncome(incomeSum);
    setTotalExpense(expenseSum);
    setBalance(walletBalance);
  }, [transactions, wallets]);
  
  const handleAddTransaction = (transaction: Transaction) => {
    fetchData();
  };
  
  const handleFilterTransactions = async (query: string) => {
    if (!user) return;
    
    if (!query) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching all transactions:', error);
        return;
      }

      setTransactions(data as Transaction[]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .ilike('title', `%${query}%`)
        .order('date', { ascending: false });

      if (error) throw error;
      
      setTransactions(data as Transaction[]);
      
      toast({
        title: "Mencari transaksi",
        description: `Hasil pencarian untuk "${query}"`,
      });
    } catch (error) {
      console.error('Error filtering transactions:', error);
      toast({
        title: "Gagal Mencari Transaksi",
        description: "Terjadi kesalahan saat mencari transaksi",
        variant: "destructive"
      });
    }
  };
  
  const handleWalletClick = (wallet: Wallet) => {
    toast({
      title: wallet.name,
      description: `Saldo: Rp ${wallet.balance.toLocaleString()}`,
    });
  };
  
  const handleViewAllLoans = () => {
    toast({
      title: "Hutang & Piutang",
      description: "Menampilkan semua data hutang dan piutang",
    });
  };
  
  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Manajemen Keuangan</h1>
            <p className="text-sm text-gray-500">30 hari aktif</p>
          </div>
        </div>
        
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Saldo Dompet dan Rekening</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {wallets.map(wallet => (
              <WalletCard 
                key={wallet.id} 
                wallet={wallet} 
                onClick={() => handleWalletClick(wallet)}
                onDelete={fetchData}
              />
            ))}
            <button 
              onClick={() => setShowAddWallet(true)}
              className="rounded-lg p-3 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500"
            >
              <Plus className="w-4 h-4 mb-1" />
              <span className="text-xs">Tambah Wallet</span>
            </button>
          </div>
        </section>
        
        {showAddWallet && (
          <WalletForm 
            onClose={() => setShowAddWallet(false)}
            onSuccess={() => {
              setShowAddWallet(false);
              fetchData();
            }}
          />
        )}
        
        {settings.show_budgeting && (
          <section className="mb-6">
            <BudgetCard budgets={budgets} />
          </section>
        )}
        
        {settings.show_savings && (
          <section className="mb-6">
            <SavingsCard savings={savings} />
          </section>
        )}
        
        {settings.show_loans && (
          <section className="mb-6">
            <LoansCard 
              loans={loans} 
              loading={false} 
              onViewAll={handleViewAllLoans} 
            />
          </section>
        )}
        
        <section className="mb-6">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-3 rounded-lg bg-green-100 border border-green-200">
              <p className="text-xs text-green-800">Total Pemasukan</p>
              <p className="font-semibold mt-1">Rp {totalIncome.toLocaleString()}</p>
            </div>
            
            <div className="p-3 rounded-lg bg-red-100 border border-red-200">
              <p className="text-xs text-red-800">Total Pengeluaran</p>
              <p className="font-semibold mt-1">Rp {totalExpense.toLocaleString()}</p>
            </div>
            
            <div className="p-3 rounded-lg bg-blue-100 border border-blue-200">
              <p className="text-xs text-blue-800">Saldo Total</p>
              <p className="font-semibold mt-1">Rp {balance.toLocaleString()}</p>
            </div>
          </div>
        </section>
        
        <section>
          <TransactionList 
            transactions={transactions} 
            onFilter={handleFilterTransactions}
          />
        </section>
        
        <TransactionActions onTransactionAdded={handleAddTransaction} />
      </div>
    </Layout>
  );
};

export default Index;
