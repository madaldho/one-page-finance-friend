import React from "react";
import Layout from "@/components/Layout";
import PremiumFeatureWrapper from "@/components/premium/PremiumFeatureWrapper";
import { PieChart, ArrowUpDown } from "lucide-react";

// Contoh implementasi halaman Budget dengan pembatasan premium
const Budgets = () => {
  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Budget Management</h1>
        
        <PremiumFeatureWrapper 
          feature="budget"
          fallback={
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Budget Management</h2>
              <p className="text-gray-600 mb-6">
                Rencanakan keuangan Anda dengan lebih baik menggunakan fitur Budget Management yang membantu 
                mengontrol pengeluaran dan mencapai target finansial Anda.
              </p>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Fitur Budgeting Pro</h3>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Premium</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <ArrowUpDown className="h-3.5 w-3.5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Buat budget berdasarkan kategori pengeluaran</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowUpDown className="h-3.5 w-3.5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Tetapkan target pengeluaran bulanan atau mingguan</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowUpDown className="h-3.5 w-3.5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Pantau progres dan dapatkan notifikasi saat mendekati batas</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowUpDown className="h-3.5 w-3.5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Analisis trend pengeluaran dan perencanaan anggaran</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          }
        >
          {/* Konten asli halaman Budget Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Konten Budget Management Pro</h2>
            <p className="text-gray-600 mb-4">
              Ini adalah konten premium Budget Management yang hanya tersedia untuk pengguna Pro.
              Di sini Anda dapat membuat, mengelola, dan menganalisis anggaran Anda.
            </p>
            
            {/* Di sini Anda dapat menambahkan konten asli dari halaman Budget Management */}
          </div>
        </PremiumFeatureWrapper>
      </div>
    </Layout>
  );
};

export default Budgets; 