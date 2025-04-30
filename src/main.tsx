import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Konfigurasi QueryClient yang dioptimalkan untuk performa
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Meningkatkan performa dengan cache
      staleTime: 1000 * 60 * 5, // Data dianggap stale setelah 5 menit
      gcTime: 1000 * 60 * 30, // Cache disimpan selama 30 menit (pengganti cacheTime)
      refetchOnWindowFocus: false, // Tidak refetch otomatis saat focus window
      refetchOnMount: false, // Tidak refetch otomatis saat komponen mount
      retry: 1, // Hanya coba ulang 1 kali jika gagal
    },
    mutations: {
      // Optimasi untuk mengurangi lag saat submit form atau klik tombol
      retry: 1,
      networkMode: 'always'
    },
  },
});

// Daftarkan service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
