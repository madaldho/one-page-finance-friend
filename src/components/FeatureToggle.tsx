import React, { useCallback, useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface FeatureToggleProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  checked: boolean;
  onToggle: () => void;
  managementLink?: string;
  disabled?: boolean;
  loading?: boolean;
  extraElement?: React.ReactNode;
}

const FeatureToggle = ({ 
  icon, 
  title, 
  description, 
  checked, 
  onToggle, 
  managementLink,
  disabled = false,
  loading = false,
  extraElement
}: FeatureToggleProps) => {
  const canNavigate = checked && managementLink;
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  
  // Deteksi apakah aplikasi berjalan dalam mode standalone (PWA)
  useEffect(() => {
    // Deteksi mode standalone untuk PWA
    const isInStandaloneMode = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      );
    };
    
    setIsStandalone(isInStandaloneMode());
    
    // Detect changes in display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    };
    
    // Add listener for modern browsers
    try {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch (e) {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);
  
  // Handler untuk touch start event
  const handleTouchStart = useCallback(() => {
    setTouchStartTime(Date.now());
  }, []);
  
  // Handler untuk touch end event
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    // Jika tidak ada touchStartTime, ada kesalahan
    if (touchStartTime === null) return;
    
    // Hitung durasi sentuhan
    const touchDuration = Date.now() - touchStartTime;
    
    // Reset touch start time
    setTouchStartTime(null);
    
    // Jika sentuhan terlalu lama (> 300ms), jangan trigger toggle (mungkin pengguna scroll)
    if (touchDuration > 300) return;
    
    // Biarkan event handler StatusBadge menanganinya jika target adalah toggle button
    const target = e.target as HTMLElement;
    if (target.closest('.status-badge')) return;
    
    // Jika manageLink aktif, biarkan navigasi berlangsung
    if (canNavigate) return;
    
    // Jika tidak, aktifkan toggle
    if (!disabled && !loading) {
      onToggle();
    }
  }, [canNavigate, disabled, loading, onToggle, touchStartTime]);
  
  // Callback untuk menangani toggle dengan handling khusus untuk touch events
  const handleToggle = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!disabled && !loading) {
      // Tambahkan delay untuk mobile agar lebih responsif
      setTimeout(() => {
        onToggle();
      }, isStandalone ? 5 : 10); // Lebih cepat di mode PWA
    }
  }, [disabled, loading, onToggle, isStandalone]);
  
  const StatusBadge = () => {
    // Ganti aria-pressed dengan props statis
    const ariaProps = {
      "aria-pressed": checked ? "true" : "false"
    };
    
    return (
      <div 
        onClick={handleToggle}
        onTouchEnd={handleToggle}
        role="button"
        tabIndex={0}
        {...ariaProps}
        className={`status-badge text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer transition-colors select-none touch-manipulation ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        } ${
          checked 
            ? "bg-green-100 text-green-600 hover:bg-green-200 active:bg-green-300" 
            : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300"
        }`}
      >
        {loading ? (
          <span className="flex items-center">
            <span className="w-3 h-3 border-2 border-t-transparent border-green-600 rounded-full animate-spin mr-1"></span>
            {checked ? "Aktif" : "Nonaktif"}
          </span>
        ) : (
          checked ? "Aktif" : "Nonaktif"
        )}
      </div>
    );
  };
  
  // Gunakan label yang terpisah dan bisa diklik
  const handleLabelClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (canNavigate) return; // Biarkan navigasi jika sedang aktif dan ada managementLink
    e.stopPropagation();
    if (!disabled && !loading) {
      onToggle();
    }
  }, [canNavigate, disabled, loading, onToggle]);
  
  const Content = () => (
    <>
      <div 
        className="flex items-center gap-3 flex-1 cursor-pointer" 
        onClick={handleLabelClick}
        onTouchEnd={handleLabelClick}
        role="button"
        tabIndex={0}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${checked ? 'bg-green-50' : 'bg-gray-100'}`}>
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Label className="cursor-pointer font-medium">{title}</Label>
            {extraElement && extraElement}
          </div>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <StatusBadge />
        {managementLink && checked && (
          <div className="text-gray-500">
            <ChevronRight className="w-5 h-5" />
          </div>
        )}
      </div>
    </>
  );

  return (
    <div 
      className={`border-b border-gray-100 ${canNavigate ? 'hover:bg-gray-50' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {canNavigate ? (
        <Link to={managementLink!} className="block">
          <div className="flex items-center justify-between p-4 cursor-pointer">
            <Content />
          </div>
        </Link>
      ) : (
        <div 
          className="flex items-center justify-between p-4 cursor-pointer"
          data-touchable="true"
        >
          <Content />
        </div>
      )}
    </div>
  );
};

export default FeatureToggle;
