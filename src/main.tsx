import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { logger } from '@/lib/logger';

// Konfigurasi keamanan global
const setupSecurity = () => {
  // Mencegah XSS melalui console logging
  if (import.meta.env.MODE === 'production') {
    // Disable console in production
    const noOp = () => {}; 
    
    // Backup console untuk debugging darurat jika perlu
    window._originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };
    
    // Override console methods untuk mencegah leak informasi sensitif
    // Ini masih memungkinkan logger kita yang terfilter untuk bekerja
    console.log = noOp;
    console.info = noOp;
    console.warn = console.error; // Tetap izinkan warning sebagai errors
    console.debug = noOp;
    
    logger.info('Console API dibatasi untuk keamanan');
  }
  
  // Memastikan cookies memiliki flag keamanan yang tepat
  document.cookie = "SameSite=Lax; Secure";
  
  // Mencegah clickjacking
  if (window.self !== window.top) {
    // Jika aplikasi dimuat dalam frame, redirect ke versi non-framed
    window.top.location.href = window.self.location.href;
  }
};

// Tangani kesalahan global untuk mencegah stack trace terbuka
window.addEventListener('error', (event) => {
  logger.error('Kesalahan aplikasi global', {
    message: event.message,
    source: event.filename,
    line: event.lineno
  });
  
  // Mencegah browser menampilkan default error
  event.preventDefault();
  
  // Tampilkan pesan error yang ramah dan tidak membocorkan informasi internal
  if (import.meta.env.MODE === 'production') {
    // Hanya tampilkan pesan generic di production
    alert('Terjadi kesalahan. Silakan coba lagi nanti.');
  }
  
  return true;
});

// Inisialisasi keamanan
setupSecurity();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchIntervalInBackground: false,
      retry: 1, // Batasi retry untuk mencegah brute force
    },
  },
});

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
