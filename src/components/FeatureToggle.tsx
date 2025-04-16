
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface FeatureToggleProps {
  icon: React.ReactNode;
  title: string;
  checked: boolean;
  onToggle: () => void;
  managementLink?: string;
}

const FeatureToggle = ({ icon, title, checked, onToggle, managementLink }: FeatureToggleProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          {icon}
        </div>
        <Label htmlFor={`toggle-${title}`}>{title}</Label>
      </div>
      <div className="flex items-center gap-4">
        <Switch 
          id={`toggle-${title}`}
          checked={checked} 
          onCheckedChange={onToggle}
        />
        {managementLink && (
          <Link to={managementLink} className="text-gray-500">
            <ChevronRight className="w-5 h-5" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default FeatureToggle;
