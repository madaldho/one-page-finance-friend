
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Home, Car, DollarSign, TrendingUp, Package } from 'lucide-react';
import { Asset } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface AssetCardProps {
  asset: Asset;
}

export function AssetCard({ asset }: AssetCardProps) {
  const navigate = useNavigate();
  
  const valueChange = asset.current_value - asset.initial_value;
  const percentChange = (valueChange / asset.initial_value) * 100;
  const isPositive = valueChange >= 0;

  const getCategoryIcon = () => {
    switch (asset.category) {
      case 'property':
        return <Home className="w-5 h-5 text-indigo-500" />;
      case 'vehicle':
        return <Car className="w-5 h-5 text-blue-500" />;
      case 'gold':
        return <DollarSign className="w-5 h-5 text-yellow-500" />;
      case 'stock':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCategoryLabel = () => {
    switch (asset.category) {
      case 'property':
        return 'Properti';
      case 'vehicle':
        return 'Kendaraan';
      case 'gold':
        return 'Emas';
      case 'stock':
        return 'Saham';
      default:
        return 'Lainnya';
    }
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-md transition-shadow" 
      onClick={() => navigate(`/assets/${asset.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
              {getCategoryIcon()}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                {asset.name}
              </h3>
              <Badge variant="outline" className="mt-1 text-xs font-normal">
                {getCategoryLabel()}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm text-gray-500">Nilai Awal</span>
            <span className="font-medium">{formatCurrency(asset.initial_value)}</span>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Nilai Terkini</span>
            <span className="font-semibold text-lg">{formatCurrency(asset.current_value)}</span>
          </div>
          
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span className="font-medium">
              {percentChange.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
