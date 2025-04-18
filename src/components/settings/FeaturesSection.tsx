
import React from "react";
import FeatureToggle from "@/components/FeatureToggle";
import { DollarSign, PiggyBank, CreditCard } from "lucide-react";

interface FeaturesSectionProps {
  settings: {
    show_budgeting: boolean;
    show_savings: boolean;
    show_loans: boolean;
  };
  toggleLoading: Record<string, boolean>;
  onToggleChange: (setting: 'show_budgeting' | 'show_savings' | 'show_loans') => void;
}

const FeaturesSection = ({ 
  settings, 
  toggleLoading, 
  onToggleChange 
}: FeaturesSectionProps) => {
  return (
    <section className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
      <h2 className="font-semibold p-4 border-b border-gray-100">Fitur</h2>
      
      <FeatureToggle
        icon={<DollarSign className="w-4 h-4 text-blue-600" />}
        title="Budgeting"
        description="Atur dan pantau anggaran keuangan kamu"
        checked={settings.show_budgeting}
        onToggle={() => onToggleChange('show_budgeting')}
        managementLink="/budgets"
        loading={toggleLoading.show_budgeting}
      />
      
      <FeatureToggle
        icon={<PiggyBank className="w-4 h-4 text-green-600" />}
        title="Tabungan"
        description="Atur target dan pantau tabungan kamu"
        checked={settings.show_savings}
        onToggle={() => onToggleChange('show_savings')}
        managementLink="/savings"
        loading={toggleLoading.show_savings}
      />
      
      <FeatureToggle
        icon={<CreditCard className="w-4 h-4 text-red-600" />}
        title="Hutang & Piutang"
        description="Kelola data hutang dan piutang"
        checked={settings.show_loans}
        onToggle={() => onToggleChange('show_loans')}
        managementLink="/loans"
        loading={toggleLoading.show_loans}
      />
    </section>
  );
};

export default FeaturesSection;
