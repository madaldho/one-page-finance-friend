import React, { useState } from "react";
import { Saving } from "@/types";
import { Progress } from "@/components/ui/progress";
import { format, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { 
  ChevronRight, 
  Calendar, 
  PiggyBank, 
  X, 
  ArrowUpDown, 
  Wallet, 
  Target,
  Clock,
  CalendarDays
} from "lucide-react";

interface SavingsCardProps {
  savings: Saving[];
}

const SavingsCard = ({ savings }: SavingsCardProps) => {
  const navigate = useNavigate();
  const [showDetail, setShowDetail] = useState(false);
  const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);
  
  const calculateProgress = (saving: Saving) => {
    return (saving.current_amount / saving.target_amount) * 100;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Tidak ada target";
    return format(new Date(date), "dd MMM yyyy", { locale: id });
  };
  
  const getRemainingDays = (date: string | null) => {
    if (!date) return "Tanpa batas waktu";
    
    const targetDate = new Date(date);
    const today = new Date();
    
    if (targetDate < today) return "Sudah lewat";
    
    const days = differenceInDays(targetDate, today);
    
    if (days === 0) return "Hari ini";
    if (days === 1) return "Besok";
    if (days < 7) return `${days} hari lagi`;
    if (days < 30) return `${Math.floor(days / 7)} minggu lagi`;
    if (days < 365) return `${Math.floor(days / 30)} bulan lagi`;
    return `${Math.floor(days / 365)} tahun lagi`;
  };

  const handleCardClick = (saving: Saving) => {
    setSelectedSaving(saving);
    setShowDetail(true);
  };
  
  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedSaving(null);
  };
  
  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-yellow-500";
    if (progress >= 50) return "bg-amber-500";
    if (progress >= 25) return "bg-blue-500";
    return "bg-blue-400";
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center mr-2">
            <PiggyBank className="h-3 w-3 text-amber-700" />
          </div>
          <h2 className="text-base font-medium text-amber-800">Target Tabungan</h2>
        </div>
        <Link to="/savings" className="flex items-center text-xs text-amber-600 hover:text-amber-700">
          Kelola <ChevronRight className="h-3 w-3 ml-1" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {savings.slice(0, 3).map((saving) => {
          const progress = calculateProgress(saving);
          return (
            <div 
              key={saving.id} 
              className="p-2.5 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-all cursor-pointer"
              onClick={() => handleCardClick(saving)}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-sm">{saving.name}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                  {saving.savings_category === "fisik" ? "Fisik" : "Digital"}
                </span>
              </div>
              
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-gray-600">Rp {saving.current_amount.toLocaleString()}</span>
                <span className="font-medium">Rp {saving.target_amount.toLocaleString()}</span>
              </div>
              
              <Progress 
                value={progress} 
                className="h-1.5 mb-1" 
                indicatorClassName={getProgressColor(progress)}
              />
              
              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <span>{Math.min(Math.round(progress), 100)}% tercapai</span>
                {saving.target_date && (
                  <span className="text-amber-600">{getRemainingDays(saving.target_date)}</span>
                )}
              </div>
            </div>
          );
        })}

        {savings.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">Belum ada tabungan</p>
            <p className="text-xs mt-1">
              <Link to="/savings" className="text-amber-600">
                Tambahkan tabungan
              </Link>{" "}
              untuk memantau progres
            </p>
          </div>
        )}
        
        {savings.length > 3 && (
          <Link 
            to="/savings"
            className="text-xs text-center block w-full text-amber-600 hover:text-amber-700 py-2 mt-1"
          >
            Lihat {savings.length - 3} tabungan lainnya
          </Link>
        )}
      </div>

      {/* Savings Detail Modal */}
      {showDetail && selectedSaving && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-300" onClick={handleCloseDetail}>
          <div 
            className="bg-white rounded-t-xl sm:rounded-xl p-5 w-full max-w-md max-h-[90vh] overflow-auto animate-in slide-in-from-bottom sm:slide-in-from-center duration-300" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Detail Tabungan</h3>
              <button 
                onClick={handleCloseDetail} 
                className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors"
                title="Tutup detail tabungan"
                aria-label="Tutup detail tabungan"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                    <PiggyBank className="h-3.5 w-3.5 text-amber-700" />
                  </div>
                  <h3 className="text-lg font-medium">{selectedSaving.name}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div>
                    <p className="text-gray-500">Jenis Tabungan:</p>
                    <p className="font-medium">{selectedSaving.savings_category === "fisik" ? "Fisik (Cash)" : "Digital (Rekening)"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Target Waktu:</p>
                    <p className="font-medium">{formatDate(selectedSaving.target_date)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-100 rounded-lg p-4">
                <div className="text-center mb-2">
                  <div className="text-3xl font-bold mb-1">
                    {Math.min(Math.round(calculateProgress(selectedSaving)), 100)}%
                  </div>
                  <div className="text-gray-500 text-sm">Progress Tabungan</div>
                </div>
                
                <Progress
                  value={calculateProgress(selectedSaving)}
                  className="h-4 w-full"
                  indicatorClassName={getProgressColor(calculateProgress(selectedSaving))}
                />
                
                {calculateProgress(selectedSaving) >= 100 && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 text-green-600 rounded-md text-sm mt-3">
                    <Target className="h-4 w-4" /> 
                    <span>Target tabungan tercapai!</span>
                  </div>
                )}
                
                {selectedSaving.target_date && calculateProgress(selectedSaving) < 100 && (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 text-amber-600 rounded-md text-sm mt-3">
                    <Clock className="h-4 w-4" /> 
                    <span>Sisa waktu: {getRemainingDays(selectedSaving.target_date)}</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <ArrowUpDown className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                  <p className="text-gray-500 text-xs mb-1">Terkumpul</p>
                  <p className="font-medium text-lg">Rp {selectedSaving.current_amount.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <Wallet className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                  <p className="text-gray-500 text-xs mb-1">Sisa</p>
                  <p className="font-medium text-lg">
                    Rp {Math.max(0, selectedSaving.target_amount - selectedSaving.current_amount).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-center space-y-2 pt-3">
                <div className="flex space-x-2 w-full">
                  <button 
                    className="flex-1 text-center border border-amber-500 text-amber-600 hover:bg-amber-50 rounded-md py-2 px-3 text-sm font-medium transition-colors"
                    onClick={() => {
                      handleCloseDetail();
                      navigate(`/savings/withdraw/${selectedSaving.id}`);
                    }}
                  >
                    Tarik Dana
                  </button>
                  <button 
                    className="flex-1 text-center bg-amber-500 text-white hover:bg-amber-600 rounded-md py-2 px-3 text-sm font-medium transition-colors"
                    onClick={() => {
                      handleCloseDetail();
                      navigate(`/savings/deposit/${selectedSaving.id}`);
                    }}
                  >
                    Setor Dana
                  </button>
                </div>
                <Link 
                  to="/savings" 
                  className="text-blue-600 hover:bg-blue-50 transition-colors rounded-md py-2 px-4 text-xs font-medium inline-block"
                >
                  Lihat Semua Tabungan
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsCard;
