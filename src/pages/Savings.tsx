import React from "react";
import Layout from "@/components/Layout";
import PremiumFeatureWrapper from "@/components/premium/PremiumFeatureWrapper";
import { PiggyBank, Target, CheckCircle } from "lucide-react";

// Contoh implementasi halaman Tabungan dengan pembatasan premium
const Savings = () => {
  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Tabungan</h1>
        
        <PremiumFeatureWrapper 
          feature="saving"
          fallback={
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PiggyBank className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Fitur Tabungan</h2>
              <p className="text-gray-600 mb-6">
                Atur dan capai tujuan keuangan Anda dengan fitur Tabungan yang membantu
                memvisualisasikan progres dan mencapai target finansial Anda.
              </p>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Fitur Tabungan Pro</h3>
                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">Premium</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <Target className="h-3.5 w-3.5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Buat target tabungan dengan visualisasi progres</span>
                    </li>
                    <li className="flex items-start">
                      <Target className="h-3.5 w-3.5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Atur jadwal menabung otomatis dengan pengingat</span>
                    </li>
                    <li className="flex items-start">
                      <Target className="h-3.5 w-3.5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Catat setoran dan penarikan dengan riwayat lengkap</span>
                    </li>
                    <li className="flex items-start">
                      <Target className="h-3.5 w-3.5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Dapatkan notifikasi saat target tabungan hampir tercapai</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          }
        >
          {/* Konten asli halaman Tabungan */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Kelola Tabungan Anda</h2>
            <p className="text-gray-600 mb-4">
              Ini adalah konten premium fitur Tabungan yang hanya tersedia untuk pengguna Pro.
              Di sini Anda dapat membuat, memantau, dan mengelola target tabungan Anda.
            </p>
            
            {/* Di sini Anda dapat menambahkan konten asli dari halaman Tabungan */}
          </div>
        </PremiumFeatureWrapper>
      </div>
    </Layout>
  );
};

export default Savings; 