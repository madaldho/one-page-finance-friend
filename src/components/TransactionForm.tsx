
import React, { useState } from "react";
import { PlusCircle, MinusCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

interface TransactionFormProps {
  onAddTransaction: (transaction: any) => void;
  type: "income" | "expense";
  onClose?: () => void;
}

const TransactionForm = ({ onAddTransaction, type, onClose }: TransactionFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

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
        navigate(`/transaction/${type}`);
      }, 300);
    } else {
      navigate(`/transaction/${type}`);
    }
  };

  // If getting called from a button (not the floating action button)
  if (!onClose) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
            type === "income" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
          }`} onClick={handleOpen}>
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
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {type === "income" ? "Input Pemasukan Baru" : "Input Pengeluaran Baru"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-10 flex flex-col items-center justify-center">
            <img src="/placeholder.svg" alt="Transaction illustration" className="w-32 h-32 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {type === "income" ? "Tambahkan Pemasukan Baru" : "Tambahkan Pengeluaran Baru"}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {type === "income" 
                ? "Catat semua pemasukan Anda agar keuangan Anda terkelola dengan baik."
                : "Catat semua pengeluaran Anda untuk kontrol keuangan yang lebih baik."}
            </p>
            <Button 
              onClick={handleNavigateToTransactionPage}
              className={`w-full ${type === "income" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
            >
              Lanjutkan
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="w-full mt-2"
            >
              Batal
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // If being used by the floating action button
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {type === "income" ? "Input Pemasukan Baru" : "Input Pengeluaran Baru"}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-10 flex flex-col items-center justify-center">
          <img src="/placeholder.svg" alt="Transaction illustration" className="w-32 h-32 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {type === "income" ? "Tambahkan Pemasukan Baru" : "Tambahkan Pengeluaran Baru"}
          </h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            {type === "income" 
              ? "Catat semua pemasukan Anda agar keuangan Anda terkelola dengan baik."
              : "Catat semua pengeluaran Anda untuk kontrol keuangan yang lebih baik."}
          </p>
          <Button 
            onClick={handleNavigateToTransactionPage}
            className={`w-full ${type === "income" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
          >
            Lanjutkan
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="w-full mt-2"
          >
            Batal
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TransactionForm;
