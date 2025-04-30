import React from "react";
import Layout from "@/components/Layout";
import PremiumFeatureWrapper from "@/components/premium/PremiumFeatureWrapper";
import { FileText, ArrowDownUp, AlertCircle } from "lucide-react";

// Contoh implementasi halaman Hutang & Piutang dengan pembatasan premium
const Loans = () => {
  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Hutang & Piutang</h1>
        
        <PremiumFeatureWrapper 
          feature="loan"
          fallback={
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Hutang & Piutang</h2>
              <p className="text-gray-600 mb-6">
                Kelola hutang dan piutang dengan lebih baik. Catat semua transaksi pinjaman, 
                dapatkan pengingat jatuh tempo, dan pantau status pembayaran.
              </p>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Fitur Hutang & Piutang Pro</h3>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Premium</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <ArrowDownUp className="h-3.5 w-3.5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Catat hutang dan piutang dengan detail lengkap</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowDownUp className="h-3.5 w-3.5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Atur jatuh tempo dengan pengingat otomatis</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowDownUp className="h-3.5 w-3.5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Catat pembayaran parsial dan pelunasan</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowDownUp className="h-3.5 w-3.5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Hitung bunga dan biaya tambahan secara otomatis</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          }
        >
          {/* Konten asli halaman Hutang & Piutang */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Kelola Hutang & Piutang Anda</h2>
            <p className="text-gray-600 mb-4">
              Ini adalah konten premium fitur Hutang & Piutang yang hanya tersedia untuk pengguna Pro.
              Di sini Anda dapat membuat, memantau, dan mengelola hutang dan piutang Anda.
            </p>
            
            {/* Di sini Anda dapat menambahkan konten asli dari halaman Hutang & Piutang */}
          </div>
        </PremiumFeatureWrapper>
      </div>
    </Layout>
  );
};

export default Loans; 