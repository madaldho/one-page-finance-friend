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

        <DeviceManager />
      </div>
    </Layout>
  );
};

export default DeviceManagerPage; 