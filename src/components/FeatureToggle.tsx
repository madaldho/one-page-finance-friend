import React from "react";
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
  
  const StatusBadge = () => (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && !loading) onToggle();
      }}
      className={`text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
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
  
  const Content = () => (
    <>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Label className="cursor-pointer">{title}</Label>
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
    <div className={`border-b border-gray-100 ${canNavigate ? 'hover:bg-gray-50' : ''}`}>
      {canNavigate ? (
        <Link to={managementLink!} className="block">
          <div className="flex items-center justify-between p-4 cursor-pointer">
            <Content />
          </div>
        </Link>
      ) : (
        <div className="flex items-center justify-between p-4">
          <Content />
        </div>
      )}
    </div>
  );
};

export default FeatureToggle;
