import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Lock, Star, ArrowUpRight, X, Award, CheckCheck } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: "budget" | "loan" | "saving" | "analysis" | "assets";
  onUpgrade: () => void;
  onStayFree?: () => void;
}

const UpgradeModal = ({
  open,
  onOpenChange,
  feature,
  onUpgrade,
  onStayFree,
}: UpgradeModalProps) => {
  const getFeatureTitle = () => {
    switch (feature) {
      case "budget":
        return "Budget Management";
      case "loan":
        return "Hutang & Piutang";
      case "saving":
        return "Tabungan";
      case "analysis":
        return "Analisis Keuangan Lanjutan";
      case "assets":
        return "Manajemen Aset";
      default:
        return "Fitur Premium";
    }
  };

  const getFeatureDescription = () => {
    switch (feature) {
      case "budget":
        return "Rencanakan keuangan Anda dengan lebih baik menggunakan fitur Budget Management yang membantu mengontrol pengeluaran dan mencapai target finansial Anda.";
      case "loan":
        return "Kelola hutang dan piutang dengan mudah, termasuk pengingat jatuh tempo, histori pembayaran, dan perhitungan bunga otomatis.";
      case "saving":
        return "Buat target tabungan dengan progres visual, jadwal menabung otomatis, dan notifikasi ketika target hampir tercapai.";
      case "analysis":
        return "Dapatkan wawasan mendalam tentang pola keuangan Anda dengan grafik dan analisis lanjutan untuk pengambilan keputusan yang lebih baik.";
      case "assets":
        return "Pantau semua aset Anda seperti properti, investasi, dan lainnya dalam satu tampilan yang komprehensif dengan perhitungan nilai kekayaan bersih.";
      default:
        return "Akses fitur premium ini untuk mengoptimalkan pengelolaan keuangan Anda dengan lebih baik.";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 pt-6 pb-8 px-5 text-white">
          <div className="absolute top-3 right-3">
            <button
              onClick={() => onOpenChange(false)}
              className="text-white/70 hover:text-white transition-colors rounded-full"
              title="Tutup dialog"
              aria-label="Tutup dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <Badge className="bg-white/25 hover:bg-white/30 text-white border-0 mb-1">
                Premium Feature
              </Badge>
              <h2 className="text-xl font-bold">{getFeatureTitle()}</h2>
            </div>
          </div>

          <p className="text-white/80 text-sm leading-relaxed">
            {getFeatureDescription()}
          </p>
        </div>

        <div className="p-5 space-y-5">
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20">
                <div className="absolute transform rotate-45 bg-amber-500 text-white text-xs font-bold py-1 right-[-35px] top-[12px] w-[120px] text-center">
                  POPULER
                </div>
              </div>
              
              <h3 className="font-semibold flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-600" />
                <span>Pro 12 Bulan</span>
              </h3>
              <div className="mt-1 mb-3">
                <span className="text-2xl font-bold">Rp150.000</span>
                <span className="text-sm text-gray-500 ml-1">/ tahun</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs bg-amber-100 text-amber-700 px-1 py-0.5 rounded-sm">HEMAT 50%</span>
                  <p className="text-xs text-amber-600 font-medium">Hanya Rp12.500 per bulan</p>
                </div>
              </div>
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                onClick={onUpgrade}
              >
                <span>Pilih Paket Ini</span>
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold flex items-center gap-1.5">
                <Star className="h-4 w-4 text-blue-600" />
                <span>Pro 6 Bulan</span>
              </h3>
              <div className="mt-1 mb-3">
                <span className="text-2xl font-bold">Rp99.000</span>
                <span className="text-sm text-gray-500 ml-1">/ 6 bulan</span>
                <p className="text-xs text-gray-500 mt-0.5">Rp16.500 per bulan</p>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onUpgrade}
              >
                Pilih Paket Ini
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-base font-medium mb-3">Semua Fitur Pro:</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 shrink-0" />
                <span className="text-sm">Budget management untuk mengontrol keuangan</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 shrink-0" />
                <span className="text-sm">Kelola hutang & piutang dengan otomatis</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 shrink-0" />
                <span className="text-sm">Tabungan dengan target progress & reward</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 shrink-0" />
                <span className="text-sm">Analisis lanjutan dan grafik performa keuangan</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 shrink-0" />
                <span className="text-sm">Manajemen aset untuk melacak kekayaan</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="bg-gray-50 px-5 py-3 border-t">
          <Button 
            variant="ghost" 
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-200 text-xs"
            onClick={onStayFree}
          >
            Lanjutkan dengan versi gratis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal; 