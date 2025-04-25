import React from "react";
import { Switch } from "@/components/ui/switch";
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
  
  const Content = () => (
    <>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`toggle-${title}`} className="cursor-pointer">{title}</Label>
            {extraElement && extraElement}
          </div>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div onClick={(e) => e.stopPropagation()}>
          <Switch 
            id={`toggle-${title}`}
            checked={checked} 
            onCheckedChange={onToggle}
            disabled={disabled || loading}
            aria-label={`Toggle ${title}`}
            className={loading ? "opacity-50 cursor-not-allowed" : ""}
          />
        </div>
        {managementLink && (
          <div className={`transition-colors ${checked ? "text-gray-500" : "text-gray-300"}`}>
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
