import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Plus, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loan } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useLoans } from "@/hooks/useLoans";
import { useLoanPayment } from "@/hooks/useLoanPayment";
import { LoanCard } from "@/components/loans/LoanCard";
import { LoanSummary } from "@/components/loans/LoanSummary";

const LoansManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  const {
    loans,
    wallets,
    loading,
    featureEnabled,
    handleToggleFeature,
    handleDelete,
    fetchData
  } = useLoans();

  const { paymentProcessing, handlePayment } = useLoanPayment();

  // Sync wallet names with loan records
  useEffect(() => {
    if (loans.length && wallets.length) {
      syncWalletNames();
    }
  }, [loans, wallets]);

  // Function to ensure wallet names are properly synced with loan records
  const syncWalletNames = async () => {
    const loansToUpdate = [];
    
    // Find loans with missing or incorrect wallet_name
    for (const loan of loans) {
      if (loan.wallet_id) {
        const matchingWallet = wallets.find(w => w.id === loan.wallet_id);
        if (matchingWallet && (!loan.wallet_name || loan.wallet_name !== matchingWallet.name)) {
          console.log(`Updating wallet name for loan ${loan.id}: ${loan.wallet_name || 'none'} -> ${matchingWallet.name}`);
          loansToUpdate.push({
            id: loan.id,
            wallet_name: matchingWallet.name
          });
        }
      }
    }
    
    // If there are loans to update, update them in batch
    if (loansToUpdate.length > 0) {
      console.log(`Syncing wallet names for ${loansToUpdate.length} loans`);
      try {
        for (const loanUpdate of loansToUpdate) {
          // Use a more type-safe approach with explicit update
          const { error } = await supabase
            .from('loans')
            .update({ 
              wallet_name: loanUpdate.wallet_name,
              updated_at: new Date().toISOString()
            } as any) // Use type assertion to avoid TypeScript errors
            .eq('id', loanUpdate.id);
            
          if (error) {
            console.error(`Error updating wallet name for loan ${loanUpdate.id}:`, error);
          }
        }
        
        // Refresh data after all updates are complete
        await fetchData();
    } catch (error) {
        console.error("Error syncing wallet names:", error);
      }
    }
  };

  const handleDeleteClick = (loan: Loan) => {
    setSelectedLoan(loan);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedLoan) {
      await handleDelete(selectedLoan.id);
      setDeleteDialogOpen(false);
      setSelectedLoan(null);
    }
  };

  const handleToggleExpand = (loan: Loan) => {
    setExpandedLoanId(expandedLoanId === loan.id ? null : loan.id);
  };

  const filteredLoans = () => {
    switch (selectedTab) {
      case "unpaid":
        return loans.filter(loan => loan.status === "unpaid");
      case "overdue":
        return loans.filter(loan => {
          const dueDate = new Date(loan.due_date);
          const today = new Date();
          return loan.status !== "paid" && dueDate < today;
        });
      case "paid":
        return loans.filter(loan => loan.status === "paid");
      default:
        return loans;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-xl">
        <div className="flex items-center mb-6">
          <Link to="/home" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Hutang & Piutang</h1>
        </div>

        <section className="mb-6 bg-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Fitur Hutang & Piutang</h2>
              <p className="text-sm text-gray-500">{featureEnabled ? "Aktif" : "Nonaktif"}</p>
            </div>
            <Switch 
              checked={featureEnabled} 
              onCheckedChange={handleToggleFeature} 
              aria-label="Toggle fitur hutang dan piutang"
            />
          </div>
        </section>

        <section className="mb-6">
          <LoanSummary loans={loans} />
        </section>

        <section className="mb-6">
          <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="unpaid">Belum Lunas</TabsTrigger>
              <TabsTrigger value="overdue">Terlambat</TabsTrigger>
              <TabsTrigger value="paid">Lunas</TabsTrigger>
            </TabsList>
          </Tabs>
        </section>

        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Daftar Hutang Aktif</h2>
            <Button 
              variant="outline" 
              size="sm"
              asChild
            >
              <Link to="/loans/add-debt">
                <Plus className="h-4 w-4 mr-1" />
                Tambah Hutang Baru
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p>Memuat data hutang...</p>
            </div>
          ) : filteredLoans().filter(loan => loan.type === "payable").length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>Tidak ada hutang yang ditemukan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLoans()
                .filter(loan => loan.type === "payable")
                .map((loan) => (
                  <LoanCard
                      key={loan.id} 
                    loan={loan}
                    onDelete={handleDeleteClick}
                    isExpanded={expandedLoanId === loan.id}
                    onToggleExpand={handleToggleExpand}
                  />
                ))}
            </div>
          )}
        </section>

        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Daftar Piutang Aktif</h2>
            <Button 
              variant="outline" 
              size="sm"
              asChild
            >
              <Link to="/loans/add-receivable">
                <Plus className="h-4 w-4 mr-1" />
                Tambah Piutang Baru
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p>Memuat data piutang...</p>
            </div>
          ) : filteredLoans().filter(loan => loan.type === "receivable").length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>Tidak ada piutang yang ditemukan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLoans()
                .filter(loan => loan.type === "receivable")
                .map((loan) => (
                  <LoanCard
                      key={loan.id} 
                    loan={loan}
                    onDelete={handleDeleteClick}
                    isExpanded={expandedLoanId === loan.id}
                    onToggleExpand={handleToggleExpand}
                  />
                ))}
            </div>
          )}
        </section>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Hapus</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Apakah Anda yakin ingin menghapus {selectedLoan?.type === 'payable' ? 'hutang' : 'piutang'} ini?</p>
              <p className="text-sm text-gray-500 mt-2">
                {selectedLoan?.description} - {selectedLoan?.amount.toLocaleString()}
              </p>
                            </div>
            <div className="flex justify-end gap-2">
                              <Button 
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Batal
                              </Button>
                            <Button 
                              variant="destructive"
                onClick={handleConfirmDelete}
                            >
                              Hapus
                            </Button>
                          </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default LoansManagement;
