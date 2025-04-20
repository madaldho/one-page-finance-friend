
import { Asset } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react"

interface AssetCardProps {
  asset: Asset
}

export function AssetCard({ asset }: AssetCardProps) {
  const navigate = useNavigate()
  const percentageChange = ((asset.current_value - asset.initial_value) / asset.initial_value) * 100
  const isPositive = percentageChange >= 0

  const getCategoryLabel = (category: Asset["category"]) => {
    const labels = {
      property: "Properti",
      vehicle: "Kendaraan",
      gold: "Emas",
      stock: "Saham",
      other: "Lainnya"
    }
    return labels[category]
  }

  return (
    <div 
      onClick={() => navigate(`/assets/${asset.id}`)}
      className="bg-white rounded-lg shadow-sm hover:bg-gray-50 cursor-pointer"
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium">{asset.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {getCategoryLabel(asset.category)}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <div>
              <p className="text-xs text-gray-500">Nilai Awal</p>
              <p className="font-medium">{formatCurrency(asset.initial_value)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Nilai Terkini</p>
              <p className="font-medium">{formatCurrency(asset.current_value)}</p>
            </div>
            <div className={`flex items-center gap-1 ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {Math.abs(percentageChange).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  )
}
