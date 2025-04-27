import React from "react";
import { Badge } from "@/components/ui/badge";

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isEnabled: boolean;
  isPro: boolean;
  onClick: () => void;
}

const FeatureItem = ({ 
  icon, 
  title, 
  description, 
  isEnabled,
  isPro,
  onClick 
}: FeatureItemProps) => {
  return (
    <div 
      className="flex items-center gap-3 p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{title}</h3>
          
          {!isPro && (
            <Badge variant="outline" className="px-2 py-0 h-5 text-xs bg-orange-100 text-orange-600 border-orange-200">
              PRO
            </Badge>
          )}
          
          {isEnabled ? (
            <Badge variant="outline" className="px-2 py-0 h-5 text-xs bg-green-100 text-green-600 border-green-200">
              Aktif
            </Badge>
          ) : (
            <Badge variant="outline" className="px-2 py-0 h-5 text-xs bg-gray-100 text-gray-500 border-gray-200">
              Nonaktif
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
};

export default FeatureItem; 