import React, { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "./UpgradeModal";

interface SubscriptionGuardProps {
  feature: "savings" | "budget" | "loans" | "analysis" | "wallets" | "transactions";
  children: React.ReactNode;
  fallback?: React.ReactNode;
  count?: number; // Jumlah item saat ini (untuk fitur yang memiliki kuota)
}

/**
 * Komponen untuk membatasi akses ke fitur premium
 * @param feature - Jenis fitur yang akan dibatasi akses ("savings", "budget", "loans", "analysis", "wallets", "transactions")
 * @param children - Konten yang akan ditampilkan jika pengguna memiliki akses
 * @param fallback - Konten alternatif yang akan ditampilkan jika pengguna tidak memiliki akses
 * @param count - Jumlah item saat ini (digunakan untuk fitur dengan batasan jumlah seperti dompet)
 */
const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  feature,
  children,
  fallback,
  count = 0,
}) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { 
    isProUser, 
    canAccessAnalysis, 
    canCreateWallet, 
    canAccessBudget, 
    canAccessSavings, 
    canAccessLoans,
    recordAnalysisView 
  } = useSubscription();

  // Fungsi untuk memeriksa akses berdasarkan jenis fitur
  const checkAccess = () => {
    switch (feature) {
      case "analysis":
        return canAccessAnalysis();
      case "wallets":
        return canCreateWallet(count);
      case "budget":
        return canAccessBudget();
      case "savings":
        return canAccessSavings();
      case "loans":
        return canAccessLoans();
      case "transactions":
        return true; // Semua pengguna bisa melihat transaksi, mungkin dibatasi durasi
      default:
        return isProUser;
    }
  };

  // Jika pengguna memiliki akses, tampilkan konten
  if (checkAccess()) {
    // Khusus untuk fitur analisis, catat bahwa pengguna telah mengakses hari ini
    if (feature === "analysis") {
      recordAnalysisView();
    }
    return <>{children}</>;
  }

  // Jika ada fallback kustom, gunakan itu
  if (fallback) {
    return <>{fallback}</>;
  }

  // Tampilkan modal jika tidak ada fallback
  return (
    <>
      <div 
        className="bg-white border border-gray-200 rounded-lg p-5 text-center"
        onClick={() => setShowUpgradeModal(true)}
      >
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            {feature === "savings" && <div className="text-orange-500 text-xl font-bold">S</div>}
            {feature === "budget" && <div className="text-orange-500 text-xl font-bold">B</div>}
            {feature === "loans" && <div className="text-orange-500 text-xl font-bold">L</div>}
            {feature === "analysis" && <div className="text-orange-500 text-xl font-bold">A</div>}
            {feature === "wallets" && <div className="text-orange-500 text-xl font-bold">W</div>}
          </div>
          
          <h3 className="font-medium text-lg mb-2">
            {feature === "savings" && "Fitur Tabungan"}
            {feature === "budget" && "Fitur Penganggaran"}
            {feature === "loans" && "Fitur Hutang & Piutang"}
            {feature === "analysis" && "Anda telah mencapai batas harian"}
            {feature === "wallets" && "Batas Dompet Tercapai"}
          </h3>
          
          <p className="text-gray-500 mb-5 text-sm">
            {feature === "savings" && "Fitur ini hanya tersedia untuk pengguna Pro. Upgrade sekarang untuk mulai mengelola tabungan Anda."}
            {feature === "budget" && "Fitur ini hanya tersedia untuk pengguna Pro. Upgrade sekarang untuk mulai mengatur anggaran."}
            {feature === "loans" && "Fitur ini hanya tersedia untuk pengguna Pro. Upgrade sekarang untuk mulai mencatat hutang & piutang."}
            {feature === "analysis" && "Pengguna free hanya dapat melihat halaman analisis 1x sehari. Upgrade ke Pro untuk akses tanpa batas."}
            {feature === "wallets" && "Pengguna free dibatasi hanya 3 dompet. Upgrade ke Pro untuk membuat dompet tanpa batas."}
          </p>
          
          <button
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-medium"
            onClick={() => setShowUpgradeModal(true)}
          >
            Upgrade ke Pro
          </button>
        </div>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature={feature}
      />
    </>
  );
};

export default SubscriptionGuard; 