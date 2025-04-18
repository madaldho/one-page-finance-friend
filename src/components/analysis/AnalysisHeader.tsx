
import React from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface AnalysisHeaderProps {
  onRefresh: () => void;
  onExport: () => void;
}

export function AnalysisHeader({ onRefresh, onExport }: AnalysisHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Analyze your spending, income, and financial patterns
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            className="flex-1 md:flex-none"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExport}
            className="flex-1 md:flex-none"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}
