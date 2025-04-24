import React, { useState } from "react";
import { Lock, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import UpgradeModal from "@/components/UpgradeModal";

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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Default fallback: kirim pesan WhatsApp
      const message = `Halo, saya ingin upgrade ke paket Pro untuk menggunakan fitur ${title} di aplikasi Uang Pintar.`;
      const whatsappUrl = `https://wa.me/6281387013123?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
    setShowUpgradeModal(false);
  };

  const handleStayFree = () => {
    setShowUpgradeModal(false);
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
            onClick={() => setShowUpgradeModal(true)}
          >
            <span>Upgrade ke Pro</span>
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature={feature}
        onUpgrade={handleUpgrade}
        onStayFree={handleStayFree}
      />
    </>
  );
};

export default PremiumFeatureCard; 