import React from 'react';
import { Link } from 'react-router-dom';
import Layout from "@/components/Layout";
import DeviceManager from "@/components/DeviceManager";
import { ArrowLeft } from 'lucide-react';

const DeviceManagerPage = () => {
  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-2xl">
        <div className="flex items-center mb-6">
          <Link to="/settings" className="mr-2 text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Perangkat Terpercaya</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
          <p className="text-sm text-gray-600 mb-4">
            Perangkat terpercaya adalah perangkat yang dikenali dan diingat oleh sistem untuk memudahkan login secara otomatis.
            Perangkat akan diingat selama 30 hari.
          </p>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start">
              <span className="text-primary font-medium mr-2">•</span>
              <p>Sesi login akan otomatis diperpanjang pada perangkat terpercaya</p>
            </div>
            <div className="flex items-start">
              <span className="text-primary font-medium mr-2">•</span>
              <p>Hapus perangkat dari daftar untuk menghentikan fitur login otomatis</p>
            </div>
            <div className="flex items-start">
              <span className="text-primary font-medium mr-2">•</span>
              <p>Saat logout, semua perangkat terpercaya akan dihapus</p>
            </div>
          </div>
        </div>

        <DeviceManager />
      </div>
    </Layout>
  );
};

export default DeviceManagerPage; 