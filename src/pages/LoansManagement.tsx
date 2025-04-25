import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Plus, FileText, ChevronDown, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loan } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useLoans } from "@/hooks/useLoans";
import { useLoanPayment } from "@/hooks/useLoanPayment";
import { LoanCard } from "@/components/loans/LoanCard";
import { LoanSummary } from "@/components/loans/LoanSummary";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const LoansManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"hutang" | "piutang">("hutang");
  const [filterStatus, setFilterStatus] = useState<"all" | "unpaid" | "overdue" | "paid">("all");
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
            } as { wallet_name: string; updated_at: string }) // Use explicit type instead of any
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

  const getFilterLabel = () => {
    switch (filterStatus) {
      case "unpaid": return "Belum Lunas";
      case "overdue": return "Terlambat";
      case "paid": return "Lunas";
      default: return "Semua Status";
    }
  };

  const filteredLoans = () => {
    // Filter by type (hutang/piutang)
    const typeFiltered = loans.filter(loan => 
      activeTab === "hutang" ? loan.type === "payable" : loan.type === "receivable"
    );
    
    // Then filter by status
    switch (filterStatus) {
      case "unpaid":
        return typeFiltered.filter(loan => loan.status === "unpaid");
      case "overdue":
        return typeFiltered.filter(loan => {
          const dueDate = new Date(loan.due_date);
          const today = new Date();
          return loan.status !== "paid" && dueDate < today;
        });
      case "paid":
        return typeFiltered.filter(loan => loan.status === "paid");
      default:
        return typeFiltered;
    }
  };

  const filteredLoansList = filteredLoans();
  const emptyList = filteredLoansList.length === 0;

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-lg">
        <div className="flex items-center mb-6">
          <Link to="/settings" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Hutang & Piutang</h1>
        </div>

        <section className="mb-6 bg-white rounded-lg p-4 shadow-sm">
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

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 rounded-lg overflow-hidden mb-4">
          <button
            className={cn(
              "py-3 text-center transition-colors font-medium text-sm",
              activeTab === "hutang" 
                ? "bg-red-200 text-red-800" 
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
            onClick={() => setActiveTab("hutang")}
          >
            HUTANG
          </button>
          <button
            className={cn(
              "py-3 text-center transition-colors font-medium text-sm",
              activeTab === "piutang" 
                ? "bg-green-200 text-green-800" 
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
            onClick={() => setActiveTab("piutang")}
          >
            PIUTANG
          </button>
        </div>

        {/* Filter and Add Button */}
        <div className="flex justify-between items-center mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <span>Status: {getFilterLabel()}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                Semua Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("unpaid")}>
                Belum Lunas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("overdue")}>
                Terlambat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("paid")}>
                Lunas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

            <Button 
              size="sm"
            className={cn(
              "text-white",
              activeTab === "hutang" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
            )}
              asChild
            >
            <Link to={activeTab === "hutang" ? "/loans/add-debt" : "/loans/add-receivable"}>
                <Plus className="h-4 w-4 mr-1" />
              {activeTab === "hutang" ? "Tambah Hutang" : "Tambah Piutang"}
              </Link>
            </Button>
          </div>

        {/* Content Container */}
        <div 
          className={cn(
            "rounded-lg overflow-hidden mb-6 border shadow-sm",
            activeTab === "hutang" ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
          )}
        >
          <div className="p-4">
            <h2 className="font-semibold mb-4">
              {activeTab === "hutang" 
                ? `Daftar Hutang ${getFilterLabel() !== "Semua Status" ? `(${getFilterLabel()})` : "Aktif"}` 
                : `Daftar Piutang ${getFilterLabel() !== "Semua Status" ? `(${getFilterLabel()})` : "Aktif"}`
              }
            </h2>

          {loading ? (
            <div className="text-center py-8">
                <p>Memuat data...</p>
            </div>
            ) : emptyList ? (
            <div className="text-center py-8 bg-white rounded-lg">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>Tidak ada {activeTab === "hutang" ? "hutang" : "piutang"} yang ditemukan.</p>
            </div>
          ) : (
              <div className="space-y-3">
                {filteredLoansList.map((loan) => (
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
          </div>
        </div>

       

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
