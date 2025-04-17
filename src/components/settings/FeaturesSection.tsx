
import React from "react";
import FeatureToggle from "@/components/FeatureToggle";
import { DollarSign, PiggyBank, CreditCard } from "lucide-react";

interface FeaturesSectionProps {
  settings: {
    showBudgeting: boolean;
    showSavings: boolean;
    showLoans: boolean;
  };
  toggleLoading: Record<string, boolean>;
  onToggleChange: (setting: 'showBudgeting' | 'showSavings' | 'showLoans') => void;
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
        checked={settings.showBudgeting}
        onToggle={() => onToggleChange('showBudgeting')}
        managementLink="/budgets"
        loading={toggleLoading.showBudgeting}
      />
      
      <FeatureToggle
        icon={<PiggyBank className="w-4 h-4 text-green-600" />}
        title="Tabungan"
        description="Atur target dan pantau tabungan kamu"
        checked={settings.showSavings}
        onToggle={() => onToggleChange('showSavings')}
        managementLink="/savings"
        loading={toggleLoading.showSavings}
      />
      
      <FeatureToggle
        icon={<CreditCard className="w-4 h-4 text-red-600" />}
        title="Hutang & Piutang"
        description="Kelola data hutang dan piutang"
        checked={settings.showLoans}
        onToggle={() => onToggleChange('showLoans')}
        managementLink="/loans"
        loading={toggleLoading.showLoans}
      />
    </section>
  );
};

export default FeaturesSection;
