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
  directNavigation?: boolean; // Tambahan prop untuk mode navigasi langsung
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
  extraElement,
  directNavigation = false // Default false untuk kompatibilitas
}: FeatureToggleProps) => {
  const canNavigate = managementLink && (directNavigation || checked);
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
  
  // Handler untuk click/touch dengan iOS optimization
  const handleContainerInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Prevent multiple calls by checking if already processing
    if (loading) return;
    
    // Biarkan StatusBadge menangani jika target adalah tombol toggle
    const target = e.target as HTMLElement;
    if (target.closest('.status-badge')) return;

    // Jika direct navigation mode dan ada managementLink, langsung navigate
    if (directNavigation && managementLink && !disabled && !loading) {
      // Tidak perlu toggle, langsung navigate
      e.preventDefault();
      e.stopPropagation();
      window.location.href = managementLink;
      return;
    }

    // Mode lama - toggle dulu baru bisa navigate
    if (!directNavigation) {
      // Jika ada link dan fitur aktif, biarkan navigasi Link component
      if (canNavigate) return;
      
      // Prevent default untuk menghindari double-tap zoom di iOS
      e.preventDefault();

      if (!disabled && !loading) {
        // Debounce untuk menghindari multiple calls
        setTimeout(() => {
          if (!loading) {
            onToggle();
          }
        }, 50);
      }
    }
  }, [directNavigation, managementLink, canNavigate, disabled, loading, onToggle]);
  
  // Callback untuk menangani toggle dengan handling khusus untuk iOS
  const handleToggle = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Prevent multiple calls by checking if already processing
    if (loading) return;
    
    if (!disabled && !loading) {
      // Debounced immediate feedback untuk iOS
      setTimeout(() => {
        if (!loading) {
          onToggle();
        }
      }, 50);
    }
  }, [disabled, loading, onToggle]);
  
  const StatusBadge = () => {
    return (
      <div 
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        aria-pressed={checked}
        className={`status-badge text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer transition-colors select-none touch-manipulation ${
        loading ? "opacity-50 cursor-not-allowed" : ""
      } ${
        checked 
            ? "bg-green-100 text-green-600 hover:bg-green-200" 
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
    
    // Prevent multiple calls by checking if already processing
    if (loading) return;
    
    if (!disabled && !loading) {
      // Debounced toggle
      setTimeout(() => {
        if (!loading) {
          onToggle();
        }
      }, 50);
    }
  }, [canNavigate, disabled, loading, onToggle]);
  
  const Content = () => (
    <>
      <div 
        className="flex items-center gap-3 flex-1 cursor-pointer" 
        onClick={directNavigation ? undefined : handleLabelClick}
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
        {managementLink && (directNavigation || checked) && (
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
      // Simplified handler untuk iOS compatibility - hanya gunakan onClick
      onClick={handleContainerInteraction}
    >
      {canNavigate && !directNavigation ? (
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
