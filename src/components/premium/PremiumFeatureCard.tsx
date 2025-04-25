import React, { useState } from "react";
import { Lock, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PremiumFeatureCardProps {
  feature: "budget" | "loan" | "saving" | "analysis" | "assets";
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  onUpgrade?: () => void;
  cardColor?: string;
  textColor?: string;
}

const PremiumFeatureCard = ({
  feature,
  title,
  description,
  icon,
  className = "",
  onUpgrade,
  cardColor = "bg-blue-50",
  textColor = "text-blue-600",
}: PremiumFeatureCardProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate("/upgrade");
    }
  };

  return (
    <>
      <div className={`border rounded-lg overflow-hidden ${className}`}>
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2.5 rounded-lg ${cardColor}`}>
              {icon}
            </div>
            <div className="bg-gray-100 rounded-full p-1">
              <Lock className="h-3 w-3 text-gray-500" />
            </div>
          </div>
          
          <h3 className="font-semibold text-lg mb-1">{title}</h3>
          <p className="text-sm text-gray-600 mb-4 flex-grow">{description}</p>
          
          <Button
            variant="outline"
            size="sm"
            className={`mt-2 ${textColor} border-current hover:bg-opacity-10 hover:bg-current`}
            onClick={handleUpgrade}
          >
            <span>Upgrade ke Pro</span>
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default PremiumFeatureCard; 