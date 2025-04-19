import React, { useState } from "react";
import { PlusCircle, MinusCircle, X, ArrowRight, DollarSign, CreditCard, Wallet, Calendar } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "./ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "@/lib/utils";

interface TransactionFormProps {
  onAddTransaction: (transaction: any) => void;
  type: "income" | "expense";
  onClose?: () => void;
}

const TransactionForm = ({ onAddTransaction, type, onClose }: TransactionFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<"income" | "expense">(type);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      setTimeout(onClose, 300); // Allow animation to complete
    }
  };

  const handleNavigateToTransactionPage = () => {
    setIsOpen(false);
    if (onClose) {
      setTimeout(() => {
        navigate(`/transaction/${selectedType}`);
      }, 300);
    } else {
      navigate(`/transaction/${selectedType}`);
    }
  };
  
  const handleTypeChange = (value: string) => {
    setSelectedType(value as "income" | "expense");
  };

  // Komponen QuickAction untuk menampilkan item dengan icon
  const QuickAction = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
    <div 
      className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-all"
      onClick={onClick}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center mb-2",
        selectedType === "income" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
      )}>
        {icon}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );

  // Fungsi untuk menentukan gradien berdasarkan tipe transaksi
  const getGradientStyle = () => {
    return selectedType === "income" 
      ? "from-green-600 to-green-400"
      : "from-red-600 to-red-400";
  };

  // If getting called from a button (not the floating action button)
  if (!onClose) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button 
            className={cn(
              "px-4 py-2 text-sm font-medium text-white rounded-full shadow-sm transition-all",
              type === "income" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
            )} 
            onClick={handleOpen}
            aria-label={type === "income" ? "Input Pemasukan" : "Input Pengeluaran"}
            title={type === "income" ? "Input Pemasukan" : "Input Pengeluaran"}
          >
            {type === "income" ? (
              <>
                <PlusCircle className="inline-block w-4 h-4 mr-1" />
                Input Pemasukan
              </>
            ) : (
              <>
                <MinusCircle className="inline-block w-4 h-4 mr-1" />
                Input Pengeluaran
              </>
            )}
          </button>
        </SheetTrigger>
        
        <SheetContent side="bottom" className="h-[80vh] rounded-t-xl p-0">
          {/* Header dengan Gradient */}
          <div className={cn(
            "w-full h-24 bg-gradient-to-br rounded-t-xl p-4 text-white",
            getGradientStyle()
          )}>
            <div className="flex justify-between items-start max-w-xl mx-auto w-full">
              <SheetTitle className="text-white font-bold text-xl">
                {selectedType === "income" ? "Pemasukan Baru" : "Pengeluaran Baru"}
            </SheetTitle>
              <SheetClose asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white h-8 w-8 rounded-full"
                  aria-label="Tutup"
                  title="Tutup"
                >
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
            
            {/* Tabs untuk toggle antara pemasukan dan pengeluaran */}
            <div className="max-w-xl mx-auto w-full">
              <Tabs 
                value={selectedType} 
                onValueChange={handleTypeChange}
                className="mt-2"
              >
                <TabsList className="bg-white/20 h-8 p-0.5 rounded-full w-48">
                  <TabsTrigger
                    value="income"
                    className={cn(
                      "rounded-full text-xs h-7",
                      selectedType === "income" ? "bg-white text-green-600" : "text-white"
                    )}
                  >
                    Pemasukan
                  </TabsTrigger>
                  <TabsTrigger
                    value="expense"
                    className={cn(
                      "rounded-full text-xs h-7",
                      selectedType === "expense" ? "bg-white text-red-600" : "text-white"
                    )}
                  >
                    Pengeluaran
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          <div className="max-w-xl mx-auto w-full px-4 py-6">
            <div key={selectedType} className="transition-all duration-300">
              <h3 className="text-sm font-medium text-gray-500 mb-4">
                Aksi Cepat
              </h3>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                <QuickAction 
                  icon={<DollarSign className="h-5 w-5" />}
                  label="Input Manual"
                  onClick={handleNavigateToTransactionPage}
                />
                <QuickAction 
                  icon={<Wallet className="h-5 w-5" />}
                  label="Transfer"
                  onClick={() => navigate("/transaction/transfer")}
                />
                <QuickAction 
                  icon={<Calendar className="h-5 w-5" />}
                  label="Terjadwal"
                  onClick={() => toast({ title: "Fitur dalam pengembangan" })}
                />
              </div>
              
              <h3 className="text-sm font-medium text-gray-500 mb-4">
                {selectedType === "income" ? "Tentang Pemasukan" : "Tentang Pengeluaran"}
            </h3>
              
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                {selectedType === "income" 
                  ? "Catat semua pemasukan Anda seperti gaji, bonus, dividen, atau pemasukan lainnya agar keuangan Anda terkelola dengan baik."
                  : "Catat semua pengeluaran harian Anda seperti makanan, transportasi, belanja, atau tagihan untuk kontrol keuangan yang lebih baik."
                }
              </p>
            </div>
            
            <Button 
              onClick={handleNavigateToTransactionPage}
              className={cn(
                "w-full rounded-xl flex justify-between items-center h-12",
                selectedType === "income" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
              )}
            >
              <span>Lanjutkan ke Form {selectedType === "income" ? "Pemasukan" : "Pengeluaran"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // If being used by the floating action button
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-xl p-0">
        {/* Header dengan Gradient */}
        <div className={cn(
          "w-full h-24 bg-gradient-to-br rounded-t-xl p-4 text-white",
          getGradientStyle()
        )}>
          <div className="flex justify-between items-start max-w-xl mx-auto w-full">
            <SheetTitle className="text-white font-bold text-xl">
              {selectedType === "income" ? "Pemasukan Baru" : "Pengeluaran Baru"}
          </SheetTitle>
            <SheetClose asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white h-8 w-8 rounded-full"
                aria-label="Tutup"
                title="Tutup"
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
          
          {/* Tabs untuk toggle antara pemasukan dan pengeluaran */}
          <div className="max-w-xl mx-auto w-full">
            <Tabs 
              value={selectedType} 
              onValueChange={handleTypeChange}
              className="mt-2"
            >
              <TabsList className="bg-white/20 h-8 p-0.5 rounded-full w-48">
                <TabsTrigger
                  value="income"
                  className={cn(
                    "rounded-full text-xs h-7",
                    selectedType === "income" ? "bg-white text-green-600" : "text-white"
                  )}
                >
                  Pemasukan
                </TabsTrigger>
                <TabsTrigger
                  value="expense"
                  className={cn(
                    "rounded-full text-xs h-7",
                    selectedType === "expense" ? "bg-white text-red-600" : "text-white"
                  )}
                >
                  Pengeluaran
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <div className="max-w-xl mx-auto w-full px-4 py-6">
          <div key={selectedType} className="transition-all duration-300">
            <h3 className="text-sm font-medium text-gray-500 mb-4">
              Aksi Cepat
            </h3>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              <QuickAction 
                icon={<DollarSign className="h-5 w-5" />}
                label="Input Manual"
                onClick={handleNavigateToTransactionPage}
              />
              <QuickAction 
                icon={<Wallet className="h-5 w-5" />}
                label="Transfer"
                onClick={() => navigate("/transaction/transfer")}
              />
              <QuickAction 
                icon={<Calendar className="h-5 w-5" />}
                label="Terjadwal"
                onClick={() => toast({ title: "Fitur dalam pengembangan" })}
              />
            </div>
            
            <h3 className="text-sm font-medium text-gray-500 mb-4">
              {selectedType === "income" ? "Tentang Pemasukan" : "Tentang Pengeluaran"}
          </h3>
            
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {selectedType === "income" 
                ? "Catat semua pemasukan Anda seperti gaji, bonus, dividen, atau pemasukan lainnya agar keuangan Anda terkelola dengan baik."
                : "Catat semua pengeluaran harian Anda seperti makanan, transportasi, belanja, atau tagihan untuk kontrol keuangan yang lebih baik."
              }
            </p>
          </div>
          
          <Button 
            onClick={handleNavigateToTransactionPage}
            className={cn(
              "w-full rounded-xl flex justify-between items-center h-12",
              selectedType === "income" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
            )}
          >
            <span>Lanjutkan ke Form {selectedType === "income" ? "Pemasukan" : "Pengeluaran"}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TransactionForm;
