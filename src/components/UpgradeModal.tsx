import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowUpRight,
  Check,
  Lock,
  X,
  Award,
  CalendarClock,
  CreditCard,
  Wallet,
  PiggyBank,
  BarChart3,
  ArrowRightLeft,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: "savings" | "budget" | "loans" | "analysis" | "wallets" | "transactions";
  onContinueWithFree?: () => void;
}

const UpgradeModal = ({
  open,
  onOpenChange,
  feature,
  onContinueWithFree,
}: UpgradeModalProps) => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<"pro_6m" | "pro_12m">("pro_12m");

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case "savings":
        return <PiggyBank className="h-5 w-5 text-blue-500" />;
      case "budget":
        return <BarChart3 className="h-5 w-5 text-purple-500" />;
      case "loans":
        return <ArrowRightLeft className="h-5 w-5 text-amber-500" />;
      case "analysis":
        return <FileText className="h-5 w-5 text-green-500" />;
      case "wallets":
        return <Wallet className="h-5 w-5 text-indigo-500" />;
      case "transactions":
        return <CreditCard className="h-5 w-5 text-pink-500" />;
      default:
        return <Award className="h-5 w-5 text-blue-500" />;
    }
  };

  const getFeatureTitle = () => {
    switch (feature) {
      case "savings":
        return "Fitur Tabungan";
      case "budget":
        return "Fitur Penganggaran";
      case "loans":
        return "Fitur Hutang & Piutang";
      case "analysis":
        return "Fitur Analisis Lanjutan";
      case "wallets":
        return "Dompet Tak Terbatas";
      case "transactions":
        return "Riwayat Transaksi Lengkap";
      default:
        return "Fitur Premium";
    }
  };

  const getFeatureDescription = () => {
    switch (feature) {
      case "savings":
        return "Kelola dan pantau target tabungan Anda untuk mencapai tujuan finansial.";
      case "budget":
        return "Atur anggaran pengeluaran untuk mengontrol keuangan dengan lebih baik.";
      case "loans":
        return "Catat dan kelola hutang serta piutang Anda agar tidak terlewat.";
      case "analysis":
        return "Akses analisis keuangan tanpa batasan untuk mengevaluasi kondisi finansial.";
      case "wallets":
        return "Buat dan kelola lebih dari 3 dompet untuk mengorganisir keuangan lebih rapi.";
      case "transactions":
        return "Lihat dan analisis riwayat transaksi lengkap tanpa batasan waktu.";
      default:
        return "Nikmati semua fitur premium untuk mengelola keuangan dengan lebih efektif.";
    }
  };

  const handleUpgrade = (plan: "pro_6m" | "pro_12m") => {
    // Kirim via WhatsApp
    const planText = plan === "pro_6m" ? "6 Bulan" : "12 Bulan";
    const message = `Halo, saya ingin upgrade ke paket Pro ${planText} untuk menggunakan fitur premium di aplikasi Money Friend.`;
    const whatsappUrl = `https://wa.me/6281387013123?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    onOpenChange(false);
  };

  const handleContinueWithFree = () => {
    if (onContinueWithFree) {
      onContinueWithFree();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            {getFeatureIcon(feature || "")}
            <DialogTitle className="text-lg">{getFeatureTitle()}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {getFeatureDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="py-3">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-3 rounded-lg mb-5 border border-indigo-100">
            <h3 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" /> Fitur Ini Hanya Untuk Pengguna Pro
            </h3>
            <p className="text-sm text-indigo-700">
              Upgrade ke Pro untuk membuka semua fitur premium dan meningkatkan
              pengalaman pengelolaan keuangan Anda.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Plan 12 Bulan */}
            <div 
              className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                selectedPlan === "pro_12m" 
                  ? "border-2 border-orange-500 ring-2 ring-orange-200" 
                  : "border-gray-200 hover:border-orange-200"
              }`}
              onClick={() => setSelectedPlan("pro_12m")}
            >
              <div className="relative">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-1 px-3 absolute right-0 top-0 text-xs font-bold transform rotate-0 origin-top-right">
                  HEMAT 30%
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">Pro 12 Bulan</h3>
                      <p className="text-sm text-gray-500 mt-1">Paket lengkap setahun</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-sm text-gray-500 line-through">Rp214.800</div>
                      <div className="text-xl font-bold">Rp150.000</div>
                      <div className="text-xs text-orange-600 font-medium">Rp12.500/bulan</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan 6 Bulan */}
            <div 
              className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                selectedPlan === "pro_6m" 
                  ? "border-2 border-orange-500 ring-2 ring-orange-200" 
                  : "border-gray-200 hover:border-orange-200"
              }`}
              onClick={() => setSelectedPlan("pro_6m")}
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">Pro 6 Bulan</h3>
                    <p className="text-sm text-gray-500 mt-1">Paket 6 bulan</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-xl font-bold">Rp99.000</div>
                    <div className="text-xs text-gray-500">Rp16.500/bulan</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <h4 className="font-medium text-gray-700">Keuntungan Paket Pro:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Dompet tak terbatas (tidak dibatasi 3)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Akses fitur Tabungan & Target</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Akses fitur Penganggaran/Budgeting</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Akses fitur Hutang & Piutang</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Analisis keuangan tanpa batas</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Riwayat transaksi lengkap</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3 sm:gap-0">
          <Button 
            onClick={() => handleUpgrade(selectedPlan)} 
            className="bg-orange-500 hover:bg-orange-600 w-full text-white"
          >
            Upgrade Sekarang <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={handleContinueWithFree}
            className="text-gray-500 text-sm w-full"
          >
            Lanjutkan dengan Versi Gratis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal; 