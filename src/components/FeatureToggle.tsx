
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
}

const FeatureToggle = ({ 
  icon, 
  title, 
  description, 
  checked, 
  onToggle, 
  managementLink,
  disabled = false,
  loading = false
}: FeatureToggleProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <Label htmlFor={`toggle-${title}`} className="cursor-pointer">{title}</Label>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Switch 
          id={`toggle-${title}`}
          checked={checked} 
          onCheckedChange={onToggle}
          disabled={disabled || loading}
          aria-label={`Toggle ${title}`}
        />
        {managementLink && checked && (
          <Link to={managementLink} className="text-gray-500 hover:text-gray-700 transition-colors" aria-label={`Manage ${title}`}>
            <ChevronRight className="w-5 h-5" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default FeatureToggle;
