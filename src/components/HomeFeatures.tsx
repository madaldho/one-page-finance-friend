import React from "react";
import { Link } from "react-router-dom";
import { PiggyBank, FileText, PieChart, Building, BarChart3 } from "lucide-react";
import PremiumFeatureCard from "@/components/premium/PremiumFeatureCard";

const HomeFeatures = () => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Fitur Premium</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <PremiumFeatureCard
          feature="budget"
          title="Budget Management"
          description="Atur pengeluaran agar lebih terkontrol dengan batas budget untuk setiap kategori"
          icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
          cardColor="bg-blue-50"
          textColor="text-blue-600"
        />
        
        <PremiumFeatureCard
          feature="loan"
          title="Hutang & Piutang"
          description="Catat dan pantau hutang dan piutang dengan pengingat jatuh tempo otomatis"
          icon={<FileText className="h-5 w-5 text-green-600" />}
          cardColor="bg-green-50"
          textColor="text-green-600"
        />
        
        <PremiumFeatureCard
          feature="saving"
          title="Tabungan"
          description="Buat target tabungan dengan visualisasi progres dan jadwal menabung"
          icon={<PiggyBank className="h-5 w-5 text-amber-600" />}
          cardColor="bg-amber-50"
          textColor="text-amber-600"
        />
        
        <PremiumFeatureCard
          feature="assets"
          title="Manajemen Aset"
          description="Kelola dan pantau nilai semua aset Anda dalam satu tampilan yang komprehensif"
          icon={<Building className="h-5 w-5 text-purple-600" />}
          cardColor="bg-purple-50"
          textColor="text-purple-600"
        />
        
        <PremiumFeatureCard
          feature="analysis"
          title="Analisis Lanjutan"
          description="Dapatkan wawasan mendalam tentang keuangan Anda dengan grafik dan analisis detail"
          icon={<PieChart className="h-5 w-5 text-indigo-600" />}
          cardColor="bg-indigo-50"
          textColor="text-indigo-600"
        />
      </div>
      
      <div className="mt-6 text-center">
        <Link 
          to="/premium"
          className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
        >
          Lihat Semua Fitur Premium
        </Link>
      </div>
    </div>
  );
};

export default HomeFeatures; 