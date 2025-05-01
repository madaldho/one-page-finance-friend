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

// Import style globals
import "./index.css";

// Tambahkan style global untuk mencegah zoom pada perangkat mobile
const preventZoomStyle = document.createElement('style');
preventZoomStyle.innerHTML = `
  /* Mencegah double-tap zoom dan scroll bounce pada iOS */
  html {
    touch-action: manipulation;
    height: 100%;
    overflow: hidden;
  }
  
  body {
    height: 100%;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  /* Atur ukuran font minimum untuk input di iOS agar tidak zoom */
  input, textarea, select {
    font-size: 16px !important; /* iOS tidak akan zoom jika font-size >= 16px */
  }
  
  /* Disable viewport zoom on focus */
  input:focus, textarea:focus, select:focus {
    font-size: 16px !important;
  }
  
  /* Force native app look */
  * {
    -webkit-tap-highlight-color: transparent;
  }
`;
document.head.appendChild(preventZoomStyle);

// Tambahkan listener global untuk mencegah zoom pada gestur pinch
document.addEventListener('gesturestart', function(e) {
  e.preventDefault();
}, { passive: false });

// Perbaikan untuk error TypeScript pada TouchEvent
document.addEventListener('touchmove', function(e: TouchEvent) {
  // @ts-expect-error - scale mungkin tidak didefinisikan pada tipe TouchEvent standar tetapi ada di beberapa browser
  if (e.scale && e.scale !== 1) {
    e.preventDefault();
  }
}, { passive: false });

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
